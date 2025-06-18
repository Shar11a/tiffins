import React, { useEffect, useState } from 'react'
import styles from './WhatYouGet.module.css'

const WhatYouGet: React.FC = () => {
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

    const section = document.getElementById('what-you-get')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  const meals = [
    {
      id: 1,
      name: 'Paneer Masala + Phulka',
      tag: 'Monday Special',
      image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Paneer masala curry with fresh phulka bread'
    },
    {
      id: 2,
      name: 'Dal Makhani + Jeera Rice',
      tag: 'High Protein',
      image: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Creamy dal makhani with aromatic jeera rice'
    },
    {
      id: 3,
      name: 'Rajma Chawal',
      tag: 'Tuesday Favorite',
      image: 'https://images.pexels.com/photos/5560756/pexels-photo-5560756.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Traditional rajma curry with steamed rice'
    },
    {
      id: 4,
      name: 'Chole Bhature',
      tag: 'Weekend Special',
      image: 'https://images.pexels.com/photos/5560748/pexels-photo-5560748.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Spicy chole with fluffy bhature bread'
    },
    {
      id: 5,
      name: 'Aloo Gobi + Roti',
      tag: 'Light & Healthy',
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Aloo gobi sabzi with fresh roti'
    },
    {
      id: 6,
      name: 'Chicken Curry + Rice',
      tag: 'Non-Veg Special',
      image: 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Homestyle chicken curry with basmati rice'
    },
    {
      id: 7,
      name: 'Mixed Veg + Chapati',
      tag: 'Daily Comfort',
      image: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Mixed vegetable curry with soft chapati'
    }
  ]

  return (
    <section id="what-you-get" className={styles.whatYouGet}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>What You Get</h2>
          <p className={styles.subtitle}>
            A peek at what's cooking this week 🍲
          </p>
        </div>
        
        <div className={styles.mealsGrid}>
          {meals.map((meal, index) => (
            <div 
              key={meal.id}
              className={`${styles.mealCard} ${isVisible ? styles.fadeIn : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.imageContainer}>
                <img 
                  src={meal.image}
                  alt={meal.alt}
                  className={styles.mealImage}
                />
                <div className={styles.overlay}>
                  <div className={styles.overlayContent}>
                    <h3 className={styles.mealName}>{meal.name}</h3>
                    <span className={styles.mealTag}>{meal.tag}</span>
                  </div>
                </div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.mealTitle}>{meal.name}</h3>
                <span className={styles.tag}>{meal.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhatYouGet