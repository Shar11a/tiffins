import React, { useState } from 'react'
import { getDeliveryByToken } from '../../../services/firestore'
import styles from './TrackingInput.module.css'

interface TrackingInputProps {
  onTrackingFound: (trackingToken: string) => void
}

const TrackingInput: React.FC<TrackingInputProps> = ({ onTrackingFound }) => {
  const [trackingToken, setTrackingToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trackingToken.trim()) {
      setError('Please enter your tracking code')
      return
    }

    if (trackingToken.length !== 8) {
      setError('Tracking code must be 8 characters')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const delivery = await getDeliveryByToken(trackingToken.toUpperCase())
      
      if (delivery) {
        onTrackingFound(trackingToken.toUpperCase())
      } else {
        setError('Invalid tracking code or delivery has expired')
      }
    } catch (error) {
      console.error('Error tracking delivery:', error)
      setError('Unable to track delivery. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    setTrackingToken(value)
    if (error) setError('')
  }

  return (
    <section className={styles.trackingInput}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.icon}>🔍</div>
            <h2 className={styles.title}>Track Your Tiffin</h2>
            <p className={styles.subtitle}>
              Enter your 8-character tracking code to see your delivery status
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="trackingCode" className={styles.label}>
                Tracking Code
              </label>
              <input
                type="text"
                id="trackingCode"
                value={trackingToken}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="e.g., ABC12345"
                maxLength={8}
                disabled={isLoading}
              />
              <div className={styles.inputHint}>
                Check your confirmation SMS or email for the tracking code
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={!trackingToken || isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  Tracking...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>🚚</span>
                  Track My Delivery
                </>
              )}
            </button>
          </form>

          <div className={styles.helpSection}>
            <h3 className={styles.helpTitle}>Need Help?</h3>
            <div className={styles.helpOptions}>
              <button className={styles.helpButton}>
                <span className={styles.helpIcon}>📞</span>
                Call Support
              </button>
              <button className={styles.helpButton}>
                <span className={styles.helpIcon}>💬</span>
                WhatsApp Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrackingInput