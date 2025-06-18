import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { addCustomer } from '../../services/firestore'
import styles from './PaymentPage.module.css'

// Initialize Stripe with the key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHED_KEY || 'pk_live_51RamUcHWjfKWu0Swhb89dRrho2hHHRxU0M1A3VwDiRsWUbiPU55xVFc7Tdw2WHv7q6VWfA548UG2ScK9kJdfqFRG00UO3mKPWE')

interface PaymentData {
  name: string
  email: string
  phone: string
  address: string
  deliverySlot: string
  planType: 'veg' | 'non-veg'
  studentStatus: boolean
  amount: number
  currency: string
}

const PaymentForm: React.FC<{ paymentData: PaymentData }> = ({ paymentData }) => {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [trackingToken, setTrackingToken] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentError('')

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setPaymentError('Card element not found')
      setIsProcessing(false)
      return
    }

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: paymentData.name,
          email: paymentData.email,
          phone: paymentData.phone,
          address: {
            line1: paymentData.address,
          },
        },
      })

      if (error) {
        setPaymentError(error.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      // In a real implementation, you would send the payment method to your backend
      // For demo purposes, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create customer record after successful payment
      const result = await addCustomer({
        name: paymentData.name,
        email: paymentData.email,
        phone: paymentData.phone,
        address: paymentData.address,
        deliverySlot: paymentData.deliverySlot,
        planType: paymentData.planType,
        studentStatus: paymentData.studentStatus
      })

      setTrackingToken(result.trackingToken)
      setPaymentSuccess(true)

    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError('Payment processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTrackOrder = () => {
    navigate('/tracking')
  }

  const handleNewOrder = () => {
    navigate('/subscription')
  }

  if (paymentSuccess) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.successTitle}>Payment Successful!</h2>
          <p className={styles.successMessage}>
            Your payment has been processed and your tiffin subscription is now active.
          </p>
          
          <div className={styles.trackingSection}>
            <div className={styles.trackingCard}>
              <h3 className={styles.trackingTitle}>📱 Your Tracking Code</h3>
              <div className={styles.trackingCode}>{trackingToken}</div>
              <p className={styles.trackingNote}>
                Save this code to track your delivery. We've also sent it to your email.
              </p>
            </div>
          </div>

          <div className={styles.orderSummary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            <div className={styles.summaryDetails}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Plan:</span>
                <span className={styles.summaryValue}>
                  {paymentData.planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Delivery Time:</span>
                <span className={styles.summaryValue}>{paymentData.deliverySlot}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Amount Paid:</span>
                <span className={styles.summaryValue}>
                  £{(paymentData.amount / 100).toFixed(2)}
                  {paymentData.studentStatus && ' (20% student discount applied)'}
                </span>
              </div>
            </div>
          </div>

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
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.paymentForm}>
      <div className={styles.cardSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>💳</span>
          Payment Details
        </h3>
        
        <div className={styles.cardElementContainer}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#2b2b2b',
                  fontFamily: 'Poppins, sans-serif',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#dc2626',
                  iconColor: '#dc2626',
                },
              },
            }}
            className={styles.cardElement}
          />
        </div>

        {paymentError && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {paymentError}
          </div>
        )}

        <div className={styles.securityNote}>
          <span className={styles.securityIcon}>🔒</span>
          <span className={styles.securityText}>
            Your payment information is secure and encrypted
          </span>
        </div>
      </div>

      <button
        type="submit"
        className={styles.payButton}
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <span className={styles.spinner}></span>
            Processing Payment...
          </>
        ) : (
          <>
            <span className={styles.buttonIcon}>💳</span>
            Pay £{(paymentData.amount / 100).toFixed(2)}
          </>
        )}
      </button>
    </form>
  )
}

const PaymentPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)

  useEffect(() => {
    // Get payment data from navigation state
    if (location.state?.paymentData) {
      setPaymentData(location.state.paymentData)
    } else {
      // Redirect to subscription if no payment data
      navigate('/subscription')
    }
  }, [location.state, navigate])

  if (!paymentData) {
    return (
      <div className={styles.paymentPage}>
        <div className={styles.container}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingIcon}>⏳</div>
            <h2 className={styles.loadingTitle}>Loading Payment...</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.paymentPage}>
      <div className={styles.container}>
        <div className={styles.paymentCard}>
          <div className={styles.header}>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/subscription')}
            >
              ← Back to Subscription
            </button>
            <h2 className={styles.title}>Complete Your Payment</h2>
            <p className={styles.subtitle}>
              Secure payment powered by Stripe
            </p>
          </div>

          <div className={styles.orderSummary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>
            <div className={styles.summaryDetails}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Plan:</span>
                <span className={styles.summaryValue}>
                  {paymentData.planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Delivery Time:</span>
                <span className={styles.summaryValue}>{paymentData.deliverySlot}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Customer:</span>
                <span className={styles.summaryValue}>{paymentData.name}</span>
              </div>
              {paymentData.studentStatus && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Student Discount:</span>
                  <span className={styles.summaryValue}>20% off</span>
                </div>
              )}
              <div className={styles.summaryDivider}></div>
              <div className={styles.summaryItem}>
                <span className={styles.totalLabel}>Total Amount:</span>
                <span className={styles.totalValue}>
                  £{(paymentData.amount / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm paymentData={paymentData} />
          </Elements>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage