import emailjs from '@emailjs/browser';

// Initialize EmailJS with your user ID
const emailjsInit = () => {
  const userId = import.meta.env.VITE_EMAILJS_USER_ID || '_IWwL1bxz1OHGwmHT';
  emailjs.init(userId);
};

// Initialize EmailJS
emailjsInit();

// Email template IDs
const TEMPLATES = {
  SUBSCRIPTION_CONFIRMATION: 'template_subscription_confirmation',
  DELIVERY_STATUS_UPDATE: 'template_delivery_update',
  DELIVERY_OTP: 'template_delivery_otp',
  DELIVERY_COMPLETION: 'template_delivery_completion'
};

// Service ID
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_hzu8z7c';

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
  try {
    const templateParams = {
      to_name: params.customerName,
      to_email: params.customerEmail,
      tracking_code: params.trackingToken,
      plan_type: params.planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian',
      delivery_slot: params.deliverySlot,
      order_id: params.orderId,
      price: params.dailyPrice,
      discount_applied: params.studentDiscount ? 'Yes (20% Student Discount)' : 'No',
      subscription_type: params.subscriptionType === 'monthly' ? 'Monthly (30 days)' : 'Daily'
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATES.SUBSCRIPTION_CONFIRMATION,
      templateParams
    );

    return response;
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
    throw error;
  }
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
    const statusText = 
      status === 'prepared' ? 'Your tiffin is being prepared' :
      status === 'pickedUp' ? 'Your tiffin has been picked up' :
      status === 'onTheWay' ? 'Your tiffin is on the way' :
      'Your tiffin has been delivered';

    const templateParams = {
      to_name: customerName,
      to_email: customerEmail,
      tracking_code: trackingToken,
      status: statusText,
      estimated_arrival: estimatedArrival,
      tracking_url: `${window.location.origin}/tracking?code=${trackingToken}`
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATES.DELIVERY_STATUS_UPDATE,
      templateParams
    );

    return response;
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
    const templateParams = {
      to_name: customerName,
      to_email: customerEmail,
      otp: otp,
      order_id: orderId
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATES.DELIVERY_OTP,
      templateParams
    );

    return response;
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
    const templateParams = {
      to_name: customerName,
      to_email: customerEmail,
      tracking_code: trackingToken,
      otp: otp,
      delivery_time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATES.DELIVERY_COMPLETION,
      templateParams
    );

    return response;
  } catch (error) {
    console.error('Error sending delivery completion email:', error);
    throw error;
  }
};