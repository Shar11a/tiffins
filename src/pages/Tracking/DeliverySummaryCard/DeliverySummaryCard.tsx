import React, { useEffect, useState } from 'react'
import { subscribeToDeliveryByToken, DeliveryStatus } from '../../../services/firestore'
import styles from './DeliverySummaryCard.module.css'

interface DeliverySummaryCardProps {
  trackingToken: string
  onBackToSearch: () => void
}

const DeliverySummaryCard: React.FC<DeliverySummaryCardProps> = ({ 
  trackingToken, 
  onBackToSearch 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const section = document.getElementById('delivery-summary-card')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  // Subscribe to delivery status updates using token
  useEffect(() => {
    if (!trackingToken) {
      setDeliveryStatus(null)
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToDeliveryByToken(trackingToken, (status) => {
      setDeliveryStatus(status)
      setLoading(false)
    })

    // Set a timeout to stop loading if no data is found
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [trackingToken])

  if (loading) {
    return (
      <section id="delivery-summary-card" className={styles.deliverySummaryCard}>
        <div className={styles.container}>
          <div className={`${styles.card} ${isVisible ? styles.fadeIn : ''}`}>
            <div className={styles.header}>
              <h2 className={styles.title}>Loading your delivery status...</h2>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!deliveryStatus) {
    return (
      <section id="delivery-summary-card" className={styles.deliverySummaryCard}>
        <div className={styles.container}>
          <div className={`${styles.card} ${isVisible ? styles.fadeIn : ''}`}>
            <div className={styles.header}>
              <h2 className={styles.title}>Tracking Code Not Found</h2>
              <p className={styles.estimatedTime}>
                <span className={styles.timeIcon}>❌</span>
                This tracking code is invalid or has expired.
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                Please check your tracking code and try again.
              </p>
              <button 
                className={styles.primaryButton}
                onClick={onBackToSearch}
              >
                <span className={styles.buttonIcon}>🔙</span>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="delivery-summary-card" className={styles.deliverySummaryCard}>
      <div className={styles.container}>
        <div className={`${styles.card} ${isVisible ? styles.fadeIn : ''}`}>
          {/* Back Button */}
          <button 
            className={styles.backButton}
            onClick={onBackToSearch}
            aria-label="Back to tracking search"
          >
            ← Back to Search
          </button>

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>
              Your Tiffin is on the Way! 🍱
            </h2>
            <p className={styles.estimatedTime}>
              <span className={styles.timeIcon}>🕒</span>
              Estimated Arrival: <strong>{deliveryStatus.estimatedArrival}</strong>
            </p>
          </div>

          {/* Status Section */}
          <div className={styles.statusSection}>
            <div className={styles.currentStatus}>
              <div className={styles.statusIcon}>📦</div>
              <div className={styles.statusContent}>
                <span className={styles.statusLabel}>Current Status</span>
                <span className={styles.statusValue}>
                  {deliveryStatus.status === 'prepared' ? 'Being Prepared' :
                   deliveryStatus.status === 'pickedUp' ? 'Picked Up' :
                   deliveryStatus.status === 'onTheWay' ? 'On the Way' :
                   'Delivered'}
                </span>
              </div>
            </div>
            
            <div className={styles.liveTrackingBadge}>
              <div className={styles.liveDot}></div>
              <span className={styles.liveText}>Live Tracking</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <div className={styles.itemIcon}>🍛</div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>Customer</span>
                  <span className={styles.itemValue}>{deliveryStatus.customerName}</span>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.itemIcon}>📍</div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>Location</span>
                  <span className={styles.itemValue}>{deliveryStatus.currentLocation}</span>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.itemIcon}>🧾</div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>Order ID</span>
                  <span className={styles.itemValue}>{deliveryStatus.orderId}</span>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.itemIcon}>🚚</div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>Delivery Partner</span>
                  <span className={styles.itemValue}>
                    {deliveryStatus.assignedPartner === 'unassigned' 
                      ? 'Being Assigned' 
                      : deliveryStatus.assignedPartner}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button className={styles.primaryButton}>
              <span className={styles.buttonIcon}>📞</span>
              Call Support
            </button>
            <button className={styles.secondaryButton}>
              <span className={styles.buttonIcon}>💬</span>
              WhatsApp Help
            </button>
          </div>

          {/* Progress Indicator */}
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>Delivery Progress</span>
              <span className={styles.progressPercentage}>
                {deliveryStatus.status === 'delivered' ? '100%' : 
                 deliveryStatus.status === 'onTheWay' ? '75%' :
                 deliveryStatus.status === 'pickedUp' ? '50%' : '25%'}
              </span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{
                  width: deliveryStatus.status === 'delivered' ? '100%' : 
                         deliveryStatus.status === 'onTheWay' ? '75%' :
                         deliveryStatus.status === 'pickedUp' ? '50%' : '25%'
                }}
              ></div>
            </div>
            <div className={styles.progressSteps}>
              <div className={`${styles.step} ${styles.completed}`}>
                <div className={styles.stepIcon}>✅</div>
                <span className={styles.stepLabel}>Prepared</span>
              </div>
              <div className={`${styles.step} ${deliveryStatus.status !== 'prepared' ? styles.completed : ''}`}>
                <div className={styles.stepIcon}>
                  {deliveryStatus.status !== 'prepared' ? '✅' : '📦'}
                </div>
                <span className={styles.stepLabel}>Picked Up</span>
              </div>
              <div className={`${styles.step} ${deliveryStatus.status === 'onTheWay' || deliveryStatus.status === 'delivered' ? styles.active : ''}`}>
                <div className={styles.stepIcon}>
                  {deliveryStatus.status === 'delivered' ? '✅' : 
                   deliveryStatus.status === 'onTheWay' ? '🚚' : '⏳'}
                </div>
                <span className={styles.stepLabel}>On the Way</span>
              </div>
              <div className={`${styles.step} ${deliveryStatus.status === 'delivered' ? styles.completed : ''}`}>
                <div className={styles.stepIcon}>
                  {deliveryStatus.status === 'delivered' ? '✅' : '🏠'}
                </div>
                <span className={styles.stepLabel}>Delivered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DeliverySummaryCard