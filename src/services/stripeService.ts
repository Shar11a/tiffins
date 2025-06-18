import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHED_KEY || 'pk_test_51RamUcHWjfKWu0SwXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

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
}

// Function to create a checkout session
export const createCheckoutSession = async (paymentData: PaymentData) => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Create a checkout session on your server
    // For demo purposes, we'll simulate this with a direct Stripe call
    const session = {
      id: `cs_test_${Math.random().toString(36).substring(2, 15)}`,
      amount: paymentData.amount,
      currency: 'gbp',
      customer_email: paymentData.email,
      payment_status: 'paid',
      customer_details: {
        name: paymentData.name,
        email: paymentData.email,
        phone: paymentData.phone,
        address: {
          line1: paymentData.address
        }
      }
    };

    return {
      sessionId: session.id,
      success: true,
      session
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to handle the checkout process
export const handleCheckout = async (paymentData: PaymentData) => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Create a checkout session
    const { sessionId, success, error, session } = await createCheckoutSession(paymentData);
    
    if (!success || !sessionId) {
      throw new Error(error || 'Failed to create checkout session');
    }

    // For demo purposes, we'll simulate a successful payment
    // In a real implementation, you would redirect to the Stripe Checkout page
    // return stripe.redirectToCheckout({ sessionId });
    
    return {
      success: true,
      session
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};