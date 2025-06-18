import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { sendDeliveryOTP, sendDeliveryCompletion, sendDeliveryStatusUpdate } from './notifications'

// Rider interface
export interface Rider {
  id?: string
  name: string
  email: string
  phone: string
  vehicleType: 'bike' | 'car' | 'scooter'
  vehicleNumber: string
  isActive: boolean
  currentOrders: number
  totalDeliveries: number
  rating: number
  joinedDate: Timestamp
  lastActive: Timestamp
  identityProof?: string
  identityProofFileName?: string
  identityProofType?: string
}

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Get rider by email
export const getRiderByEmail = async (email: string): Promise<Rider | null> => {
  try {
    const q = query(collection(db, 'deliveryPartners'), where('email', '==', email))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as Rider
  } catch (error) {
    console.error('Error getting rider by email:', error)
    throw error
  }
}

// Get rider by ID
export const getRiderById = async (id: string): Promise<Rider | null> => {
  try {
    const docRef = doc(db, 'deliveryPartners', id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Rider
  } catch (error) {
    console.error('Error getting rider by ID:', error)
    throw error
  }
}

// Get orders assigned to a specific rider
export const getOrdersForRider = async (riderId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'deliveryStatus'),
      where('assignedPartner', '==', riderId),
      orderBy('lastUpdated', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const orders = []
    for (const docSnapshot of querySnapshot.docs) {
      const deliveryData = docSnapshot.data()
      
      // Get customer details
      const customerQuery = query(
        collection(db, 'customers'),
        where('trackingToken', '==', deliveryData.trackingToken)
      )
      const customerSnapshot = await getDocs(customerQuery)
      
      if (!customerSnapshot.empty) {
        const customerData = customerSnapshot.docs[0].data()
        
        orders.push({
          id: docSnapshot.id,
          orderId: deliveryData.orderId,
          customerName: deliveryData.customerName,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          customerAddress: customerData.address,
          status: deliveryData.status,
          estimatedArrival: deliveryData.estimatedArrival,
          trackingToken: deliveryData.trackingToken,
          planType: customerData.planType,
          deliveryOTP: deliveryData.deliveryOTP
        })
      }
    }
    
    return orders
  } catch (error) {
    console.error('Error getting orders for rider:', error)
    throw error
  }
}

// Update delivery status
export const updateDeliveryStatus = async (deliveryId: string, updates: any) => {
  try {
    const deliveryRef = doc(db, 'deliveryStatus', deliveryId)
    
    // If status is being updated to "pickedUp", generate and send OTP
    if (updates.status === 'pickedUp') {
      // Generate OTP
      const otp = generateOTP()
      
      // Get delivery details
      const deliveryDoc = await getDocs(query(
        collection(db, 'deliveryStatus'),
        where('__name__', '==', deliveryId)
      ))
      
      if (!deliveryDoc.empty) {
        const delivery = deliveryDoc.docs[0].data()
        
        // Get customer email
        const customerDoc = await getDocs(query(
          collection(db, 'customers'),
          where('trackingToken', '==', delivery.trackingToken)
        ))
        
        if (!customerDoc.empty) {
          const customer = customerDoc.docs[0].data()
          
          // Send OTP to customer
          await sendDeliveryOTP(
            customer.email,
            customer.name,
            otp,
            delivery.orderId
          )
          
          // Update delivery with OTP
          updates.deliveryOTP = otp
        }
      }
    }
    
    // Update delivery status
    await updateDoc(deliveryRef, {
      ...updates,
      lastUpdated: Timestamp.now()
    })

    // Send email notification for status updates (except delivery completion)
    if (updates.status && updates.status !== 'delivered') {
      try {
        // Get the delivery details to send notification
        const deliveryDoc = await getDocs(query(
          collection(db, 'deliveryStatus'),
          where('__name__', '==', deliveryId)
        ))
        
        if (!deliveryDoc.empty) {
          const delivery = deliveryDoc.docs[0].data()
          
          // Get customer email
          const customerDoc = await getDocs(query(
            collection(db, 'customers'),
            where('trackingToken', '==', delivery.trackingToken)
          ))
          
          if (!customerDoc.empty) {
            const customer = customerDoc.docs[0].data()
            
            await sendDeliveryStatusUpdate(
              customer.email,
              customer.name,
              delivery.trackingToken,
              updates.status,
              delivery.estimatedArrival
            )
          }
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError)
        // Don't throw error - status update should still succeed
      }
    }
  } catch (error) {
    console.error('Error updating delivery status:', error)
    throw error
  }
}

// Verify delivery OTP
export const verifyDeliveryOTP = async (deliveryId: string, enteredOTP: string): Promise<boolean> => {
  try {
    // Get delivery details
    const deliveryDoc = await getDocs(query(
      collection(db, 'deliveryStatus'),
      where('__name__', '==', deliveryId)
    ))
    
    if (deliveryDoc.empty) {
      return false
    }
    
    const delivery = deliveryDoc.docs[0].data()
    
    // Verify OTP
    return delivery.deliveryOTP === enteredOTP
  } catch (error) {
    console.error('Error verifying OTP:', error)
    throw error
  }
}

// Send OTP to customer
export const sendOTPToCustomer = async (
  customerEmail: string,
  customerName: string,
  otp: string,
  orderId: string
): Promise<void> => {
  try {
    await sendDeliveryOTP(customerEmail, customerName, otp, orderId)
  } catch (error) {
    console.error('Error sending OTP to customer:', error)
    throw error
  }
}

// Complete delivery with OTP verification
export const completeDeliveryWithOTP = async (
  deliveryId: string,
  customerEmail: string,
  customerName: string,
  trackingToken: string,
  otp: string
): Promise<void> => {
  try {
    // Update delivery status to delivered
    const deliveryRef = doc(db, 'deliveryStatus', deliveryId)
    await updateDoc(deliveryRef, {
      status: 'delivered',
      lastUpdated: Timestamp.now(),
      deliveryOTP: otp,
      deliveredAt: Timestamp.now()
    })

    // Send delivery completion email
    await sendDeliveryCompletion(customerEmail, customerName, trackingToken, otp)

    // Update rider stats
    const deliveryDoc = await getDocs(query(
      collection(db, 'deliveryStatus'),
      where('__name__', '==', deliveryId)
    ))
    
    if (!deliveryDoc.empty) {
      const delivery = deliveryDoc.docs[0].data()
      const riderId = delivery.assignedPartner
      
      if (riderId && riderId !== 'unassigned') {
        const riderRef = doc(db, 'deliveryPartners', riderId)
        const riderDoc = await getDocs(query(
          collection(db, 'deliveryPartners'),
          where('__name__', '==', riderId)
        ))
        
        if (!riderDoc.empty) {
          const riderData = riderDoc.docs[0].data()
          await updateDoc(riderRef, {
            totalDeliveries: (riderData.totalDeliveries || 0) + 1,
            currentOrders: Math.max(0, (riderData.currentOrders || 0) - 1),
            lastActive: Timestamp.now()
          })
        }
      }
    }
  } catch (error) {
    console.error('Error completing delivery:', error)
    throw error
  }
}

// Add rider (for self-signup and admin use)
export const addRider = async (riderData: Omit<Rider, 'id' | 'joinedDate' | 'lastActive' | 'currentOrders' | 'totalDeliveries' | 'rating'>) => {
  try {
    const docRef = await addDoc(collection(db, 'deliveryPartners'), {
      ...riderData,
      currentOrders: 0,
      totalDeliveries: 0,
      rating: 5.0,
      joinedDate: Timestamp.now(),
      lastActive: Timestamp.now()
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding rider:', error)
    throw error
  }
}

// Update rider information
export const updateRider = async (riderId: string, updates: Partial<Rider>) => {
  try {
    const riderRef = doc(db, 'deliveryPartners', riderId)
    await updateDoc(riderRef, {
      ...updates,
      lastActive: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating rider:', error)
    throw error
  }
}

// Get all riders (for admin use)
export const getAllRiders = async (): Promise<Rider[]> => {
  try {
    const q = query(collection(db, 'deliveryPartners'), orderBy('name', 'asc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Rider))
  } catch (error) {
    console.error('Error getting all riders:', error)
    throw error
  }
}

// Get pending rider applications (for admin use)
export const getPendingRiders = async (): Promise<Rider[]> => {
  try {
    const q = query(
      collection(db, 'deliveryPartners'), 
      where('isActive', '==', false),
      orderBy('joinedDate', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Rider))
  } catch (error) {
    console.error('Error getting pending riders:', error)
    throw error
  }
}

// Approve rider application
export const approveRider = async (riderId: string): Promise<void> => {
  try {
    const riderRef = doc(db, 'deliveryPartners', riderId)
    await updateDoc(riderRef, {
      isActive: true,
      lastActive: Timestamp.now()
    })
  } catch (error) {
    console.error('Error approving rider:', error)
    throw error
  }
}