import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { createStripeCheckoutSession } from '../../services/stripeService'
import styles from './PaymentPage.module.css'

// Initialize Stripe with the key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHED_KEY || 'pk_test_51RamUcHWjfKWu0SwXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')

interface PaymentData {
  name: string
  email: string
  phone: string
  address: string
  deliverySlot: string
  planType: 'veg' | 'non-veg'
  studentStatus: boolean
  subscriptionType: 'daily' | 'monthly'
  amount: number
  currency: string
}

const PaymentForm: React.FC<{ paymentData: PaymentData }> = ({ paymentData }) => {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')

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
      // Process payment with Stripe
      const { error } = await stripe.createPaymentMethod({
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
        throw new Error(error.message || 'Payment failed')
      }

      // Create Stripe checkout session and redirect
      const result = await createStripeCheckoutSession(paymentData)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session')
      }
      
      // The redirect happens in the createStripeCheckoutSession function
      // No need to do anything else here

    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError(error instanceof Error ? error.message : 'Payment processing failed. Please try again.')
      setIsProcessing(false)
    }
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