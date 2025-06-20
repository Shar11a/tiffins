import React, { useEffect, useState } from 'react'
import styles from './WhatWeDo.module.css'

const WhatWeDo: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const section = document.getElementById('what-we-do')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="what-we-do" className={styles.whatWeDo}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={`${styles.textContent} ${isVisible ? styles.fadeIn : ''}`}>
            <h2 className={styles.title}>What We Do</h2>
            <p className={styles.description}>
              At The Tiffin Box, we've made getting a homely meal as easy as it should be. Simply choose your preferred meal plan, subscribe monthly, and select your convenient delivery time. <span className={styles.highlight}>That's it!</span>
            </p>
            <p className={styles.description}>
              From there, we take over - bringing you hot, delicious, home-style meals right to your doorstep every single day. It's comfort food, delivered with care - just like home.
            </p>
            
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🍲</span>
                <span className={styles.featureText}>Authentic home-cooked meals</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🚚</span>
                <span className={styles.featureText}>Daily doorstep delivery</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>📅</span>
                <span className={styles.featureText}>Flexible subscription plans</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>⏰</span>
                <span className={styles.featureText}>Convenient delivery times</span>
              </div>
            </div>
          </div>
          
          <div className={`${styles.imageContent} ${isVisible ? styles.slideIn : ''}`}>
            <div className={styles.imageContainer}>
              <img 
                src="https://images.pexels.com/photos/5677332/pexels-photo-5677332.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                alt="Freshly prepared Indian tiffin meals with variety of dishes"
                className={styles.mainImage}
              />
              <div className={styles.imageBadge}>
                <span className={styles.badgeIcon}>💯</span>
                <span>Home-style Cooking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhatWeDo