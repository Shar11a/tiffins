import React, { useEffect, useState } from 'react'
import { getWeeklyMenu, WeeklyMeal } from '../../services/firestore'
import styles from './MenuTable.module.css'

const MenuTable: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [weeklyMeals, setWeeklyMeals] = useState<WeeklyMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const section = document.getElementById('menu-table')
    if (section) {
      observer.observe(section)
    }

    // Load weekly menu from Firestore
    const loadWeeklyMenu = async () => {
      try {
        setLoading(true)
        setError(null)
        const meals = await getWeeklyMenu()
        setWeeklyMeals(meals)
      } catch (err) {
        console.error('Error loading weekly menu:', err)
        setError('Failed to load weekly menu. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadWeeklyMenu()

    return () => observer.disconnect()
  }, [])

  if (loading) {
    return (
      <section id="menu-table" className={styles.menuTable}>
        <div className={styles.container}>
          <div className={`${styles.header} ${isVisible ? styles.fadeIn : ''}`}>
            <h2 className={styles.title}>Weekly Menu Plan</h2>
            <p className={styles.subtitle}>
              Loading weekly menu...
            </p>
          </div>
          <div className={`${styles.tableContainer} ${styles.loading}`}></div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="menu-table" className={styles.menuTable}>
        <div className={styles.container}>
          <div className={`${styles.header} ${isVisible ? styles.fadeIn : ''}`}>
            <h2 className={styles.title}>Weekly Menu Plan</h2>
            <p className={styles.subtitle} style={{ color: '#d62828' }}>
              {error}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="menu-table" className={styles.menuTable}>
      <div className={styles.container}>
        {/* Header */}
        <div className={`${styles.header} ${isVisible ? styles.fadeIn : ''}`}>
          <h2 className={styles.title}>Weekly Menu Plan</h2>
          <p className={styles.subtitle}>
            Your complete weekly tiffin schedule with fresh, home-cooked meals
          </p>
        </div>

        {/* Table Container */}
        <div className={`${styles.tableContainer} ${isVisible ? styles.slideUp : ''}`}>
          {/* Desktop Table */}
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr className={styles.tableHeadRow}>
                <th className={styles.tableHeadCell}>DAY</th>
                <th className={styles.tableHeadCell}>DISH 1 (VEG CURRY)</th>
                <th className={styles.tableHeadCell}>DISH 2 (VEG DRY)</th>
                <th className={styles.tableHeadCell}>DISH 1 (NONVEG CURRY)</th>
                <th className={styles.tableHeadCell}>RICE</th>
                <th className={styles.tableHeadCell}>BREAD</th>
                <th className={styles.tableHeadCell}>DIPS</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {weeklyMeals.map((meal) => (
                <tr key={meal.day} className={styles.tableRow}>
                  <td className={styles.tableCell}>{meal.day}</td>
                  <td className={styles.tableCell}>{meal.vegCurry}</td>
                  <td className={styles.tableCell}>{meal.vegDry}</td>
                  <td className={styles.tableCell}>{meal.nonVegCurry}</td>
                  <td className={styles.tableCell}>{meal.rice}</td>
                  <td className={styles.tableCell}>{meal.bread}</td>
                  <td className={styles.tableCell}>{meal.dips}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Scrollable Table */}
          <div className={styles.mobileScrollContainer}>
            <table className={`${styles.table} ${styles.mobileTable}`}>
              <thead className={styles.tableHead}>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.tableHeadCell}>DAY</th>
                  <th className={styles.tableHeadCell}>DISH 1 (VEG CURRY)</th>
                  <th className={styles.tableHeadCell}>DISH 2 (VEG DRY)</th>
                  <th className={styles.tableHeadCell}>DISH 1 (NONVEG CURRY)</th>
                  <th className={styles.tableHeadCell}>RICE</th>
                  <th className={styles.tableHeadCell}>BREAD</th>
                  <th className={styles.tableHeadCell}>DIPS</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {weeklyMeals.map((meal) => (
                  <tr key={meal.day} className={styles.tableRow}>
                    <td className={styles.tableCell}>{meal.day}</td>
                    <td className={styles.tableCell}>{meal.vegCurry}</td>
                    <td className={styles.tableCell}>{meal.vegDry}</td>
                    <td className={styles.tableCell}>{meal.nonVegCurry}</td>
                    <td className={styles.tableCell}>{meal.rice}</td>
                    <td className={styles.tableCell}>{meal.bread}</td>
                    <td className={styles.tableCell}>{meal.dips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scroll Indicator for Mobile */}
        <div className={`${styles.scrollIndicator} ${isVisible ? styles.fadeIn : ''}`}>
          <span className={styles.scrollText}>
            Swipe to see all menu items
            <span className={styles.scrollArrow}>→</span>
          </span>
        </div>
      </div>
    </section>
  )
}

export default MenuTable