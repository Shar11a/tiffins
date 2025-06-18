import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../firebase/config'
import { addRider } from '../../../services/riderService'
import styles from './RiderSignup.module.css'

interface SignupFormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  vehicleType: 'bike' | 'car' | 'scooter'
  vehicleNumber: string
  identityProof: File | null
  agreeToTerms: boolean
}

const RiderSignup: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    identityProof: null,
    agreeToTerms: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [fileError, setFileError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('')
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
      setFormData(prev => ({ ...prev, identityProof: file }))
    }
  }

  const validateForm = (): boolean => {
    // Check if all required fields are filled
    if (!formData.name.trim() || 
        !formData.email.trim() || 
        !formData.phone.trim() || 
        !formData.password.trim() || 
        !formData.confirmPassword.trim() || 
        !formData.vehicleNumber.trim() ||
        !formData.identityProof) {
      setErrorMessage('Please fill in all required fields')
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address')
      return false
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^\+?[0-9\s\-\(\)]{8,15}$/
    if (!phoneRegex.test(formData.phone)) {
      setErrorMessage('Please enter a valid phone number')
      return false
    }

    // Check password length
    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long')
      return false
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match')
      return false
    }

    // Check terms agreement
    if (!formData.agreeToTerms) {
      setErrorMessage('You must agree to the terms and conditions')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // Convert identity proof to base64 for storage
      let identityProofBase64 = null
      if (formData.identityProof) {
        identityProofBase64 = await convertFileToBase64(formData.identityProof)
      }

      // Add rider to Firestore
      await addRider({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
        identityProof: identityProofBase64,
        identityProofFileName: formData.identityProof?.name || '',
        identityProofType: formData.identityProof?.type || '',
        isActive: false // Riders need admin approval before becoming active
      })

      // Show success message
      setSuccessMessage('Your account has been created! Please wait for admin approval before you can start delivering.')
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        vehicleType: 'bike',
        vehicleNumber: '',
        identityProof: null,
        agreeToTerms: false
      })

      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/rider/login')
      }, 5000)
    } catch (error: any) {
      console.error('Signup error:', error)
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please use a different email address.')
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use at least 6 characters.')
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Invalid email address format.')
      } else {
        setErrorMessage('Failed to create account. Please try again later.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  return (
    <div className={styles.riderSignup}>
      <div className={styles.container}>
        <div className={styles.homeButtonContainer}>
          <Link to="/" className={styles.homeButton}>
            ← Back to Home
          </Link>
        </div>
        <div className={styles.signupCard}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>🏍️</div>
              <h1 className={styles.logoText}>TiffinBox Rider</h1>
            </div>
            <p className={styles.tagline}>
              <span className={styles.taglineIcon}>🚚</span>
              Join our delivery team
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className={styles.successMessage}>
              <span className={styles.successIcon}>✅</span>
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {errorMessage}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className={styles.signupForm}>
            <div className={styles.formGrid}>
              {/* Full Name */}
              <div className={styles.fieldGroup}>
                <label htmlFor="name" className={styles.fieldLabel}>
                  <span className={styles.labelIcon}>👤</span>
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.fieldInput}
                  placeholder="Your full name"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Phone Number */}
              <div className={styles.fieldGroup}>
                <label htmlFor="phone" className={styles.fieldLabel}>
                  <span className={styles.labelIcon}>📞</span>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={styles.fieldInput}
                  placeholder="+44 7XXX XXXXXX"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div className={styles.fieldGroup}>
                <label htmlFor="email" className={styles.fieldLabel}>
                  <span className={styles.labelIcon}>📧</span>
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
                  disabled={isLoading}
                />
              </div>

              {/* Vehicle Type */}
              <div className={styles.fieldGroup}>
                <label htmlFor="vehicleType" className={styles.fieldLabel}>
                  <span className={styles.labelIcon}>🚗</span>
                  Vehicle Type *
                </label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className={styles.fieldSelect}
                  required
                  disabled={isLoading}
                >
                  <option value="bike">Bike 🏍️</option>
                  <option value="scooter">Scooter 🛵</option>
                  <option value="car">Car 🚗</option>
                </select>
              </div>

              {/* Vehicle Number */}
              <div className={styles.fieldGroup}>
                <label htmlFor="vehicleNumber" className={styles.fieldLabel}>
                  <span className={styles.labelIcon}>🔢</span>
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  id="vehicleNumber"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  className={styles.fieldInput}
                  placeholder="AB12 CDE"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Identity Proof */}
              <div className={styles.fieldGroup}>
                <label htmlFor="identityProof" className={styles.fieldLabel}>
                  <span className={styles.labelIcon}>🪪</span>
                  Proof of Identity *
                </label>
                <input
                  type="file"
                  id="identityProof"
                  name="identityProof"
                  onChange={handleFileChange}
                  className={styles.fieldInput}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  disabled={isLoading}
                />
                <div className={styles.passwordRequirements}>
                  Upload your driver's license or other valid ID (PDF, JPG, PNG, max 5MB)
                </div>
                {fileError && (
                  <div className={styles.errorMessage} style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {fileError}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className={styles.fieldGroup}>
                <label htmlFor="password" className={styles.fieldLabel}>
                  <span className={styles.labelIcon}>🔒</span>
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={styles.fieldInput}
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <div className={styles.passwordRequirements}>
                  Minimum 6 characters
                </div>
              </div>

              {/* Confirm Password */}
              <div className={styles.fieldGroup}>
                <label htmlFor="confirmPassword" className={styles.fieldLabel}>
                  <span className={styles.labelIcon}>🔒</span>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={styles.fieldInput}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Terms and Conditions */}
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <div className={styles.termsGroup}>
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className={styles.checkbox}
                    disabled={isLoading}
                  />
                  <label htmlFor="agreeToTerms" className={styles.termsText}>
                    I agree to the <a href="#" className={styles.termsLink}>Terms of Service</a> and <a href="#" className={styles.termsLink}>Privacy Policy</a>. I understand that my account will need admin approval before I can start delivering.
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!formData.agreeToTerms || isLoading || !!fileError}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up as Delivery Partner'}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.loginLink}>
              Already have an account? <Link to="/rider/login" className={styles.loginLinkText}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiderSignup