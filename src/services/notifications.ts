import emailjs from '@emailjs/browser'

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_hzu8z7c'
const EMAILJS_TEMPLATE_ID = 'template_8yqlvhs'
const EMAILJS_PUBLIC_KEY = '_IWwL1bxz1OHGwmHT'

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY)

export interface EmailNotificationData {
  customerName: string
  customerEmail: string
  trackingToken: string
  planType: 'veg' | 'non-veg'
  deliverySlot: string
  orderId: string
  dailyPrice: string
  studentDiscount: boolean
  subscriptionType?: 'daily' | 'monthly'
}

export const sendSubscriptionConfirmation = async (data: EmailNotificationData): Promise<boolean> => {
  try {
    const subscriptionDetails = data.subscriptionType === 'monthly' 
      ? 'Monthly subscription (30 days)' 
      : 'Daily subscription'

    const templateParams = {
      to_name: data.customerName,
      to_email: data.customerEmail,
      tracking_code: data.trackingToken,
      plan_type: data.planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian',
      delivery_time: data.deliverySlot,
      order_id: data.orderId,
      daily_price: data.dailyPrice,
      student_discount: data.studentDiscount ? 'Yes (20% off)' : 'No',
      message: `Dear ${data.customerName},

Thank you for subscribing to TiffinBox! Your order has been confirmed and we're excited to start delivering delicious, home-cooked meals to your doorstep.

📋 ORDER DETAILS:
• Order ID: ${data.orderId}
• Plan: ${data.planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
• Subscription: ${subscriptionDetails}
• Delivery Time: ${data.deliverySlot}
• Price: ${data.dailyPrice}${data.studentDiscount ? ' (20% student discount applied)' : ''}

📱 TRACKING INFORMATION:
Your tracking code is: ${data.trackingToken}
Save this code to track your delivery status anytime at: https://tiffinbox.com/tracking

🍱 WHAT'S NEXT:
1. We'll start preparing your fresh meal
2. You'll receive email updates on delivery status
3. Track your order in real-time using your tracking code
4. Enjoy your delicious home-cooked meal!

Need help? Contact us:
📞 Phone: +44 7XXX XXXXXX
💬 WhatsApp: +44 7XXX XXXXXX
📧 Email: support@tiffinbox.com

Thank you for choosing TiffinBox - Home on your plate! ❤️

Best regards,
The TiffinBox Team`
    }

    const emailResponse = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    )

    console.log('Email sent successfully:', emailResponse.status, emailResponse.text)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

export const sendDeliveryStatusUpdate = async (
  customerEmail: string,
  customerName: string,
  trackingToken: string,
  status: string,
  estimatedArrival: string
): Promise<boolean> => {
  try {
    const statusMessages = {
      prepared: 'Your tiffin is being prepared with love! 👨‍🍳',
      pickedUp: 'Your tiffin has been picked up and is on its way! 📦',
      onTheWay: 'Your delivery partner is on the way to you! 🚚',
      delivered: 'Your tiffin has been delivered! Enjoy your meal! 🍱'
    }

    const templateParams = {
      to_name: customerName,
      to_email: customerEmail,
      tracking_code: trackingToken,
      delivery_status: status,
      estimated_arrival: estimatedArrival,
      message: `Dear ${customerName},

${statusMessages[status as keyof typeof statusMessages] || 'Your delivery status has been updated!'}

📱 TRACKING CODE: ${trackingToken}
📍 STATUS: ${status.charAt(0).toUpperCase() + status.slice(1)}
⏰ ESTIMATED ARRIVAL: ${estimatedArrival}

Track your order in real-time: https://tiffinbox.com/tracking

Need help? Contact us at +44 7XXX XXXXXX

Best regards,
The TiffinBox Team`
    }

    const emailResponse = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    )

    console.log('Status update email sent successfully:', emailResponse.status)
    return true
  } catch (error) {
    console.error('Failed to send status update email:', error)
    return false
  }
}

// Send OTP to customer for delivery confirmation
export const sendDeliveryOTP = async (
  customerEmail: string,
  customerName: string,
  otp: string,
  orderId: string
): Promise<boolean> => {
  try {
    const templateParams = {
      to_name: customerName,
      to_email: customerEmail,
      tracking_code: otp,
      order_id: orderId,
      message: `Dear ${customerName},

🚚 Your TiffinBox delivery partner is on the way!

📱 DELIVERY CONFIRMATION OTP: ${otp}

🏠 When the delivery partner arrives at your location, please provide this OTP to confirm receipt of your order.

📋 Order ID: ${orderId}

⚠️ IMPORTANT: Only share this OTP with the TiffinBox delivery partner when they arrive at your doorstep.

Need help? Contact us at +44 7XXX XXXXXX

Best regards,
The TiffinBox Team`
    }

    const emailResponse = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    )

    console.log('OTP email sent successfully:', emailResponse.status)
    return true
  } catch (error) {
    console.error('Failed to send OTP email:', error)
    return false
  }
}

// Send delivery completion confirmation
export const sendDeliveryCompletion = async (
  customerEmail: string,
  customerName: string,
  trackingToken: string,
  otp: string
): Promise<boolean> => {
  try {
    const templateParams = {
      to_name: customerName,
      to_email: customerEmail,
      tracking_code: trackingToken,
      order_id: otp,
      message: `Dear ${customerName},

🎉 Your TiffinBox order has been successfully delivered!

✅ DELIVERY CONFIRMED with OTP: ${otp}
📱 TRACKING CODE: ${trackingToken}
🕒 DELIVERED AT: ${new Date().toLocaleString()}

We hope you enjoy your delicious, home-cooked meal! 🍱

📝 FEEDBACK: We'd love to hear about your experience. Reply to this email with your feedback.

🔄 NEXT DELIVERY: Your next tiffin will be prepared and delivered according to your subscription schedule.

Need help? Contact us at +44 7XXX XXXXXX

Thank you for choosing TiffinBox - Home on your plate! ❤️

Best regards,
The TiffinBox Team`
    }

    const emailResponse = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    )

    console.log('Delivery completion email sent successfully:', emailResponse.status)
    return true
  } catch (error) {
    console.error('Failed to send delivery completion email:', error)
    return false
  }
}

// Test email function (for development)
export const sendTestEmail = async (testEmail: string): Promise<boolean> => {
  try {
    const templateParams = {
      to_name: 'Test User',
      to_email: testEmail,
      tracking_code: 'TEST1234',
      message: 'This is a test email from TiffinBox to verify EmailJS integration is working correctly.'
    }

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    )

    console.log('Test email sent successfully:', response.status)
    return true
  } catch (error) {
    console.error('Failed to send test email:', error)
    return false
  }
}