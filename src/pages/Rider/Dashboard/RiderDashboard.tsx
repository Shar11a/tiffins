import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../../firebase/config'
import { useAuth } from '../../../contexts/AuthContext'
import { 
  getRiderByEmail, 
  getOrdersForRider, 
  updateDeliveryStatus,
  verifyDeliveryOTP,
  completeDeliveryWithOTP
} from '../../../services/riderService'
import styles from './RiderDashboard.module.css'

interface RiderOrder {
  id: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  status: 'prepared' | 'pickedUp' | 'onTheWay' | 'delivered'
  estimatedArrival: string
  trackingToken: string
  planType: 'veg' | 'non-veg'
  deliveryOTP?: string
}

interface RiderStats {
  todayDeliveries: number
  totalDeliveries: number
  activeOrders: number
  rating: number
}

const RiderDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [rider, setRider] = useState<any>(null)
  const [orders, setOrders] = useState<RiderOrder[]>([])
  const [stats, setStats] = useState<RiderStats>({
    todayDeliveries: 0,
    totalDeliveries: 0,
    activeOrders: 0,
    rating: 5.0
  })
  const [loading, setLoading] = useState(true)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<RiderOrder | null>(null)
  const [enteredOTP, setEnteredOTP] = useState('')
  const [verifyingOTP, setVerifyingOTP] = useState(false)
  const [otpError, setOTPError] = useState('')

  useEffect(() => {
    if (currentUser?.email) {
      loadRiderData()
    }
  }, [currentUser])

  const loadRiderData = async () => {
    try {
      setLoading(true)
      
      if (!currentUser?.email) return

      // Get rider information
      const riderData = await getRiderByEmail(currentUser.email)
      if (!riderData) {
        navigate('/rider/login')
        return
      }
      
      setRider(riderData)

      // Get orders assigned to this rider
      const riderOrders = await getOrdersForRider(riderData.id!)
      setOrders(riderOrders)

      // Calculate stats
      const activeOrders = riderOrders.filter(order => order.status !== 'delivered').length
      const todayDeliveries = riderOrders.filter(order => 
        order.status === 'delivered' && 
        new Date().toDateString() === new Date().toDateString()
      ).length

      setStats({
        todayDeliveries,
        totalDeliveries: riderData.totalDeliveries || 0,
        activeOrders,
        rating: riderData.rating || 5.0
      })

    } catch (error) {
      console.error('Error loading rider data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/rider/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDeliveryStatus(orderId, { status: newStatus })
      await loadRiderData() // Refresh data
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    }
  }

  const handleDeliveryComplete = (order: RiderOrder) => {
    setSelectedOrder(order)
    setEnteredOTP('')
    setOTPError('')
    setShowOTPModal(true)
  }

  const verifyOTP = async () => {
    if (!selectedOrder || !enteredOTP) return
    
    try {
      setVerifyingOTP(true)
      setOTPError('')
      
      // Verify OTP
      const isValid = await verifyDeliveryOTP(selectedOrder.id, enteredOTP)
      
      if (isValid) {
        // Complete delivery
        await completeDeliveryWithOTP(
          selectedOrder.id,
          selectedOrder.customerEmail,
          selectedOrder.customerName,
          selectedOrder.trackingToken,
          enteredOTP
        )
        
        setShowOTPModal(false)
        setSelectedOrder(null)
        setEnteredOTP('')
        
        // Refresh data
        await loadRiderData()
        
        alert('✅ Delivery completed successfully! Customer has been notified.')
      } else {
        setOTPError('Invalid OTP. Please check and try again.')
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      setOTPError('Failed to verify OTP. Please try again.')
    } finally {
      setVerifyingOTP(false)
    }
  }

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  if (loading) {
    return (
      <div className={styles.riderDashboard}>
        <div className={styles.container}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <h2>Loading Dashboard...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!rider) {
    return (
      <div className={styles.riderDashboard}>
        <div className={styles.container}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
            <h2>Access Denied</h2>
            <p>You are not registered as a delivery partner.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.riderDashboard}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.welcomeSection}>
              <div className={styles.riderAvatar}>🏍️</div>
              <div className={styles.welcomeText}>
                <h1 className={styles.welcomeTitle}>Welcome back, {rider.name}!</h1>
                <p className={styles.welcomeSubtitle}>Ready to deliver some delicious meals?</p>
              </div>
            </div>
            <button className={styles.logoutButton} onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📦</span>
              <div className={styles.statValue}>{stats.activeOrders}</div>
              <div className={styles.statLabel}>Active Orders</div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>✅</span>
              <div className={styles.statValue}>{stats.todayDeliveries}</div>
              <div className={styles.statLabel}>Today's Deliveries</div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>🏆</span>
              <div className={styles.statValue}>{stats.totalDeliveries}</div>
              <div className={styles.statLabel}>Total Deliveries</div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⭐</span>
              <div className={styles.statValue}>{stats.rating.toFixed(1)}</div>
              <div className={styles.statLabel}>Rating</div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className={styles.ordersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📋</span>
              Your Orders
            </h2>
            <button className={styles.refreshButton} onClick={loadRiderData}>
              🔄 Refresh
            </button>
          </div>

          <div className={styles.ordersList}>
            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📦</span>
                <div className={styles.emptyText}>No orders assigned</div>
                <div className={styles.emptySubtext}>
                  Check back later for new delivery assignments
                </div>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderId}>#{order.orderId}</div>
                      <div className={styles.customerName}>{order.customerName}</div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                      {order.status === 'prepared' ? '👨‍🍳 Prepared' :
                       order.status === 'pickedUp' ? '📦 Picked Up' :
                       order.status === 'onTheWay' ? '🚚 On the Way' :
                       '✅ Delivered'}
                    </span>
                  </div>

                  <div className={styles.orderDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Plan Type</span>
                      <span className={styles.detailValue}>
                        {order.planType === 'veg' ? '🥬 Vegetarian' : '🍗 Non-Vegetarian'}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>ETA</span>
                      <span className={styles.detailValue}>{order.estimatedArrival}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Phone</span>
                      <span className={styles.detailValue}>{order.customerPhone}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Tracking</span>
                      <span className={styles.detailValue}>{order.trackingToken}</span>
                    </div>
                  </div>

                  <div className={styles.customerAddress}>
                    <div className={styles.addressLabel}>
                      📍 Delivery Address
                    </div>
                    <div className={styles.addressText}>{order.customerAddress}</div>
                  </div>

                  <div className={styles.orderActions}>
                    {order.status === 'prepared' && (
                      <button
                        className={`${styles.actionButton} ${styles.pickupButton}`}
                        onClick={() => handleStatusUpdate(order.id, 'pickedUp')}
                      >
                        📦 Mark as Picked Up
                      </button>
                    )}
                    
                    {order.status === 'pickedUp' && (
                      <button
                        className={`${styles.actionButton} ${styles.onWayButton}`}
                        onClick={() => handleStatusUpdate(order.id, 'onTheWay')}
                      >
                        🚚 Start Delivery
                      </button>
                    )}
                    
                    {order.status === 'onTheWay' && (
                      <button
                        className={`${styles.actionButton} ${styles.deliverButton}`}
                        onClick={() => handleDeliveryComplete(order)}
                      >
                        ✅ Complete Delivery
                      </button>
                    )}
                    
                    <button
                      className={`${styles.actionButton} ${styles.callButton}`}
                      onClick={() => handleCallCustomer(order.customerPhone)}
                    >
                      📞 Call Customer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>🔐 Verify Delivery OTP</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowOTPModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.otpSection}>
                <p className={styles.otpInstructions}>
                  📱 Please ask <strong>{selectedOrder.customerName}</strong> to provide the OTP they received via email when you picked up their order.
                  <br /><br />
                  🏠 Enter the OTP below to confirm delivery.
                </p>
                
                <div className={styles.otpInputContainer}>
                  <label htmlFor="otp" className={styles.otpLabel}>Enter OTP:</label>
                  <input
                    type="text"
                    id="otp"
                    value={enteredOTP}
                    onChange={(e) => {
                      setEnteredOTP(e.target.value.replace(/\D/g, '').substring(0, 6))
                      if (otpError) setOTPError('')
                    }}
                    className={styles.otpInput}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
                
                {otpError && (
                  <div className={styles.otpError}>
                    ⚠️ {otpError}
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button 
                  className={styles.confirmButton}
                  onClick={verifyOTP}
                  disabled={enteredOTP.length !== 6 || verifyingOTP}
                >
                  {verifyingOTP ? 'Verifying...' : '✅ Confirm Delivery'}
                </button>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowOTPModal(false)}
                  disabled={verifyingOTP}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RiderDashboard