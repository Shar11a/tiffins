import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './DeliveryPreview.module.css'

const DeliveryPreview: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const section = document.getElementById('delivery-preview')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  const handleSeeMyTiffin = () => {
    navigate('/tracking')
  }

  return (
    <section id="delivery-preview" className={styles.deliveryPreview}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Track Your Tiffin in Real Time</h2>
          <p className={styles.subtitle}>
            Never wonder where your meal is again 📍
          </p>
        </div>
        
        <div className={styles.content}>
          <div className={`${styles.mapContent} ${isVisible ? styles.slideUp : ''}`}>
            <div className={styles.mapContainer}>
              <img 
                src="https://images.pexels.com/photos/7876050/pexels-photo-7876050.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Real-time delivery tracking map showing tiffin location"
                className={styles.mapImage}
              />
              <div className={styles.mapOverlay}>
                <div className={styles.deliveryPin}>
                  <div className={styles.pinIcon}>🚚</div>
                  <div className={styles.pinPulse}></div>
                </div>
                <div className={styles.statusBadge}>
                  <span className={styles.statusIcon}>⏱️</span>
                  <span className={styles.statusText}>Tiffin is 5 mins away!</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`${styles.featureContent} ${isVisible ? styles.fadeIn : ''}`}>
            <div className={styles.previewCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>📦</div>
                <h3 className={styles.cardTitle}>Delivery Tracker Preview</h3>
              </div>
              
              <div className={styles.featureList}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>📍</span>
                  <span className={styles.featureText}>Live location of your tiffin</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>⏰</span>
                  <span className={styles.featureText}>ETA countdown</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>📞</span>
                  <span className={styles.featureText}>Driver contact</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>📊</span>
                  <span className={styles.featureText}>Daily delivery history</span>
                </div>
              </div>
              
              <div className={styles.liveStatus}>
                <div className={styles.statusIndicator}>
                  <div className={styles.liveDot}></div>
                  <span className={styles.liveText}>Live Tracking Active</span>
                </div>
                <div className={styles.etaDisplay}>
                  <span className={styles.etaLabel}>ETA:</span>
                  <span className={styles.etaTime}>12:45 PM</span>
                </div>
              </div>
              
              <button 
                className={styles.ctaButton}
                onClick={handleSeeMyTiffin}
              >
                See My Tiffin
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DeliveryPreview