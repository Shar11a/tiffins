import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Hero.module.css'

const Hero: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleStartSubscription = () => {
    navigate('/subscription')
  }

  const handleViewMenu = () => {
    navigate('/menu')
  }

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={`${styles.textContent} ${isVisible ? styles.fadeIn : ''}`}>
            <h1 className={styles.title}>
              Home-cooked meals,<br />
              <span className={styles.highlight}>delivered with love</span>
            </h1>
            <p className={styles.subtitle}>
              Experience the warmth of traditional home cooking with our daily tiffin service. 
              Fresh, nutritious meals prepared by experienced home chefs, delivered right to your doorstep.
            </p>
            <div className={styles.ctaButtons}>
              <button 
                className={styles.primaryBtn}
                onClick={handleStartSubscription}
              >
                Start Your Subscription
              </button>
              <button 
                className={styles.secondaryBtn}
                onClick={handleViewMenu}
              >
                View Today's Menu
              </button>
            </div>
            <div className={styles.trustIndicators}>
              <div className={styles.indicator}>
                <span className={styles.number}>500+</span>
                <span className={styles.label}>Happy Customers</span>
              </div>
              <div className={styles.indicator}>
                <span className={styles.number}>100%</span>
                <span className={styles.label}>Fresh Daily</span>
              </div>
              <div className={styles.indicator}>
                <span className={styles.number}>30min</span>
                <span className={styles.label}>Delivery Time</span>
              </div>
            </div>
          </div>
          <div className={`${styles.imageContent} ${isVisible ? styles.slideIn : ''}`}>
            <div className={styles.heroImage}>
              <img 
                src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800" 
                alt="Traditional home-cooked Indian meal with rice, dal, vegetables and roti"
                className={styles.mainImage}
              />
              <div className={styles.floatingCard}>
                <div className={styles.cardContent}>
                  <div className={styles.cardIcon}>🍱</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero