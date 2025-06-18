import React, { useEffect, useState } from 'react'
import styles from './ChefStory.module.css'

const ChefStory: React.FC = () => {
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

    const section = document.getElementById('chef-story')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  const chefs = [
    {
      id: 1,
      name: 'Amma Radhika',
      location: 'Hyderabad',
      story: 'For 20 years, I\'ve been cooking with the same love I put into my family\'s meals. Every dal tadka carries the warmth of my grandmother\'s kitchen.',
      tagline: 'Cooking is my love language',
      experience: '20+ years cooking',
      mealsServed: '500+ meals served',
      image: 'https://images.pexels.com/photos/8112165/pexels-photo-8112165.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Smiling middle-aged Indian woman chef in traditional kitchen'
    },
    {
      id: 2,
      name: 'Amma Lakshmi',
      location: 'Bangalore',
      story: 'My kitchen is where magic happens daily. I believe every meal should taste like home, filled with nutrition and prepared with prayers for good health.',
      tagline: 'Food is medicine, love is the secret ingredient',
      experience: '15+ years cooking',
      mealsServed: '400+ meals served',
      image: 'https://images.pexels.com/photos/8112164/pexels-photo-8112164.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Experienced Indian woman chef preparing traditional meal'
    },
    {
      id: 3,
      name: 'Amma Priya',
      location: 'Chennai',
      story: 'From my mother\'s recipes to your table, I carry forward three generations of culinary wisdom. Each spice blend tells a story of tradition.',
      tagline: 'Tradition served fresh, daily',
      experience: '18+ years cooking',
      mealsServed: '600+ meals served',
      image: 'https://images.pexels.com/photos/8112163/pexels-photo-8112163.jpeg?auto=compress&cs=tinysrgb&w=400',
      alt: 'Traditional Indian woman chef with warm smile in home kitchen'
    }
  ]

  return (
    <section id="chef-story" className={styles.chefStory}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Meet the Amma</h2>
          <p className={styles.subtitle}>
            Every meal has a story 🍛
          </p>
        </div>
        
        <div className={styles.chefsGrid}>
          {chefs.map((chef, index) => (
            <div 
              key={chef.id}
              className={`${styles.chefCard} ${isVisible ? styles.fadeIn : ''}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className={styles.imageContainer}>
                <img 
                  src={chef.image}
                  alt={chef.alt}
                  className={styles.chefImage}
                />
                <div className={styles.locationBadge}>
                  📍 {chef.location}
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <h3 className={styles.chefName}>{chef.name}</h3>
                
                <div className={styles.trustIndicators}>
                  <span className={styles.indicator}>
                    ⏰ {chef.experience}
                  </span>
                  <span className={styles.indicator}>
                    🍽️ {chef.mealsServed}
                  </span>
                </div>
                
                <p className={styles.story}>
                  {chef.story}
                </p>
                
                <p className={styles.tagline}>
                  <span className={styles.heartIcon}>💝</span>
                  <em>"{chef.tagline}"</em>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ChefStory