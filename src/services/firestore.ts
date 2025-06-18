import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { sendSubscriptionConfirmation, sendDeliveryStatusUpdate } from './notifications'

// Generate secure tracking token
const generateTrackingToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Customer interface
export interface Customer {
  id?: string
  name: string
  email: string
  phone: string
  address: string
  deliverySlot: string
  planType: 'veg' | 'non-veg'
  studentStatus: boolean
  orderDate: Timestamp
  trackingToken: string // New field for tracking
  subscriptionType?: 'daily' | 'monthly' // New field for subscription type
  subscriptionEndDate?: Timestamp // New field for subscription end date
}

// Menu interface
export interface MenuItem {
  id?: string
  name: string
  description: string
  tag: string
  category: 'veg' | 'non-veg'
  isSpecial: boolean
  image?: string
}

// Weekly Menu interface
export interface WeeklyMeal {
  id?: string
  day: string
  vegCurry: string
  vegDry: string
  nonVegCurry: string
  rice: string
  bread: string
  dips: string
}

// Delivery Partner interface
export interface DeliveryPartner {
  id?: string
  name: string
  phone: string
  email: string
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

// Delivery Status interface
export interface DeliveryStatus {
  id?: string
  customerId: string
  customerName: string
  orderId: string
  trackingToken: string // New field for token-based access
  status: 'prepared' | 'pickedUp' | 'onTheWay' | 'delivered'
  assignedPartner: string
  currentLocation: string
  estimatedArrival: string
  lastUpdated: Timestamp
  expiresAt: Timestamp // Auto-expire after delivery + 24 hours
}

// Customer operations
export const addCustomer = async (customerData: Omit<Customer, 'id' | 'orderDate' | 'trackingToken' | 'subscriptionEndDate'>) => {
  try {
    const trackingToken = generateTrackingToken()
    
    // Calculate subscription end date if monthly
    let subscriptionEndDate = null
    if (customerData.subscriptionType === 'monthly') {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30) // 30 days from now
      subscriptionEndDate = Timestamp.fromDate(endDate)
    }
    
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      orderDate: Timestamp.now(),
      trackingToken,
      ...(subscriptionEndDate && { subscriptionEndDate })
    })
    
    // Generate order ID
    const orderId = `TFN${Date.now().toString().slice(-6)}`
    
    // Calculate pricing
    const basePrice = customerData.planType === 'veg' ? 181.99 : 259.99
    let finalPrice = basePrice
    
    // Calculate monthly price (no discount)
    if (customerData.subscriptionType === 'monthly') {
      finalPrice = basePrice * 30 // No discount for monthly
    }
    
    // Apply student discount if applicable (20%)
    if (customerData.studentStatus) {
      finalPrice = finalPrice * 0.8
    }
    
    const priceDisplay = customerData.subscriptionType === 'monthly' 
      ? `₹${finalPrice.toFixed(2)} for 30 days` 
      : `₹${basePrice.toFixed(2)}/day`
    
    // Create initial delivery status - MODIFIED to use trackingToken as document ID
    await setDoc(doc(db, 'deliveryStatus', trackingToken), {
      customerId: docRef.id,
      customerName: customerData.name,
      orderId,
      trackingToken,
      status: 'prepared',
      assignedPartner: 'unassigned',
      currentLocation: 'Kitchen - Being Prepared',
      estimatedArrival: calculateETA(customerData.deliverySlot),
      lastUpdated: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000)) // 48 hours
    })
    
    // Send confirmation email
    try {
      await sendSubscriptionConfirmation({
        customerName: customerData.name,
        customerEmail: customerData.email,
        trackingToken,
        planType: customerData.planType,
        deliverySlot: customerData.deliverySlot,
        orderId,
        dailyPrice: priceDisplay,
        studentDiscount: customerData.studentStatus,
        subscriptionType: customerData.subscriptionType || 'monthly'
      })
      console.log('Confirmation email sent successfully')
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't throw error - subscription should still succeed even if email fails
    }
    
    return { customerId: docRef.id, trackingToken }
  } catch (error) {
    console.error('Error adding customer:', error)
    throw error
  }
}

// Calculate ETA based on delivery slot
const calculateETA = (deliverySlot: string): string => {
  const today = new Date()
  const [hours, minutes] = deliverySlot.split(':').map(Number)
  today.setHours(hours, minutes, 0, 0)
  
  // If time has passed, set for tomorrow
  if (today < new Date()) {
    today.setDate(today.getDate() + 1)
  }
  
  return today.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'customers'))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Customer))
  } catch (error) {
    console.error('Error getting customers:', error)
    throw error
  }
}

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
  try {
    const customerRef = doc(db, 'customers', id)
    await updateDoc(customerRef, data)
  } catch (error) {
    console.error('Error updating customer:', error)
    throw error
  }
}

export const deleteCustomer = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'customers', id))
  } catch (error) {
    console.error('Error deleting customer:', error)
    throw error
  }
}

// Delivery Partner operations
export const addDeliveryPartner = async (partnerData: Omit<DeliveryPartner, 'id' | 'joinedDate' | 'lastActive' | 'currentOrders' | 'totalDeliveries' | 'rating'>) => {
  try {
    const docRef = await addDoc(collection(db, 'deliveryPartners'), {
      ...partnerData,
      currentOrders: 0,
      totalDeliveries: 0,
      rating: 5.0,
      joinedDate: Timestamp.now(),
      lastActive: Timestamp.now()
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding delivery partner:', error)
    throw error
  }
}

export const getDeliveryPartners = async (): Promise<DeliveryPartner[]> => {
  try {
    const q = query(
      collection(db, 'deliveryPartners'), 
      where('isActive', '==', true),
      orderBy('name', 'asc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DeliveryPartner))
  } catch (error) {
    console.error('Error getting delivery partners:', error)
    throw error
  }
}

// Get pending rider applications - Modified to avoid composite index requirement
export const getPendingRiders = async (): Promise<DeliveryPartner[]> => {
  try {
    // Query only by isActive to avoid composite index requirement
    const q = query(
      collection(db, 'deliveryPartners'), 
      where('isActive', '==', false)
    )
    const querySnapshot = await getDocs(q)
    
    // Sort by joinedDate client-side instead of server-side
    const riders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DeliveryPartner))
    
    // Sort by joinedDate descending (most recent first)
    return riders.sort((a, b) => {
      const aTime = a.joinedDate?.toMillis() || 0
      const bTime = b.joinedDate?.toMillis() || 0
      return bTime - aTime
    })
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

export const updateDeliveryPartner = async (id: string, data: Partial<DeliveryPartner>) => {
  try {
    const partnerRef = doc(db, 'deliveryPartners', id)
    await updateDoc(partnerRef, {
      ...data,
      lastActive: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating delivery partner:', error)
    throw error
  }
}

export const deleteDeliveryPartner = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'deliveryPartners', id))
  } catch (error) {
    console.error('Error deleting delivery partner:', error)
    throw error
  }
}

// Menu operations
export const addMenuItem = async (menuData: Omit<MenuItem, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'menu'), menuData)
    return docRef.id
  } catch (error) {
    console.error('Error adding menu item:', error)
    throw error
  }
}

export const getMenuItems = async (category?: 'veg' | 'non-veg'): Promise<MenuItem[]> => {
  try {
    let querySnapshot
    
    if (category) {
      const q = query(collection(db, 'menu'), where('category', '==', category))
      querySnapshot = await getDocs(q)
    } else {
      querySnapshot = await getDocs(collection(db, 'menu'))
    }
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem))
  } catch (error) {
    console.error('Error getting menu items:', error)
    throw error
  }
}

export const updateMenuItem = async (id: string, data: Partial<MenuItem>) => {
  try {
    const menuRef = doc(db, 'menu', id)
    await updateDoc(menuRef, data)
  } catch (error) {
    console.error('Error updating menu item:', error)
    throw error
  }
}

export const deleteMenuItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'menu', id))
  } catch (error) {
    console.error('Error deleting menu item:', error)
    throw error
  }
}

// Weekly Menu operations
export const getWeeklyMenu = async (): Promise<WeeklyMeal[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'weeklyMenu'))
    
    // If no weekly menu exists, create default data
    if (querySnapshot.empty) {
      const defaultMeals = [
        {
          day: "MONDAY",
          vegCurry: "TADKA DAL",
          vegDry: "MUTTER",
          nonVegCurry: "CHICKEN KARAHI",
          rice: "BOILED RICE",
          bread: "CHAPATI",
          dips: "RAITA"
        },
        {
          day: "TUESDAY",
          vegCurry: "BLACK EYE DAL",
          vegDry: "ALOO MUTTER",
          nonVegCurry: "CHICKEN TIKKA MASALA",
          rice: "BOILED RICE",
          bread: "CHAPATI",
          dips: "RAITA"
        },
        {
          day: "WEDNESDAY",
          vegCurry: "RAJMA",
          vegDry: "DUM ALOO",
          nonVegCurry: "BUTTER CHICKEN",
          rice: "BOILED RICE",
          bread: "CHAPATI",
          dips: "RAITA"
        },
        {
          day: "THURSDAY",
          vegCurry: "MIX DAL",
          vegDry: "MUTTER PANEER",
          nonVegCurry: "LAMB BIRYANI",
          rice: "BOILED RICE",
          bread: "CHAPATI",
          dips: "RAITA"
        },
        {
          day: "FRIDAY",
          vegCurry: "CHANA MASALA",
          vegDry: "MIX VEG",
          nonVegCurry: "LAMB KARAHI",
          rice: "BOILED RICE",
          bread: "CHAPATI",
          dips: "RAITA"
        },
        {
          day: "SATURDAY",
          vegCurry: "BUTTER PANEER",
          vegDry: "SWEET",
          nonVegCurry: "CHICKEN BIRYANI",
          rice: "BOILED RICE",
          bread: "CHAPATI",
          dips: "RAITA"
        }
      ];
      
      // Add default meals to Firestore
      for (const meal of defaultMeals) {
        await addDoc(collection(db, 'weeklyMenu'), meal);
      }
      
      // Fetch the newly created documents
      const newSnapshot = await getDocs(collection(db, 'weeklyMenu'));
      return newSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WeeklyMeal));
    }
    
    const meals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WeeklyMeal));
    
    // Sort meals by day of week
    const dayOrder = {
      "MONDAY": 1,
      "TUESDAY": 2,
      "WEDNESDAY": 3,
      "THURSDAY": 4,
      "FRIDAY": 5,
      "SATURDAY": 6,
      "SUNDAY": 7
    };
    
    return meals.sort((a, b) => {
      return (dayOrder[a.day as keyof typeof dayOrder] || 99) - (dayOrder[b.day as keyof typeof dayOrder] || 99);
    });
  } catch (error) {
    console.error('Error getting weekly menu:', error)
    throw error
  }
}

export const updateWeeklyMeal = async (id: string, data: Partial<WeeklyMeal>) => {
  try {
    const mealRef = doc(db, 'weeklyMenu', id)
    await updateDoc(mealRef, data)
  } catch (error) {
    console.error('Error updating weekly meal:', error)
    throw error
  }
}

export const addWeeklyMeal = async (data: Omit<WeeklyMeal, 'id'>) => {
  try {
    // Check if a meal for this day already exists
    const q = query(collection(db, 'weeklyMenu'), where('day', '==', data.day))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      // Update existing meal instead of creating a new one
      const docId = querySnapshot.docs[0].id
      await updateDoc(doc(db, 'weeklyMenu', docId), data)
      return docId
    }
    
    // Create new meal if none exists for this day
    const docRef = await addDoc(collection(db, 'weeklyMenu'), data)
    return docRef.id
  } catch (error) {
    console.error('Error adding weekly meal:', error)
    throw error
  }
}

export const deleteWeeklyMeal = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'weeklyMenu', id))
  } catch (error) {
    console.error('Error deleting weekly meal:', error)
    throw error
  }
}

// Delivery Status operations
export const addDeliveryStatus = async (deliveryData: Omit<DeliveryStatus, 'id' | 'lastUpdated'>) => {
  try {
    // Use setDoc with trackingToken as document ID instead of addDoc
    await setDoc(doc(db, 'deliveryStatus', deliveryData.trackingToken), {
      ...deliveryData,
      lastUpdated: Timestamp.now()
    })
    return deliveryData.trackingToken
  } catch (error) {
    console.error('Error adding delivery status:', error)
    throw error
  }
}

export const getDeliveryStatuses = async (): Promise<DeliveryStatus[]> => {
  try {
    const q = query(collection(db, 'deliveryStatus'), orderBy('lastUpdated', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DeliveryStatus))
  } catch (error) {
    console.error('Error getting delivery statuses:', error)
    throw error
  }
}

export const updateDeliveryStatus = async (id: string, data: Partial<DeliveryStatus>) => {
  try {
    const deliveryRef = doc(db, 'deliveryStatus', id)
    await updateDoc(deliveryRef, {
      ...data,
      lastUpdated: Timestamp.now()
    })

    // Send email notification for status updates
    if (data.status) {
      try {
        // Get the delivery details to send notification
        const deliveryDoc = await getDoc(deliveryRef)
        
        if (deliveryDoc.exists()) {
          const delivery = deliveryDoc.data() as DeliveryStatus
          
          // Get customer email
          const customerDoc = await getDocs(query(
            collection(db, 'customers'),
            where('trackingToken', '==', delivery.trackingToken)
          ))
          
          if (!customerDoc.empty) {
            const customer = customerDoc.docs[0].data() as Customer
            
            await sendDeliveryStatusUpdate(
              customer.email,
              customer.name,
              delivery.trackingToken,
              data.status,
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

// Delete delivery status
export const deleteDeliveryStatus = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'deliveryStatus', id))
  } catch (error) {
    console.error('Error deleting delivery status:', error)
    throw error
  }
}

// Token-based delivery tracking (UPDATED to use direct document access)
export const getDeliveryByToken = async (trackingToken: string): Promise<DeliveryStatus | null> => {
  try {
    // Get document directly by ID (trackingToken)
    const docRef = doc(db, 'deliveryStatus', trackingToken.toUpperCase())
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    // Check if delivery has expired
    const data = docSnap.data() as DeliveryStatus
    const now = Timestamp.now()
    
    if (data.expiresAt < now) {
      return null
    }
    
    return {
      id: docSnap.id,
      ...data
    } as DeliveryStatus
  } catch (error) {
    console.error('Error getting delivery by token:', error)
    throw error
  }
}

// Real-time token-based tracking (UPDATED to use direct document access)
export const subscribeToDeliveryByToken = (
  trackingToken: string,
  callback: (status: DeliveryStatus | null) => void
) => {
  // Listen to document directly by ID (trackingToken)
  const docRef = doc(db, 'deliveryStatus', trackingToken.toUpperCase())
  
  return onSnapshot(docRef, (docSnapshot) => {
    if (!docSnapshot.exists()) {
      callback(null)
      return
    }
    
    // Check if delivery has expired
    const data = docSnapshot.data() as DeliveryStatus
    const now = Timestamp.now()
    
    if (data.expiresAt < now) {
      callback(null)
      return
    }
    
    callback({
      id: docSnapshot.id,
      ...data
    } as DeliveryStatus)
  })
}

export const getCustomerDeliveryStatus = async (customerId: string): Promise<DeliveryStatus | null> => {
  try {
    const q = query(
      collection(db, 'deliveryStatus'), 
      where('customerId', '==', customerId),
      orderBy('lastUpdated', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const docSnapshot = querySnapshot.docs[0]
    return {
      id: docSnapshot.id,
      ...docSnapshot.data()
    } as DeliveryStatus
  } catch (error) {
    console.error('Error getting customer delivery status:', error)
    throw error
  }
}

// Legacy real-time listeners (for admin use)
export const subscribeToDeliveryStatus = (
  customerId: string, 
  callback: (status: DeliveryStatus | null) => void
) => {
  const q = query(
    collection(db, 'deliveryStatus'),
    where('customerId', '==', customerId),
    orderBy('lastUpdated', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    if (querySnapshot.empty) {
      callback(null)
      return
    }
    
    const docSnapshot = querySnapshot.docs[0]
    callback({
      id: docSnapshot.id,
      ...docSnapshot.data()
    } as DeliveryStatus)
  })
}

export const subscribeToMenuItems = (
  category: 'veg' | 'non-veg',
  callback: (items: MenuItem[]) => void
) => {
  const q = query(collection(db, 'menu'), where('category', '==', category))
  
  return onSnapshot(q, (querySnapshot) => {
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem))
    callback(items)
  })
}

// Real-time listeners for delivery partners
export const subscribeToDeliveryPartners = (
  callback: (partners: DeliveryPartner[]) => void
) => {
  const q = query(collection(db, 'deliveryPartners'), orderBy('name', 'asc'))
  
  return onSnapshot(q, (querySnapshot) => {
    const partners = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DeliveryPartner))
    callback(partners)
  })
}

// Get rider by ID
export const getRiderById = async (id: string): Promise<DeliveryPartner | null> => {
  try {
    const docRef = doc(db, 'deliveryPartners', id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as DeliveryPartner
  } catch (error) {
    console.error('Error getting rider by ID:', error)
    throw error
  }
}