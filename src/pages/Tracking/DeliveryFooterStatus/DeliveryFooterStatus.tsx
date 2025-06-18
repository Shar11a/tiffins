import React, { useEffect, useState } from 'react'
import { subscribeToDeliveryByToken, DeliveryStatus } from '../../../services/firestore'
import styles from './DeliveryFooterStatus.module.css'

interface DeliveryFooterStatusProps {
  trackingToken: string
}

const DeliveryFooterStatus: React.FC<DeliveryFooterStatusProps> = ({ trackingToken }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | null>(null)

  useEffect(() => {
    // Show the footer after a short delay for smooth entrance
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Subscribe to delivery updates
  useEffect(() => {
    if (!trackingToken) return

    const unsubscribe = subscribeToDeliveryByToken(trackingToken, (status) => {
      setDeliveryStatus(status)
    })

    return unsubscribe
  }, [trackingToken])

  const handleSupportClick = () => {
    setShowSupportModal(true)
  }

  const closeSupportModal = () => {
    setShowSupportModal(false)
  }

  const getStatusInfo = (status: string) => {
    const statusMap = {
      prepared: { icon: '👨‍🍳', text: 'Being Prepared', isMoving: false },
      pickedUp: { icon: '📦', text: 'Picked Up', isMoving: false },
      onTheWay: { icon: '🚚', text: 'On the Way', isMoving: true },
      delivered: { icon: '✅', text: 'Delivered', isMoving: false }
    }
    return statusMap[status as keyof typeof statusMap] || { icon: '📦', text: status, isMoving: false }
  }

  const getETAMinutes = (estimatedArrival: string) => {
    try {
      const now = new Date()
      const eta = new Date()
      const [time, period] = estimatedArrival.split(' ')
      const [hours, minutes] = time.split(':').map(Number)
      
      let adjustedHours = hours
      if (period === 'PM' && hours !== 12) adjustedHours += 12
      if (period === 'AM' && hours === 12) adjustedHours = 0
      
      eta.setHours(adjustedHours, minutes, 0, 0)
      
      const diffMs = eta.getTime() - now.getTime()
      const diffMins = Math.max(0, Math.round(diffMs / (1000 * 60)))
      
      return diffMins
    } catch {
      return 15 // Default fallback
    }
  }

  if (!deliveryStatus) {
    return null
  }

  const statusInfo = getStatusInfo(deliveryStatus.status)
  const etaMinutes = getETAMinutes(deliveryStatus.estimatedArrival)

  return (
    <>
      <div className={`${styles.deliveryFooterStatus} ${isVisible ? styles.fadeIn : ''}`}>
        <div className={styles.container}>
          <div className={styles.content}>
            {/* Status Section */}
            <div className={styles.statusSection}>
              <div className={styles.statusIcon}>
                <span className={`${styles.iconEmoji} ${statusInfo.isMoving ? styles.moving : ''}`}>
                  {statusInfo.icon}
                </span>
              </div>
              <div className={styles.statusContent}>
                <span className={styles.statusLabel}>{statusInfo.text}</span>
                <span className={styles.statusSubtext}>
                  {deliveryStatus.status === 'delivered' 
                    ? 'Enjoy your meal!' 
                    : 'Your tiffin is coming!'}
                </span>
              </div>
            </div>

            {/* ETA Section */}
            <div className={styles.etaSection}>
              <div className={styles.etaBadge}>
                <span className={styles.etaIcon}>⏰</span>
                <div className={styles.etaContent}>
                  <span className={styles.etaLabel}>
                    {deliveryStatus.status === 'delivered' ? 'Delivered at' : 'Arriving in'}
                  </span>
                  <span className={`${styles.etaTime} ${deliveryStatus.status !== 'delivered' ? styles.shimmer : ''}`}>
                    {deliveryStatus.status === 'delivered' 
                      ? deliveryStatus.estimatedArrival
                      : `${etaMinutes} minutes`}
                  </span>
                </div>
              </div>
              <div className={styles.etaDetails}>
                <span className={styles.etaExact}>
                  {deliveryStatus.status === 'delivered' 
                    ? 'Thank you for choosing TiffinBox!'
                    : `ETA: ${deliveryStatus.estimatedArrival}`}
                </span>
              </div>
            </div>

            {/* Support Section */}
            <div className={styles.supportSection}>
              <button 
                className={styles.supportButton}
                onClick={handleSupportClick}
                aria-label="Get help with your delivery"
              >
                <span className={styles.supportIcon}>❓</span>
                <span className={styles.supportText}>Need help?</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className={styles.modalOverlay} onClick={closeSupportModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>How can we help? 🤝</h3>
              <button 
                className={styles.closeButton}
                onClick={closeSupportModal}
                aria-label="Close support modal"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.supportOptions}>
                <button 
                  className={styles.supportOption}
                  onClick={() => window.open('tel:+919876543210', '_self')}
                >
                  <span className={styles.optionIcon}>📞</span>
                  <div className={styles.optionContent}>
                    <span className={styles.optionTitle}>Call Support</span>
                    <span className={styles.optionSubtext}>+91 98765 43210</span>
                  </div>
                </button>
                <button 
                  className={styles.supportOption}
                  onClick={() => window.open('https://wa.me/919876543210', '_blank')}
                >
                  <span className={styles.optionIcon}>💬</span>
                  <div className={styles.optionContent}>
                    <span className={styles.optionTitle}>WhatsApp Chat</span>
                    <span className={styles.optionSubtext}>Quick response</span>
                  </div>
                </button>
                <button 
                  className={styles.supportOption}
                  onClick={() => window.open('mailto:support@tiffinbox.com', '_self')}
                >
                  <span className={styles.optionIcon}>📧</span>
                  <div className={styles.optionContent}>
                    <span className={styles.optionTitle}>Email Us</span>
                    <span className={styles.optionSubtext}>support@tiffinbox.com</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DeliveryFooterStatus