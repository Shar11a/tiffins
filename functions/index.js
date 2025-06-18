const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || functions.config().stripe.key);
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// Generate secure tracking token
const generateTrackingToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create a Checkout Session
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  try {
    const { planType, userEmail, price, userId, customerData } = data;
    
    if (!planType || !userEmail || !price || !customerData) {
      throw new Error('Missing required fields');
    }

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `TiffinBox ${planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} ${customerData.subscriptionType === 'monthly' ? 'Monthly' : 'Daily'} Plan`,
              description: `${planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} tiffin delivery service`,
            },
            unit_amount: price, // Price in pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${functions.config().app.url || 'https://joyful-gnome-a3b9ae.netlify.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${functions.config().app.url || 'https://joyful-gnome-a3b9ae.netlify.app'}/subscription`,
      customer_email: userEmail,
      metadata: {
        planType,
        userId: userId || '',
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        deliverySlot: customerData.deliverySlot,
        studentStatus: customerData.studentStatus.toString(),
        subscriptionType: customerData.subscriptionType,
      },
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// HTTP version of createCheckoutSession with CORS support
exports.createCheckoutSessionHttp = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { planType, userEmail, price, userId, customerData } = req.body;
      
      if (!planType || !userEmail || !price || !customerData) {
        res.status(400).send('Missing required fields');
        return;
      }

      // Create a Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: `TiffinBox ${planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} ${customerData.subscriptionType === 'monthly' ? 'Monthly' : 'Daily'} Plan`,
                description: `${planType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} tiffin delivery service`,
              },
              unit_amount: price, // Price in pence
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${functions.config().app.url || 'https://joyful-gnome-a3b9ae.netlify.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${functions.config().app.url || 'https://joyful-gnome-a3b9ae.netlify.app'}/subscription`,
        customer_email: userEmail,
        metadata: {
          planType,
          userId: userId || '',
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          deliverySlot: customerData.deliverySlot,
          studentStatus: customerData.studentStatus.toString(),
          subscriptionType: customerData.subscriptionType,
        },
      });

      res.status(200).json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Verify a Checkout Session and create customer records
exports.verifyCheckoutSession = functions.https.onCall(async (data, context) => {
  try {
    const { sessionId } = data;
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify payment status
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    // Extract customer data from metadata
    const { 
      planType, 
      userId, 
      name, 
      phone, 
      address, 
      deliverySlot, 
      studentStatus, 
      subscriptionType 
    } = session.metadata;

    // Generate tracking token
    const trackingToken = generateTrackingToken();
    
    // Calculate subscription end date if monthly
    let subscriptionEndDate = null;
    if (subscriptionType === 'monthly') {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days from now
      subscriptionEndDate = admin.firestore.Timestamp.fromDate(endDate);
    }
    
    // Create or update customer record
    let customerId;
    
    // Check if customer already exists (by userId if available, or by email)
    let customerQuery;
    if (userId) {
      customerQuery = await db.collection('customers')
        .where('userId', '==', userId)
        .limit(1)
        .get();
    } else if (session.customer_email) {
      customerQuery = await db.collection('customers')
        .where('email', '==', session.customer_email)
        .limit(1)
        .get();
    }
    
    if (customerQuery && !customerQuery.empty) {
      // Update existing customer
      const customerDoc = customerQuery.docs[0];
      customerId = customerDoc.id;
      
      await customerDoc.ref.update({
        planType,
        deliverySlot,
        studentStatus: studentStatus === 'true',
        subscriptionType,
        trackingToken,
        ...(subscriptionEndDate && { subscriptionEndDate }),
        ...(userId && { userId }),
      });
    } else {
      // Create new customer
      const customerRef = await db.collection('customers').add({
        name,
        email: session.customer_email,
        phone,
        address,
        deliverySlot,
        planType,
        studentStatus: studentStatus === 'true',
        subscriptionType,
        orderDate: admin.firestore.Timestamp.now(),
        trackingToken,
        ...(subscriptionEndDate && { subscriptionEndDate }),
        ...(userId && { userId }),
      });
      
      customerId = customerRef.id;
    }
    
    // Generate order ID
    const orderId = `TFN${Date.now().toString().slice(-6)}`;
    
    // Create payment record
    await db.collection('paymentHistory').add({
      customerId,
      amount: session.amount_total,
      currency: session.currency,
      status: 'succeeded',
      paymentMethod: 'card',
      stripeSessionId: session.id,
      createdAt: admin.firestore.Timestamp.now(),
      metadata: {
        planType,
        subscriptionType,
        studentStatus: studentStatus === 'true',
      },
    });
    
    // Create initial delivery status
    await db.collection('deliveryStatus').doc(trackingToken).set({
      customerId,
      customerName: name,
      orderId,
      trackingToken,
      status: 'prepared',
      assignedPartner: 'unassigned',
      currentLocation: 'Kitchen - Being Prepared',
      estimatedArrival: calculateETA(deliverySlot),
      lastUpdated: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000)), // 48 hours
    });
    
    // Try to send confirmation email
    try {
      // This would typically call your email service
      // For now, we'll just log it
      console.log(`Sending confirmation email to ${session.customer_email}`);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't throw error - payment verification should still succeed
    }
    
    return { 
      success: true, 
      trackingToken,
      orderId,
      customerId,
    };
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// HTTP version of verifyCheckoutSession with CORS support
exports.verifyCheckoutSessionHttp = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { sessionId } = req.body;
      
      if (!sessionId) {
        res.status(400).send('Session ID is required');
        return;
      }

      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Verify payment status
      if (session.payment_status !== 'paid') {
        res.status(400).json({ success: false, error: 'Payment not completed' });
        return;
      }

      // Extract customer data from metadata
      const { 
        planType, 
        userId, 
        name, 
        phone, 
        address, 
        deliverySlot, 
        studentStatus, 
        subscriptionType 
      } = session.metadata;

      // Generate tracking token
      const trackingToken = generateTrackingToken();
      
      // Calculate subscription end date if monthly
      let subscriptionEndDate = null;
      if (subscriptionType === 'monthly') {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 days from now
        subscriptionEndDate = admin.firestore.Timestamp.fromDate(endDate);
      }
      
      // Create or update customer record
      let customerId;
      
      // Check if customer already exists (by userId if available, or by email)
      let customerQuery;
      if (userId) {
        customerQuery = await db.collection('customers')
          .where('userId', '==', userId)
          .limit(1)
          .get();
      } else if (session.customer_email) {
        customerQuery = await db.collection('customers')
          .where('email', '==', session.customer_email)
          .limit(1)
          .get();
      }
      
      if (customerQuery && !customerQuery.empty) {
        // Update existing customer
        const customerDoc = customerQuery.docs[0];
        customerId = customerDoc.id;
        
        await customerDoc.ref.update({
          planType,
          deliverySlot,
          studentStatus: studentStatus === 'true',
          subscriptionType,
          trackingToken,
          ...(subscriptionEndDate && { subscriptionEndDate }),
          ...(userId && { userId }),
        });
      } else {
        // Create new customer
        const customerRef = await db.collection('customers').add({
          name,
          email: session.customer_email,
          phone,
          address,
          deliverySlot,
          planType,
          studentStatus: studentStatus === 'true',
          subscriptionType,
          orderDate: admin.firestore.Timestamp.now(),
          trackingToken,
          ...(subscriptionEndDate && { subscriptionEndDate }),
          ...(userId && { userId }),
        });
        
        customerId = customerRef.id;
      }
      
      // Generate order ID
      const orderId = `TFN${Date.now().toString().slice(-6)}`;
      
      // Create payment record
      await db.collection('paymentHistory').add({
        customerId,
        amount: session.amount_total,
        currency: session.currency,
        status: 'succeeded',
        paymentMethod: 'card',
        stripeSessionId: session.id,
        createdAt: admin.firestore.Timestamp.now(),
        metadata: {
          planType,
          subscriptionType,
          studentStatus: studentStatus === 'true',
        },
      });
      
      // Create initial delivery status
      await db.collection('deliveryStatus').doc(trackingToken).set({
        customerId,
        customerName: name,
        orderId,
        trackingToken,
        status: 'prepared',
        assignedPartner: 'unassigned',
        currentLocation: 'Kitchen - Being Prepared',
        estimatedArrival: calculateETA(deliverySlot),
        lastUpdated: admin.firestore.Timestamp.now(),
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000)), // 48 hours
      });
      
      res.status(200).json({ 
        success: true, 
        trackingToken,
        orderId,
        customerId,
      });
    } catch (error) {
      console.error('Error verifying checkout session:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
});

// Calculate ETA based on delivery slot
const calculateETA = (deliverySlot) => {
  const today = new Date();
  const [hours, minutes] = deliverySlot.split(':').map(Number);
  today.setHours(hours, minutes, 0, 0);
  
  // If time has passed, set for tomorrow
  if (today < new Date()) {
    today.setDate(today.getDate() + 1);
  }
  
  return today.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};