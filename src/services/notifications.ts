import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';

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
    const sendStatusUpdate = httpsCallable(functions, 'sendDeliveryStatusUpdate');
    
    const result = await sendStatusUpdate({
      customerEmail,
      customerName,
      trackingToken,
      status,
      estimatedArrival
    });
    
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
    const sendOTPEmail = httpsCallable(functions, 'sendDeliveryOTPEmail');
    
    const result = await sendOTPEmail({
      customerEmail,
      customerName,
      otp,
      orderId
    });
    
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
    
    return result.data;
  } catch (error) {
    console.error('Error sending delivery completion email:', error);
    throw error;
  }
};