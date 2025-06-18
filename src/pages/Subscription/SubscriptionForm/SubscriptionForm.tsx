import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { addCustomer } from '../../../services/firestore'
import styles from './SubscriptionForm.module.css'

interface FormData {
  name: string
  contactNumber: string
  email: string
  buildingStreet: string
  flatNumber: string
  postCode: string
  town: string
  country: string
  deliverySlot: string
  planType: 'veg' | 'non-veg'
  studentStatus: boolean
  subscriptionType: 'daily' | 'monthly'
  studentIdFile: File | null
}

const SubscriptionForm: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [selectedPlan, setSelectedPlan] = useState<'veg' | 'non-veg'>('veg')
  const [selectedSubscription, setSelectedSubscription] = useState<'daily' | 'monthly'>('monthly')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [trackingToken, setTrackingToken] = useState<string>('')
  const [fileError, setFileError] = useState<string>('')
  const location = useLocation()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    contactNumber: '',
    email: '',
    buildingStreet: '',
    flatNumber: '',
    postCode: '',
    town: '',
    country: 'United Kingdom',
    deliverySlot: '',
    planType: 'veg',
    studentStatus: false,
    subscriptionType: 'monthly',
    studentIdFile: null
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const section = document.getElementById('subscription-form')
    if (section) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  // Check if student discount was pre-selected from navigation
  useEffect(() => {
    if (location.state?.studentDiscount) {
      setFormData(prev => ({ ...prev, studentStatus: true }))
    }
  }, [location.state])

  const deliverySlots = [
    { time: '18:00', label: '6:00 PM', icon: '🌅' },
    { time: '19:00', label: '7:00 PM', icon: '🌆' },
    { time: '20:00', label: '8:00 PM', icon: '🌇' },
    { time: '21:00', label: '9:00 PM', icon: '🌃' },
    { time: '22:00', label: '10:00 PM', icon: '🌙' }
  ]

  const countries = [
    "United Kingdom",
    "Ireland",
    "France",
    "Germany",
    "Spain",
    "Italy",
    "Netherlands",
    "Belgium",
    "Portugal",
    "Sweden",
    "Denmark",
    "Norway",
    "Finland"
  ]

  const handleSlotSelect = (time: string) => {
    setSelectedSlot(time)
    setFormData(prev => ({ ...prev, deliverySlot: time }))
  }

  const handlePlanSelect = (plan: 'veg' | 'non-veg') => {
    setSelectedPlan(plan)
    setFormData(prev => ({ ...prev, planType: plan }))
  }

  const handleSubscriptionSelect = (type: 'daily' | 'monthly') => {
    setSelectedSubscription(type)
    setFormData(prev => ({ ...prev, subscriptionType: type }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))

    // Clear file error when student status is unchecked
    if (name === 'studentStatus' && !checked) {
      setFileError('')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('File size exceeds 5MB limit')
        return
      }
      
      // Check file type (only PDF, JPG, PNG)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!validTypes.includes(file.type)) {
        setFileError('Only PDF, JPG, and PNG files are allowed')
        return
      }
      
      setFileError('')
    }
    
    setFormData(prev => ({ ...prev, studentIdFile: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) return

    // Validate student ID file if student discount is selected
    if (formData.studentStatus && !formData.studentIdFile) {
      setFileError('Please upload your student ID to claim the discount')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Combine address fields into a single address string
      const fullAddress = `${formData.flatNumber}, ${formData.buildingStreet}, ${formData.town}, ${formData.postCode}, ${formData.country}`
      
      // Save to Firebase and get tracking token
      const result = await addCustomer({
        name: formData.name,
        email: formData.email,
        phone: formData.contactNumber,
        address: fullAddress,
        deliverySlot: formData.deliverySlot,
        planType: formData.planType,
        studentStatus: formData.studentStatus,
        subscriptionType: formData.subscriptionType
      })

      setTrackingToken(result.trackingToken)
      setSubmitSuccess(true)

    } catch (error) {
      console.error('Error submitting subscription:', error)
      alert('Failed to submit subscription. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTrackMyOrder = () => {
    navigate('/tracking')
  }

  const handleNewOrder = () => {
    setFormData({
      name: '',
      contactNumber: '',
      email: '',
      buildingStreet: '',
      flatNumber: '',
      postCode: '',
      town: '',
      country: 'United Kingdom',
      deliverySlot: '',
      planType: 'veg',
      studentStatus: false,
      subscriptionType: 'monthly',
      studentIdFile: null
    })
    setSelectedSlot('')
    setSelectedPlan('veg')
    setSelectedSubscription('monthly')
    setSubmitSuccess(false)
    setTrackingToken('')
    setFileError('')
  }

  const isFormValid = formData.name && 
                      formData.contactNumber && 
                      formData.email && 
                      formData.buildingStreet && 
                      formData.postCode && 
                      formData.town && 
                      formData.deliverySlot

  // Calculate prices based on plan and subscription type
  const getMonthlyPrice = () => {
    return selectedPlan === 'veg' ? 181.99 : 259.99
  }

  const getCurrentPrice = () => {
    const price = getMonthlyPrice()
    return formData.studentStatus ? price * 0.8 : price
  }

  const formatPrice = (price: number) => {
    return `£${price.toFixed(2)}`
  }

  if (submitSuccess) {
    return (
      <section id="subscription-form" className={styles.subscriptionForm}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>🎉</div>
            <h2 className={styles.successTitle}>Order Confirmed!</h2>
            <p className={styles.successMessage}>
              Thank you for subscribing to TiffinBox! Your order has been confirmed and we'll start preparing your delicious meal.
            </p>
            
            <div className={styles.trackingSection}>
              <div className={styles.trackingCard}>
                <h3 className={styles.trackingTitle}>📱 Your Tracking Code</h3>
                <div className={styles.trackingCode}>{trackingToken}</div>
                <p className={styles.trackingNote}>
                  Save this code to track your delivery. We've also sent it to your email and SMS.
                </p>
              </div>
            </div>

            <div className={styles.successDetails}>
              <div className={styles.successItem}>
                <span className={styles.successLabel}>Plan:</span>
                <span className={styles.successValue}>{formData.planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}</span>
              </div>
              <div className={styles.successItem}>
                <span className={styles.successLabel}>Subscription:</span>
                <span className={styles.successValue}>{formData.subscriptionType === 'daily' ? 'Daily' : 'Monthly (30 days)'}</span>
              </div>
              <div className={styles.successItem}>
                <span className={styles.successLabel}>Delivery Time:</span>
                <span className={styles.successValue}>{deliverySlots.find(slot => slot.time === formData.deliverySlot)?.label}</span>
              </div>
              <div className={styles.successItem}>
                <span className={styles.successLabel}>Price:</span>
                <span className={styles.successValue}>
                  {formatPrice(getCurrentPrice())}
                  {formData.studentStatus ? ' (20% student discount applied)' : ''}
                </span>
              </div>
            </div>

            <div className={styles.successActions}>
              <button 
                className={styles.primaryButton}
                onClick={handleTrackMyOrder}
              >
                <span className={styles.buttonIcon}>🚚</span>
                Track My Order
              </button>
              <button 
                className={styles.secondaryButton}
                onClick={handleNewOrder}
              >
                <span className={styles.buttonIcon}>➕</span>
                Place Another Order
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="subscription-form" className={styles.subscriptionForm}>
      <div className={styles.container}>
        <div className={`${styles.header} ${isVisible ? styles.fadeIn : ''}`}>
          <h2 className={styles.title}>Start Your Tiffin Journey</h2>
          <p className={styles.subtitle}>
            Choose your plan, pick your time, and get ready for home-cooked goodness
          </p>
        </div>

        <div className={`${styles.formCard} ${isVisible ? styles.slideUp : ''}`}>
          <form onSubmit={handleSubmit} className={styles.form}>
            
            {/* Subscription Type Selection */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📅</span>
                Subscription Type
              </h3>
              <div className={styles.planGrid}>
                <button
                  type="button"
                  className={`${styles.planCard} ${selectedSubscription === 'monthly' ? styles.active : ''}`}
                  onClick={() => handleSubscriptionSelect('monthly')}
                >
                  <div className={styles.planIcon}>📅</div>
                  <div className={styles.planInfo}>
                    <h4 className={styles.planName}>Monthly</h4>
                    <p className={styles.planPrice}>30 days</p>
                    <p className={styles.planDescription}>Convenient monthly billing</p>
                  </div>
                  <div className={styles.planCheck}>
                    {selectedSubscription === 'monthly' && <span>✓</span>}
                  </div>
                </button>
              </div>
            </div>
            
            {/* Plan Selection */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🍽️</span>
                Choose Your Plan
              </h3>
              <div className={styles.planGrid}>
                <button
                  type="button"
                  className={`${styles.planCard} ${selectedPlan === 'veg' ? styles.active : ''}`}
                  onClick={() => handlePlanSelect('veg')}
                >
                  <div className={styles.planIcon}>🥬</div>
                  <div className={styles.planInfo}>
                    <h4 className={styles.planName}>Vegetarian</h4>
                    <p className={styles.planPrice}>£181.99/month</p>
                    <p className={styles.planDescription}>Fresh veg curries, dal, rice & rotis</p>
                  </div>
                  <div className={styles.planCheck}>
                    {selectedPlan === 'veg' && <span>✓</span>}
                  </div>
                </button>

                <button
                  type="button"
                  className={`${styles.planCard} ${selectedPlan === 'non-veg' ? styles.active : ''}`}
                  onClick={() => handlePlanSelect('non-veg')}
                >
                  <div className={styles.planIcon}>🍗</div>
                  <div className={styles.planInfo}>
                    <h4 className={styles.planName}>Non-Vegetarian</h4>
                    <p className={styles.planPrice}>£259.99/month</p>
                    <p className={styles.planDescription}>Chicken, mutton curries with sides</p>
                  </div>
                  <div className={styles.planCheck}>
                    {selectedPlan === 'non-veg' && <span>✓</span>}
                  </div>
                </button>
              </div>
            </div>

            {/* Delivery Time Selection */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>⏰</span>
                Delivery Time
              </h3>
              <div className={styles.slotsGrid}>
                {deliverySlots.map((slot, index) => (
                  <button
                    key={slot.time}
                    type="button"
                    className={`${styles.slotCard} ${selectedSlot === slot.time ? styles.active : ''}`}
                    onClick={() => handleSlotSelect(slot.time)}
                  >
                    <span className={styles.slotIcon}>{slot.icon}</span>
                    <span className={styles.slotTime}>{slot.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Details */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>👤</span>
                Your Details
              </h3>
              <div className={styles.fieldsGrid}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="name" className={styles.fieldLabel}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="contactNumber" className={styles.fieldLabel}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="+44 7XXX XXXXXX"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="email" className={styles.fieldLabel}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="flatNumber" className={styles.fieldLabel}>
                    Flat Number *
                  </label>
                  <input
                    type="text"
                    id="flatNumber"
                    name="flatNumber"
                    value={formData.flatNumber}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="Flat/Apartment number"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="buildingStreet" className={styles.fieldLabel}>
                    Building/Street *
                  </label>
                  <input
                    type="text"
                    id="buildingStreet"
                    name="buildingStreet"
                    value={formData.buildingStreet}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="Building name and street"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="town" className={styles.fieldLabel}>
                    Town/City *
                  </label>
                  <input
                    type="text"
                    id="town"
                    name="town"
                    value={formData.town}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="Town or city"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="postCode" className={styles.fieldLabel}>
                    Post Code *
                  </label>
                  <input
                    type="text"
                    id="postCode"
                    name="postCode"
                    value={formData.postCode}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    placeholder="Post code"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="country" className={styles.fieldLabel}>
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={styles.fieldInput}
                    required
                  >
                    {countries.map(country => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Student Discount */}
            <div className={styles.section}>
              <div className={styles.studentDiscount}>
                <div className={styles.discountIcon}>🎓</div>
                <div className={styles.discountContent}>
                  <h4 className={styles.discountTitle}>Student Discount Available</h4>
                  <p className={styles.discountText}>Get 20% off with valid student ID</p>
                </div>
                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    name="studentStatus"
                    checked={formData.studentStatus}
                    onChange={handleInputChange}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkmark}></span>
                  <span className={styles.checkboxLabel}>I'm a student</span>
                </label>
              </div>

              {/* Student ID Upload */}
              {formData.studentStatus && (
                <div className={styles.fieldGroup} style={{ marginTop: '1rem' }}>
                  <label htmlFor="studentIdFile" className={styles.fieldLabel}>
                    Upload Student ID *
                  </label>
                  <input
                    type="file"
                    id="studentIdFile"
                    name="studentIdFile"
                    onChange={handleFileChange}
                    className={styles.fieldInput}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required={formData.studentStatus}
                  />
                  <div className={styles.inputHint}>
                    Upload your valid student ID (PDF, JPG, PNG, max 5MB)
                  </div>
                  {fileError && (
                    <div className={styles.errorMessage} style={{ fontSize: '0.7rem', color: '#d62828', marginTop: '0.25rem' }}>
                      {fileError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary & Submit */}
            <div className={styles.summarySection}>
              <div className={styles.pricingSummary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Plan:</span>
                  <span className={styles.summaryValue}>
                    {selectedPlan === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Subscription:</span>
                  <span className={styles.summaryValue}>
                    {selectedSubscription === 'daily' ? 'Daily' : 'Monthly (30 days)'}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Base Price:</span>
                  <span className={styles.summaryValue}>
                    {formatPrice(getMonthlyPrice())}
                  </span>
                </div>
                {formData.studentStatus && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Student Discount:</span>
                    <span className={styles.summaryValue}>-20%</span>
                  </div>
                )}
                <div className={styles.summaryDivider}></div>
                <div className={styles.summaryRow}>
                  <span className={styles.totalLabel}>Total:</span>
                  <span className={styles.totalValue}>
                    {formatPrice(getCurrentPrice())}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className={`${styles.submitButton} ${!isFormValid || (formData.studentStatus && !formData.studentIdFile) || !!fileError ? styles.disabled : ''}`}
                disabled={!isFormValid || (formData.studentStatus && !formData.studentIdFile) || !!fileError || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className={styles.spinner}></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className={styles.buttonIcon}>🚀</span>
                    Start My Subscription
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default SubscriptionForm