import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMenuItems, MenuItem } from '../../../services/firestore'
import styles from './MenuToggleTable.module.css'

const MenuToggleTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'veg' | 'non-veg'>('veg')
  const [isVisible, setIsVisible] = useState(false)
  const [meals, setMeals] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

    const section = document.getElementById('menu-toggle-table')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  // Load menu items from Firestore
  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const items = await getMenuItems()
      setMeals(items)
    } catch (error: any) {
      console.error('Error loading menu items:', error)
      setError('Unable to load menu items. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const filteredMeals = meals.filter(meal => meal.category === activeTab)

  // Default meal images
  const getMealImage = (index: number) => {
    const imageIds = [2474661, 5560763, 5560756, 5560748, 1640777, 2474658, 1640774]
    const imageId = imageIds[index % imageIds.length]
    return `https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&cs=tinysrgb&w=600`
  }

  const handleClaimDiscount = () => {
    navigate('/subscription', { state: { studentDiscount: true } })
  }

  if (loading) {
    return (
      <section id="menu-toggle-table" className={styles.menuToggleTable}>
        <div className={styles.container}>
          <div className={`${styles.toggleSection} ${isVisible ? styles.fadeIn : ''}`}>
            <div className={styles.toggleTabs}>
              <button className={`${styles.tab} ${styles.active}`}>
                Loading Menu...
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="menu-toggle-table" className={styles.menuToggleTable}>
        <div className={styles.container}>
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#2b2b2b'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Menu Coming Soon</h2>
            <p style={{ fontSize: '1rem', opacity: 0.7 }}>
              Our chefs are preparing an amazing menu for you. Please check back later!
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="menu-toggle-table" className={styles.menuToggleTable}>
      <div className={styles.container}>
        {/* Toggle Tabs */}
        <div className={`${styles.toggleSection} ${isVisible ? styles.fadeIn : ''}`}>
          <div className={styles.toggleTabs}>
            <button
              className={`${styles.tab} ${activeTab === 'veg' ? styles.active : ''}`}
              onClick={() => setActiveTab('veg')}
            >
              <span className={styles.tabIcon}>🥬</span>
              Vegetarian
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'non-veg' ? styles.active : ''}`}
              onClick={() => setActiveTab('non-veg')}
            >
              <span className={styles.tabIcon}>🍗</span>
              Non-Vegetarian
            </button>
          </div>
        </div>

        {/* Daily Menu Display */}
        <div className={`${styles.menuDisplay} ${isVisible ? styles.slideUp : ''}`}>
          <div className={styles.mealsGrid}>
            {filteredMeals.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                color: '#2b2b2b',
                opacity: 0.6,
                gridColumn: '1 / -1'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  No {activeTab === 'veg' ? 'vegetarian' : 'non-vegetarian'} meals available yet.
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Our chefs are working on creating delicious {activeTab === 'veg' ? 'vegetarian' : 'non-vegetarian'} options for you!
                </div>
              </div>
            ) : (
              filteredMeals.map((meal, index) => (
                <div
                  key={meal.id}
                  className={`${styles.mealCard} ${isVisible ? styles.fadeIn : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={styles.imageContainer}>
                    <img
                      src={getMealImage(index)}
                      alt={meal.name}
                      className={styles.mealImage}
                    />
                    {meal.tag && (
                      <div className={styles.tagBadge}>
                        {meal.tag}
                      </div>
                    )}
                    {meal.isSpecial && (
                      <div className={styles.spicyIndicator}>
                        ⭐
                      </div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.mealTitle}>{meal.name}</h3>
                    <p className={styles.mealDescription}>{meal.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student Discount CTA */}
        <div className={`${styles.studentDiscountCta} ${isVisible ? styles.fadeIn : ''}`}>
          <div className={styles.discountCard}>
            <div className={styles.discountHeader}>
              <h3 className={styles.discountTitle}>🎓 Student Special</h3>
            </div>
            <p className={styles.discountText}>
              Get 20% off your monthly plan. Just verify your student ID during signup.
            </p>
            <button 
              className={styles.discountButton}
              onClick={handleClaimDiscount}
            >
              Claim Student Discount
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MenuToggleTable