import React, { useEffect, useState } from 'react'
import { subscribeToDeliveryByToken, DeliveryStatus } from '../../../services/firestore'
import styles from './DeliveryMap.module.css'

interface DeliveryMapProps {
  trackingToken: string
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ trackingToken }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [useRealMap, setUseRealMap] = useState(true)
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryStatus | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const section = document.getElementById('delivery-map')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  // Subscribe to delivery updates
  useEffect(() => {
    if (!trackingToken) return

    const unsubscribe = subscribeToDeliveryByToken(trackingToken, (status) => {
      setDeliveryInfo(status)
    })

    return unsubscribe
  }, [trackingToken])

  if (!deliveryInfo) {
    return (
      <section id="delivery-map" className={styles.deliveryMap}>
        <div className={styles.container}>
          <div className={`${styles.header} ${isVisible ? styles.fadeIn : ''}`}>
            <h2 className={styles.title}>Loading Map...</h2>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="delivery-map" className={styles.deliveryMap}>
      <div className={styles.container}>
        {/* Header */}
        <div className={`${styles.header} ${isVisible ? styles.fadeIn : ''}`}>
          <h2 className={styles.title}>Live Delivery View</h2>
          <p className={styles.subtitle}>
            Follow your tiffin as it makes its way to you.
          </p>
        </div>

        {/* Map Container */}
        <div className={`${styles.mapWrapper} ${isVisible ? styles.slideUp : ''}`}>
          <div className={styles.mapCard}>
            {useRealMap ? (
              // Real Google Maps Embed
              <div className={styles.mapContainer}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.8267!2d77.5946!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzE3LjgiTiA3N8KwMzUnNDAuNiJF!5e0!3m2!1sen!2sin!4v1234567890"
                  className={styles.mapIframe}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Live delivery tracking map"
                />
                
                {/* Map Overlays */}
                <div className={styles.mapOverlays}>
                  {/* Delivery Pin */}
                  <div className={styles.deliveryPin}>
                    <div className={styles.pinIcon}>🍱</div>
                    <div className={styles.pinPulse}></div>
                  </div>
                  
                  {/* Location Badge */}
                  <div className={styles.locationBadge}>
                    <span className={styles.locationIcon}>📍</span>
                    <span className={styles.locationText}>{deliveryInfo.currentLocation}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Fallback Map Image
              <div className={styles.mapContainer}>
                <img 
                  src="https://images.pexels.com/photos/7876050/pexels-photo-7876050.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Delivery tracking map showing current location"
                  className={styles.mapImage}
                />
                
                {/* Map Overlays */}
                <div className={styles.mapOverlays}>
                  {/* Delivery Pin */}
                  <div className={styles.deliveryPin}>
                    <div className={styles.pinIcon}>🍱</div>
                    <div className={styles.pinPulse}></div>
                  </div>
                  
                  {/* Location Badge */}
                  <div className={styles.locationBadge}>
                    <span className={styles.locationIcon}>📍</span>
                    <span className={styles.locationText}>{deliveryInfo.currentLocation}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card Overlay */}
            <div className={styles.infoCardOverlay}>
              <div className={styles.infoCard}>
                <div className={styles.etaSection}>
                  <div className={styles.etaIcon}>⏰</div>
                  <div className={styles.etaContent}>
                    <span className={styles.etaLabel}>ETA</span>
                    <span className={styles.etaTime}>{deliveryInfo.estimatedArrival}</span>
                  </div>
                </div>
                
                <div className={styles.driverSection}>
                  <div className={styles.driverIcon}>👨‍🚚</div>
                  <div className={styles.driverContent}>
                    <span className={styles.driverLabel}>Partner</span>
                    <span className={styles.driverName}>
                      {deliveryInfo.assignedPartner === 'unassigned' 
                        ? 'Being Assigned' 
                        : deliveryInfo.assignedPartner}
                    </span>
                  </div>
                  <button 
                    className={styles.phoneButton}
                    onClick={() => window.open('tel:+919876543210', '_self')}
                    aria-label="Call support"
                  >
                    📞
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Map Toggle (for demo purposes) */}
          <div className={styles.mapControls}>
            <button 
              className={`${styles.toggleButton} ${useRealMap ? styles.active : ''}`}
              onClick={() => setUseRealMap(true)}
            >
              📍 Live Map
            </button>
            <button 
              className={`${styles.toggleButton} ${!useRealMap ? styles.active : ''}`}
              onClick={() => setUseRealMap(false)}
            >
              🖼️ Static View
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className={`${styles.additionalInfo} ${isVisible ? styles.fadeIn : ''}`}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🚚</span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Vehicle</span>
                <span className={styles.infoValue}>Bike - KA 01 AB 1234</span>
              </div>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📏</span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Distance</span>
                <span className={styles.infoValue}>2.3 km away</span>
              </div>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🕒</span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Last Updated</span>
                <span className={styles.infoValue}>
                  {deliveryInfo.lastUpdated.toDate().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DeliveryMap