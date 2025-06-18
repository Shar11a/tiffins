import React, { useState, useEffect } from 'react'
import { 
  getMenuItems, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  getWeeklyMenu,
  updateWeeklyMeal,
  addWeeklyMeal,
  deleteWeeklyMeal,
  MenuItem,
  WeeklyMeal
} from '../../../services/firestore'
import styles from './MenuEditor.module.css'

interface FormData {
  name: string
  description: string
  tag: string
  category: 'veg' | 'non-veg'
  isSpecial: boolean
}

interface WeeklyMealFormData {
  id?: string
  day: string
  vegCurry: string
  vegDry: string
  nonVegCurry: string
  rice: string
  bread: string
  dips: string
}

const MenuEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'veg' | 'non-veg' | 'weekly'>('veg')
  const [meals, setMeals] = useState<MenuItem[]>([])
  const [weeklyMeals, setWeeklyMeals] = useState<WeeklyMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMeal, setEditingMeal] = useState<MenuItem | null>(null)
  const [editingWeeklyMeal, setEditingWeeklyMeal] = useState<WeeklyMealFormData | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    tag: '',
    category: 'veg',
    isSpecial: false
  })
  const [weeklyMealFormData, setWeeklyMealFormData] = useState<WeeklyMealFormData>({
    day: '',
    vegCurry: '',
    vegDry: '',
    nonVegCurry: '',
    rice: '',
    bread: '',
    dips: ''
  })

  // Load menu items from Firestore
  useEffect(() => {
    loadMenuItems()
    loadWeeklyMenu()
  }, [])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      const items = await getMenuItems()
      setMeals(items)
    } catch (error) {
      console.error('Error loading menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWeeklyMenu = async () => {
    try {
      setLoading(true)
      const meals = await getWeeklyMenu()
      setWeeklyMeals(meals)
    } catch (error) {
      console.error('Error loading weekly menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMeals = meals.filter(meal => meal.category === activeTab)
  const totalMeals = filteredMeals.length
  const specialMeals = filteredMeals.filter(meal => meal.isSpecial).length

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleWeeklyMealInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setWeeklyMealFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) return

    try {
      if (editingMeal) {
        // Update existing meal
        await updateMenuItem(editingMeal.id!, formData)
        setEditingMeal(null)
      } else {
        // Add new meal
        await addMenuItem({
          ...formData,
          category: activeTab === 'weekly' ? 'veg' : activeTab
        })
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        tag: '',
        category: activeTab === 'weekly' ? 'veg' : activeTab,
        isSpecial: false
      })

      // Reload menu items
      await loadMenuItems()
    } catch (error) {
      console.error('Error saving menu item:', error)
    }
  }

  const handleWeeklyMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!weeklyMealFormData.day.trim() || 
        !weeklyMealFormData.vegCurry.trim() || 
        !weeklyMealFormData.nonVegCurry.trim()) {
      alert('Please fill in at least the Day, Veg Curry, and Non-Veg Curry fields')
      return
    }

    try {
      if (editingWeeklyMeal?.id) {
        // Update existing weekly meal
        await updateWeeklyMeal(editingWeeklyMeal.id, weeklyMealFormData)
      } else {
        // Add new weekly meal
        await addWeeklyMeal(weeklyMealFormData)
      }

      // Reset form
      setWeeklyMealFormData({
        day: '',
        vegCurry: '',
        vegDry: '',
        nonVegCurry: '',
        rice: '',
        bread: '',
        dips: ''
      })
      setEditingWeeklyMeal(null)

      // Reload weekly menu
      await loadWeeklyMenu()
      
      alert('Weekly menu updated successfully!')
    } catch (error) {
      console.error('Error saving weekly meal:', error)
      alert('Failed to update weekly menu. Please try again.')
    }
  }

  const handleEdit = (meal: MenuItem) => {
    setEditingMeal(meal)
    setFormData({
      name: meal.name,
      description: meal.description,
      tag: meal.tag,
      category: meal.category,
      isSpecial: meal.isSpecial
    })
  }

  const handleEditWeeklyMeal = (meal: WeeklyMeal) => {
    setEditingWeeklyMeal({
      id: meal.id,
      day: meal.day,
      vegCurry: meal.vegCurry,
      vegDry: meal.vegDry,
      nonVegCurry: meal.nonVegCurry,
      rice: meal.rice,
      bread: meal.bread,
      dips: meal.dips
    })
    setWeeklyMealFormData({
      day: meal.day,
      vegCurry: meal.vegCurry,
      vegDry: meal.vegDry,
      nonVegCurry: meal.nonVegCurry,
      rice: meal.rice,
      bread: meal.bread,
      dips: meal.dips
    })
  }

  const handleDelete = async (mealId: string) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await deleteMenuItem(mealId)
        await loadMenuItems()
        
        if (editingMeal?.id === mealId) {
          setEditingMeal(null)
          setFormData({
            name: '',
            description: '',
            tag: '',
            category: activeTab === 'weekly' ? 'veg' : activeTab,
            isSpecial: false
          })
        }
      } catch (error) {
        console.error('Error deleting menu item:', error)
      }
    }
  }

  const handleDeleteWeeklyMeal = async (mealId: string) => {
    if (window.confirm('Are you sure you want to delete this weekly menu item?')) {
      try {
        await deleteWeeklyMeal(mealId)
        await loadWeeklyMenu()
        
        if (editingWeeklyMeal?.id === mealId) {
          setEditingWeeklyMeal(null)
          setWeeklyMealFormData({
            day: '',
            vegCurry: '',
            vegDry: '',
            nonVegCurry: '',
            rice: '',
            bread: '',
            dips: ''
          })
        }
        
        alert('Weekly menu item deleted successfully!')
      } catch (error) {
        console.error('Error deleting weekly menu item:', error)
        alert('Failed to delete weekly menu item. Please try again.')
      }
    }
  }

  const handleCancel = () => {
    setEditingMeal(null)
    setFormData({
      name: '',
      description: '',
      tag: '',
      category: activeTab === 'weekly' ? 'veg' : activeTab,
      isSpecial: false
    })
  }

  const handleCancelWeeklyMeal = () => {
    setEditingWeeklyMeal(null)
    setWeeklyMealFormData({
      day: '',
      vegCurry: '',
      vegDry: '',
      nonVegCurry: '',
      rice: '',
      bread: '',
      dips: ''
    })
  }

  const toggleSpecial = async (meal: MenuItem) => {
    try {
      await updateMenuItem(meal.id!, { isSpecial: !meal.isSpecial })
      await loadMenuItems()
    } catch (error) {
      console.error('Error updating special status:', error)
    }
  }

  const isFormValid = formData.name.trim().length > 0
  const isWeeklyFormValid = weeklyMealFormData.day.trim().length > 0 && 
                           weeklyMealFormData.vegCurry.trim().length > 0 && 
                           weeklyMealFormData.nonVegCurry.trim().length > 0

  if (loading) {
    return (
      <div className={styles.menuEditor}>
        <div className={styles.header}>
          <h1 className={styles.title}>Menu Editor 🍽️</h1>
          <p className={styles.subtitle}>
            Loading menu items...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.menuEditor}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Menu Editor 🍽️</h1>
        <p className={styles.subtitle}>
          Manage your daily menu items, today's specials, and weekly menu plan
        </p>
      </div>

      {/* Menu Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
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
          <button
            className={`${styles.tab} ${activeTab === 'weekly' ? styles.active : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            <span className={styles.tabIcon}>📅</span>
            Weekly Menu
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {activeTab !== 'weekly' && (
        <div className={styles.summarySection}>
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>📊</span>
              <div className={styles.summaryValue}>{totalMeals}</div>
              <div className={styles.summaryLabel}>Total {activeTab === 'veg' ? 'Veg' : 'Non-Veg'} Meals</div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>⭐</span>
              <div className={styles.summaryValue}>{specialMeals}</div>
              <div className={styles.summaryLabel}>Today's Specials</div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>🍽️</span>
              <div className={styles.summaryValue}>{meals.length}</div>
              <div className={styles.summaryLabel}>Total Menu Items</div>
            </div>
          </div>
        </div>
      )}

      {/* Content Layout */}
      <div className={styles.contentLayout}>
        {activeTab === 'weekly' ? (
          <>
            {/* Weekly Menu Editor */}
            <div className={styles.menuList}>
              <div className={styles.listHeader}>
                <h2 className={styles.listTitle}>
                  <span className={styles.listIcon}>📅</span>
                  Weekly Menu Plan
                </h2>
              </div>

              <div className={styles.mealsList}>
                {weeklyMeals.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🍽️</span>
                    <div className={styles.emptyText}>
                      No weekly menu items found.
                      <br />
                      Add your first weekly menu item using the form on the right.
                    </div>
                  </div>
                ) : (
                  <table className={styles.table} style={{ margin: '1rem' }}>
                    <thead className={styles.tableHead}>
                      <tr className={styles.tableHeadRow}>
                        <th className={styles.tableHeadCell}>DAY</th>
                        <th className={styles.tableHeadCell}>VEG CURRY</th>
                        <th className={styles.tableHeadCell}>VEG DRY</th>
                        <th className={styles.tableHeadCell}>NONVEG CURRY</th>
                        <th className={styles.tableHeadCell}>RICE</th>
                        <th className={styles.tableHeadCell}>BREAD</th>
                        <th className={styles.tableHeadCell}>DIPS</th>
                        <th className={styles.tableHeadCell}>ACTIONS</th>
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
                          <td className={styles.tableCell}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className={`${styles.actionButton} ${styles.editButton}`}
                                onClick={() => handleEditWeeklyMeal(meal)}
                                aria-label={`Edit ${meal.day}`}
                              >
                                🖊️
                              </button>
                              <button
                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                onClick={() => handleDeleteWeeklyMeal(meal.id!)}
                                aria-label={`Delete ${meal.day}`}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Weekly Menu Form */}
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>
                  <span className={styles.formIcon}>
                    {editingWeeklyMeal ? '🖊️' : '➕'}
                  </span>
                  {editingWeeklyMeal ? 'Edit Weekly Menu' : 'Add Weekly Menu Item'}
                </h2>
              </div>

              <form onSubmit={handleWeeklyMealSubmit} className={styles.form}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="day" className={styles.fieldLabel}>
                    Day *
                  </label>
                  <select
                    id="day"
                    name="day"
                    value={weeklyMealFormData.day}
                    onChange={handleWeeklyMealInputChange}
                    className={styles.fieldSelect}
                    required
                  >
                    <option value="">Select a day</option>
                    <option value="MONDAY">MONDAY</option>
                    <option value="TUESDAY">TUESDAY</option>
                    <option value="WEDNESDAY">WEDNESDAY</option>
                    <option value="THURSDAY">THURSDAY</option>
                    <option value="FRIDAY">FRIDAY</option>
                    <option value="SATURDAY">SATURDAY</option>
                    <option value="SUNDAY">SUNDAY</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="vegCurry" className={styles.fieldLabel}>
                    Vegetarian Curry *
                  </label>
                  <input
                    type="text"
                    id="vegCurry"
                    name="vegCurry"
                    value={weeklyMealFormData.vegCurry}
                    onChange={handleWeeklyMealInputChange}
                    className={styles.fieldInput}
                    placeholder="e.g., TADKA DAL"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="vegDry" className={styles.fieldLabel}>
                    Vegetarian Dry
                  </label>
                  <input
                    type="text"
                    id="vegDry"
                    name="vegDry"
                    value={weeklyMealFormData.vegDry}
                    onChange={handleWeeklyMealInputChange}
                    className={styles.fieldInput}
                    placeholder="e.g., MUTTER"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="nonVegCurry" className={styles.fieldLabel}>
                    Non-Vegetarian Curry *
                  </label>
                  <input
                    type="text"
                    id="nonVegCurry"
                    name="nonVegCurry"
                    value={weeklyMealFormData.nonVegCurry}
                    onChange={handleWeeklyMealInputChange}
                    className={styles.fieldInput}
                    placeholder="e.g., CHICKEN KARAHI"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="rice" className={styles.fieldLabel}>
                    Rice
                  </label>
                  <input
                    type="text"
                    id="rice"
                    name="rice"
                    value={weeklyMealFormData.rice}
                    onChange={handleWeeklyMealInputChange}
                    className={styles.fieldInput}
                    placeholder="e.g., BOILED RICE"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="bread" className={styles.fieldLabel}>
                    Bread
                  </label>
                  <input
                    type="text"
                    id="bread"
                    name="bread"
                    value={weeklyMealFormData.bread}
                    onChange={handleWeeklyMealInputChange}
                    className={styles.fieldInput}
                    placeholder="e.g., CHAPATI"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="dips" className={styles.fieldLabel}>
                    Dips
                  </label>
                  <input
                    type="text"
                    id="dips"
                    name="dips"
                    value={weeklyMealFormData.dips}
                    onChange={handleWeeklyMealInputChange}
                    className={styles.fieldInput}
                    placeholder="e.g., RAITA"
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={!isWeeklyFormValid}
                  >
                    {editingWeeklyMeal ? 'Update Weekly Menu' : 'Add to Weekly Menu'}
                  </button>
                  {editingWeeklyMeal && (
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleCancelWeeklyMeal}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        ) : (
          <>
            {/* Menu List */}
            <div className={styles.menuList}>
              <div className={styles.listHeader}>
                <h2 className={styles.listTitle}>
                  <span className={styles.listIcon}>
                    {activeTab === 'veg' ? '🥬' : '🍗'}
                  </span>
                  {activeTab === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} Menu
                </h2>
              </div>

              <div className={styles.mealsList}>
                {filteredMeals.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🍽️</span>
                    <div className={styles.emptyText}>
                      No {activeTab === 'veg' ? 'vegetarian' : 'non-vegetarian'} meals added yet.
                      <br />
                      Add your first meal using the form on the right.
                    </div>
                  </div>
                ) : (
                  filteredMeals.map((meal) => (
                    <div key={meal.id} className={styles.mealItem}>
                      <div className={styles.mealHeader}>
                        <div className={styles.mealInfo}>
                          <h3 className={styles.mealName}>{meal.name}</h3>
                          {meal.description && (
                            <p className={styles.mealDescription}>{meal.description}</p>
                          )}
                          <div className={styles.mealTags}>
                            {meal.tag && (
                              <span className={styles.mealTag}>{meal.tag}</span>
                            )}
                            {meal.isSpecial && (
                              <span className={styles.specialBadge}>
                                ⭐ Today's Special
                              </span>
                            )}
                          </div>
                          <div className={styles.specialToggle}>
                            <span className={styles.toggleLabel}>Today's Special:</span>
                            <button
                              className={`${styles.toggleSwitch} ${meal.isSpecial ? styles.active : ''}`}
                              onClick={() => toggleSpecial(meal)}
                              aria-label={`Toggle special status for ${meal.name}`}
                            >
                              <div className={styles.toggleKnob}></div>
                            </button>
                          </div>
                        </div>
                        <div className={styles.mealActions}>
                          <button
                            className={`${styles.actionButton} ${styles.editButton}`}
                            onClick={() => handleEdit(meal)}
                            aria-label={`Edit ${meal.name}`}
                          >
                            🖊️
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={() => handleDelete(meal.id!)}
                            aria-label={`Delete ${meal.name}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add/Edit Form */}
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>
                  <span className={styles.formIcon}>
                    {editingMeal ? '🖊️' : '➕'}
                  </span>
                  {editingMeal ? 'Edit Meal' : 'Add New Meal'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="name" className={styles.fieldLabel}>
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="e.g., Paneer Butter Masala + 2 Rotis"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="description" className={styles.fieldLabel}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={styles.fieldTextarea}
                    placeholder="Brief description of the meal..."
                    rows={3}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="tag" className={styles.fieldLabel}>
                    Tag
                  </label>
                  <select
                    id="tag"
                    name="tag"
                    value={formData.tag}
                    onChange={handleInputChange}
                    className={styles.fieldSelect}
                  >
                    <option value="">Select a tag</option>
                    <option value="High Protein">High Protein</option>
                    <option value="Comfort Food">Comfort Food</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Signature Dish">Signature Dish</option>
                    <option value="Chef's Special">Chef's Special</option>
                    <option value="Regional Special">Regional Special</option>
                    <option value="Healthy Choice">Healthy Choice</option>
                    <option value="Spicy">Spicy</option>
                    <option value="Mild">Mild</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="category" className={styles.fieldLabel}>
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={styles.fieldSelect}
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>

                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="isSpecial"
                    name="isSpecial"
                    checked={formData.isSpecial}
                    onChange={handleInputChange}
                    className={styles.checkbox}
                  />
                  <label htmlFor="isSpecial" className={styles.checkboxLabel}>
                    Mark as Today's Special ⭐
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={!isFormValid}
                  >
                    {editingMeal ? 'Update Meal' : 'Add Meal'}
                  </button>
                  {editingMeal && (
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MenuEditor