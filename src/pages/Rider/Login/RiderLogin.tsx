import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../firebase/config'
import { getRiderByEmail } from '../../../services/riderService'
import styles from './RiderLogin.module.css'

interface LoginFormData {
  email: string
  password: string
}

const RiderLogin: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage('Please fill in all fields')
      return
    }

    if (!formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      // First check if the user is a registered rider
      const rider = await getRiderByEmail(formData.email)
      
      if (!rider) {
        setErrorMessage('You are not registered as a delivery partner. Please contact admin.')
        setIsLoading(false)
        return
      }

      if (!rider.isActive) {
        setErrorMessage('Your account is inactive. Please contact admin.')
        setIsLoading(false)
        return
      }

      // Authenticate with Firebase
      await signInWithEmailAndPassword(auth, formData.email, formData.password)
      
      console.log('Rider login successful!')
      navigate('/rider/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email address.')
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please try again.')
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Invalid email address format.')
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please try again later.')
      } else if (error.code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password. Please check your credentials.')
      } else {
        setErrorMessage('Login failed. Please check your credentials and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.email.trim().length > 0 && formData.password.trim().length > 0

  return (
    <div className={styles.riderLogin}>
      <div className={styles.container}>
        <div className={styles.homeButtonContainer}>
          <Link to="/" className={styles.homeButton}>
            ← Back to Home
          </Link>
        </div>
        <div className={styles.loginCard}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>🏍️</div>
              <h1 className={styles.logoText}>TiffinBox Rider</h1>
            </div>
            <p className={styles.tagline}>
              <span className={styles.taglineIcon}>🚚</span>
              Delivery Partner Portal
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {/* Email Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.fieldLabel}>
                <span className={styles.labelIcon}>📧</span>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.fieldInput}
                placeholder="Enter your registered email"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.fieldLabel}>
                <span className={styles.labelIcon}>🔒</span>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={styles.fieldInput}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login to Dashboard'}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Don't have an account? <Link to="/rider/signup" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiderLogin