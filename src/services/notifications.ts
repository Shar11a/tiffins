import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/config';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Send subscription confirmation email
export const sendSubscriptionConfirmation = async (params: {
  customerName: string;
  customerEmail: string;
  trackingToken: string;
  planType: string;
  deliverySlot: string;
  orderId: string;
  dailyPrice: string;
  studentDiscount: boolean;
  subscriptionType: string;
}) => {
  console.warn('Client-side subscription confirmation is deprecated. This is now handled by the verifyCheckoutSession Firebase Function.');
  return { status: 200 }; // Return a mock success response
};

// Send delivery status update email
export const sendDeliveryStatusUpdate = async (
  customerEmail: string,
  customerName: string,
  trackingToken: string,
  status: string,
  estimatedArrival: string
) => {
  try {
    console.log('Calling sendDeliveryStatusUpdate function with params:', {
      customerEmail,
      customerName,
      trackingToken,
      status,
      estimatedArrival
    });
    
    const sendStatusUpdate = httpsCallable(functions, 'sendDeliveryStatusUpdate');
    
    const result = await sendStatusUpdate({
      customerEmail,
      customerName,
      trackingToken,
      status,
      estimatedArrival
    });
    
    console.log('Status update email function result:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending delivery status update email:', error);
    throw error;
  }
};

// Send delivery OTP email
export const sendDeliveryOTP = async (
  customerEmail: string,
  customerName: string,
  otp: string,
  orderId: string
) => {
  try {
    console.log('Calling sendDeliveryOTPEmail function with params:', {
      customerEmail,
      customerName,
      otp,
      orderId
    });
    
    const sendOTPEmail = httpsCallable(functions, 'sendDeliveryOTPEmail');
    
    const result = await sendOTPEmail({
      customerEmail,
      customerName,
      otp,
      orderId
    });
    
    console.log('OTP email function result:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending delivery OTP email:', error);
    throw error;
  }
};

// Send delivery completion email
export const sendDeliveryCompletion = async (
  customerEmail: string,
  customerName: string,
  trackingToken: string,
  otp: string
) => {
  try {
    console.log('Calling sendDeliveryCompletionEmail function with params:', {
      customerEmail,
      customerName,
      trackingToken,
      otp
    });
    
    const sendCompletionEmail = httpsCallable(functions, 'sendDeliveryCompletionEmail');
    
    const result = await sendCompletionEmail({
      customerEmail,
      customerName,
      trackingToken,
      otp,
      deliveryTime: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    });
    
    console.log('Completion email function result:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending delivery completion email:', error);
    throw error;
  }
};

// Test email function
export const testEmail = async (email: string) => {
  try {
    const response = await fetch(`https://us-central1-tiffinbox-564cc.cloudfunctions.net/testEmail?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error testing email:', error);
    throw error;
  }
};