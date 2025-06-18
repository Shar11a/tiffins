import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './StudentDiscount.module.css'

const StudentDiscount: React.FC = () => {
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

    const section = document.getElementById('student-discount')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  const handleClaimDiscount = () => {
    // Navigate to subscription page with student discount pre-selected
    navigate('/subscription', { state: { studentDiscount: true } })
  }

  return (
    <section id="student-discount" className={styles.studentDiscount}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={`${styles.imageContent} ${isVisible ? styles.slideIn : ''}`}>
            <div className={styles.imageContainer}>
              <img 
                src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Happy student enjoying homestyle tiffin meal in hostel room"
                className={styles.studentImage}
              />
              <div className={styles.floatingEmoji}>
                🎓
              </div>
            </div>
          </div>
          
          <div className={`${styles.textContent} ${isVisible ? styles.fadeIn : ''}`}>
            <h2 className={styles.title}>
              Special Discount for Students 🎓
            </h2>
            <h3 className={styles.subheading}>
              Because we know what hostel life feels like.
            </h3>
            
            <p className={styles.message}>
              Missing home-cooked meals? We get it. 🛏️ That's why we're offering nutritious, 
              affordable tiffin meals that taste just like Amma's cooking. Because every student 
              deserves wholesome food that doesn't break the budget. 🥗
            </p>
            
            <div className={styles.ctaSection}>
              <button 
                className={styles.ctaButton}
                onClick={handleClaimDiscount}
              >
                Claim My Discount
              </button>
              <p className={styles.validationNote}>
                Valid Student ID required
              </p>
            </div>
            
            <div className={styles.benefits}>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>💰</span>
                <span className={styles.benefitText}>20% off monthly plans</span>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>🚚</span>
                <span className={styles.benefitText}>Free Delivery</span>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>⏰</span>
                <span className={styles.benefitText}>Flexible timing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StudentDiscount