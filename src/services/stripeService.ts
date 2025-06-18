import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHED_KEY);

// Firebase function base URL - replace with your actual project ID
const FIREBASE_FUNCTIONS_BASE_URL = 'https://us-central1-tiffinbox-564cc.cloudfunctions.net';

export interface PaymentData {
  name: string;
  email: string;
  phone: string;
  address: string;
  deliverySlot: string;
  planType: 'veg' | 'non-veg';
  studentStatus: boolean;
  subscriptionType: 'daily' | 'monthly';
  amount: number;
  currency: string;
}

/**
 * Creates a Stripe checkout session and redirects to the Stripe-hosted checkout page
 * Using HTTP endpoint instead of callable function to avoid CORS issues
 */
export const createStripeCheckoutSession = async (paymentData: PaymentData): Promise<{ success: boolean; error?: string }> => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Get the current user ID if available
    const userId = localStorage.getItem('userId') || null;

    // Call the Firebase HTTP function to create a checkout session
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/createCheckoutSessionHttp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planType: paymentData.planType,
        userEmail: paymentData.email,
        price: paymentData.amount,
        userId,
        customerData: {
          name: paymentData.name,
          phone: paymentData.phone,
          address: paymentData.address,
          deliverySlot: paymentData.deliverySlot,
          studentStatus: paymentData.studentStatus,
          subscriptionType: paymentData.subscriptionType
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();

    if (!sessionId) {
      throw new Error('Failed to create checkout session');
    }

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      throw new Error(error.message || 'Failed to redirect to checkout');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Verifies a completed Stripe checkout session
 * Using HTTP endpoint instead of callable function to avoid CORS issues
 */
export const verifyStripeCheckoutSession = async (sessionId: string): Promise<{
  success: boolean;
  trackingToken?: string;
  orderId?: string;
  error?: string;
}> => {
  try {
    // Call the Firebase HTTP function to verify the checkout session
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/verifyCheckoutSessionHttp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Payment verification failed');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('Payment verification failed');
    }

    return { 
      success: true, 
      trackingToken: data.trackingToken, 
      orderId: data.orderId 
    };
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};