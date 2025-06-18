import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import styles from './AdminLogin.module.css'

interface LoginFormData {
  email: string
  password: string
}

const AdminLogin: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
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
    
    // Basic validation - prevent submission if fields are empty
    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage('Please fill in all fields')
      return
    }

    if (!formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      return
    }

    // Only set loading state if validation passes
    setIsLoading(true)
    setErrorMessage('')

    try {
      await login(formData.email, formData.password)
      console.log('Login successful!')
      navigate('/admin/dashboard')
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

  // Form is valid only if both fields have content (not just whitespace)
  const isFormValid = formData.email.trim().length > 0 && formData.password.trim().length > 0

  return (
    <div className={styles.adminLogin}>
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
              <div className={styles.logoIcon}>🔐</div>
              <h1 className={styles.logoText}>TiffinBox Admin</h1>
            </div>
            <p className={styles.tagline}>
              <span className={styles.taglineIcon}>🧑‍🍳</span>
              Staff Only
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
                placeholder="Enter your admin email"
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
              Secure admin access for TiffinBox staff
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin