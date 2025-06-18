import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './FinalCTA.module.css'

const FinalCTA: React.FC = () => {
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

    const section = document.getElementById('final-cta')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  const handleGetMyTiffin = () => {
    navigate('/subscription')
  }

  return (
    <section id="final-cta" className={styles.finalCta}>
      <div className={styles.container}>
        <div className={`${styles.content} ${isVisible ? styles.fadeIn : ''}`}>
          <div className={styles.floatingIcon}>
            🍱
          </div>
          
          <h2 className={styles.title}>
            Get Your Tiffin, Just Like Home ❤️
          </h2>
          
          <p className={styles.subtitle}>
            Join 500+ happy customers enjoying hot meals every day
          </p>
          
          <button 
            className={styles.ctaButton}
            onClick={handleGetMyTiffin}
          >
            Get My Tiffin
          </button>
          
          <div className={styles.trustElements}>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🏠</span>
              <span className={styles.trustText}>Home-style cooking</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>⚡</span>
              <span className={styles.trustText}>Fresh daily</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>💝</span>
              <span className={styles.trustText}>Made with love</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA