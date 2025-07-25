import React, { useEffect, useState } from 'react'
import styles from './WhatYouGet.module.css'
import mutterPaneerImage from '../../../assets/mutter-paneer.png'
import dalRiceImage from '../../../assets/dal-rice.png'
import rajmaChawalImage from '../../../assets/rajma-chawal.png'
import lambBiryaniImage from '../../../assets/lamb-biryani.png'
import mixVegImage from '../../../assets/mix-veg.png'
import chickenRiceImage from '../../../assets/chicken-rice.png'
import alooMutterImage from '../../../assets/aloo-mutter-roti.png'

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
      name: 'Mutter Paneer + Chapati',
      tag: 'Monday Special',
      image: mutterPaneerImage,
      alt: 'Paneer masala curry with fresh phulka bread'
    },
    {
      id: 2,
      name: 'Tadka Dal + Boiled Rice',
      tag: 'High Protein',
      image: dalRiceImage,
      alt: 'Creamy dal makhani with aromatic jeera rice'
    },
    {
      id: 3,
      name: 'Rajma Chawal',
      tag: 'Tuesday Favorite',
      image: rajmaChawalImage,
      alt: 'Traditional rajma curry with steamed rice'
    },
    {
      id: 4,
      name: 'Lamb Biryani',
      tag: 'Weekend Special',
      image: lambBiryaniImage,
      alt: 'Spicy chole with fluffy bhature bread'
    },
    {
      id: 5,
      name: 'Aloo Mutter + Chapati',
      tag: 'Light & Healthy',
      image: alooMutterImage,
      alt: 'Aloo gobi sabzi with fresh roti'
    },
    {
      id: 6,
      name: 'Chicken Curry + Rice',
      tag: 'Non-Veg Special',
      image: chickenRiceImage,
      alt: 'Homestyle chicken curry with basmati rice'
    },
    {
      id: 7,
      name: 'Mixed Veg + Chapati',
      tag: 'Daily Comfort',
      image: mixVegImage,
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