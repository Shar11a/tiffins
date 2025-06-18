import { loadStripe, Stripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/config';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Initialize Stripe with the key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHED_KEY);

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
 */
export const createStripeCheckoutSession = async (paymentData: PaymentData): Promise<{ success: boolean; error?: string }> => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Get the current user ID if available
    const userId = localStorage.getItem('userId') || null;

    // Call the Firebase function to create a checkout session
    const createCheckoutSessionFn = httpsCallable(functions, 'createCheckoutSession');
    const response = await createCheckoutSessionFn({
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
    });

    // Extract the session ID from the response
    const { sessionId } = (response.data as { sessionId: string });

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
 */
export const verifyStripeCheckoutSession = async (sessionId: string): Promise<{
  success: boolean;
  trackingToken?: string;
  orderId?: string;
  error?: string;
}> => {
  try {
    // Call the Firebase function to verify the checkout session
    const verifyCheckoutSessionFn = httpsCallable(functions, 'verifyCheckoutSession');
    const response = await verifyCheckoutSessionFn({ sessionId });

    const { success, trackingToken, orderId } = (response.data as {
      success: boolean;
      trackingToken?: string;
      orderId?: string;
    });

    if (!success) {
      throw new Error('Payment verification failed');
    }

    return { success, trackingToken, orderId };
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};