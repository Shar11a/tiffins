import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { verifyStripeCheckoutSession } from '../../services/stripeService'
import styles from './SuccessPage.module.css'

const SuccessPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trackingToken, setTrackingToken] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get the session ID from the URL
        const params = new URLSearchParams(location.search)
        const sessionId = params.get('session_id')

        if (!sessionId) {
          throw new Error('No session ID found in URL')
        }

        // Verify the payment with Stripe
        const result = await verifyStripeCheckoutSession(sessionId)

        if (!result.success) {
          throw new Error(result.error || 'Payment verification failed')
        }

        // Set the tracking token and order ID
        setTrackingToken(result.trackingToken || null)
        setOrderId(result.orderId || null)
      } catch (error) {
        console.error('Error verifying payment:', error)
        setError(error instanceof Error ? error.message : 'Payment verification failed')
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [location.search])

  const handleTrackOrder = () => {
    navigate('/tracking')
  }

  const handleNewOrder = () => {
    navigate('/subscription')
  }

  if (loading) {
    return (
      <div className={styles.successPage}>
        <div className={styles.container}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingIcon}>⏳</div>
            <h2 className={styles.loadingTitle}>Verifying your payment...</h2>
            <p className={styles.loadingText}>Please wait while we confirm your order details.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.successPage}>
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>❌</div>
            <h2 className={styles.errorTitle}>Payment Verification Failed</h2>
            <p className={styles.errorText}>{error}</p>
            <button 
              className={styles.primaryButton}
              onClick={() => navigate('/subscription')}
            >
              <span className={styles.buttonIcon}>🔄</span>
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.successPage}>
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.successTitle}>Payment Successful!</h2>
          <p className={styles.successMessage}>
            Thank you for subscribing to TiffinBox! Your payment has been processed and your subscription is now active.
          </p>
          
          {trackingToken && (
            <div className={styles.trackingSection}>
              <div className={styles.trackingCard}>
                <h3 className={styles.trackingTitle}>📱 Your Tracking Code</h3>
                <div className={styles.trackingCode}>{trackingToken}</div>
                <p className={styles.trackingNote}>
                  Save this code to track your delivery. We've also sent it to your email.
                </p>
              </div>
            </div>
          )}

          {orderId && (
            <div className={styles.orderDetails}>
              <div className={styles.orderItem}>
                <span className={styles.orderLabel}>Order ID:</span>
                <span className={styles.orderValue}>#{orderId}</span>
              </div>
            </div>
          )}

          <div className={styles.successActions}>
            <button 
              className={styles.primaryButton}
              onClick={handleTrackOrder}
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
    </div>
  )
}

export default SuccessPage