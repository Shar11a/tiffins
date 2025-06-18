import React, { useState, useEffect } from 'react'
import styles from './GlasgowBanner.module.css'

const GlasgowBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsAnimated(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className={`${styles.banner} ${isAnimated ? styles.slideDown : ''}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.iconSection}>
            <span className={styles.flagIcon}>🏴󠁧󠁢󠁳󠁣󠁴󠁿</span>
            <span className={styles.tiffinIcon}>🍱</span>
          </div>
          
          <div className={styles.textSection}>
            <h2 className={styles.title}>
              Coming Soon to Glasgow! 🎉
            </h2>
            <p className={styles.message}>
              We're excited to bring authentic home-cooked tiffins to Glasgow. 
              <strong> Opening Early 2025!</strong> Be the first to know when we launch.
            </p>
          </div>
        </div>
        
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close banner"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default GlasgowBanner