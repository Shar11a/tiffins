const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY || functions.config().stripe.key
);
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || functions.config().email?.from || "noreply@tiffinbox.co.uk";
const EMAIL_HOST = process.env.EMAIL_HOST || functions.config().email?.host || "smtp.gmail.com";
const EMAIL_USER = process.env.EMAIL_USER || functions.config().email?.user;
const EMAIL_PASS = "fkcj odlm ogxs ljwj"; // Updated with the app password

// Initialize email transporter
let transporter = null;
if (EMAIL_USER) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

// Generate secure tracking token
const generateTrackingToken = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Send subscription confirmation email
const sendSubscriptionConfirmationEmail = async (params) => {
  try {
    if (!transporter) {
      console.error("Email configuration missing. Cannot send email.");
      return;
    }

    // Create email content
    const message = {
      from: `TiffinBox <${EMAIL_FROM}>`,
      to: params.customerEmail,
      subject: 'Your TiffinBox Subscription Confirmation',
      text: `Hello ${params.customerName},\n\nThank you for subscribing to TiffinBox! Your order has been confirmed.\n\nOrder ID: ${params.orderId}\nTracking Code: ${params.trackingToken}\nPlan: ${params.planType === "veg" ? "Vegetarian" : "Non-Vegetarian"}\nDelivery Slot: ${params.deliverySlot}\nPrice: ${params.price}\n\nYou can track your delivery at: https://tiffinbox.co.uk/tracking\n\nThank you for choosing TiffinBox!\n`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #d62828;">TiffinBox Subscription Confirmed!</h2>
          <p>Hello ${params.customerName},</p>
          <p>Thank you for subscribing to TiffinBox! Your order has been confirmed and we're excited to serve you delicious home-cooked meals.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${params.orderId}</p>
            <p><strong>Tracking Code:</strong> ${params.trackingToken}</p>
            <p><strong>Plan Type:</strong> ${params.planType === "veg" ? "Vegetarian" : "Non-Vegetarian"}</p>
            <p><strong>Subscription:</strong> ${params.subscriptionType === "monthly" ? "Monthly (30 days)" : "Daily"}</p>
            <p><strong>Delivery Slot:</strong> ${params.deliverySlot}</p>
            <p><strong>Price:</strong> ${params.price}</p>
            <p><strong>Student Discount:</strong> ${params.studentDiscount ? "Yes (20% applied)" : "No"}</p>
          </div>
          
          <p>You can track your delivery status anytime using your tracking code at:</p>
          <p><a href="https://tiffinbox.co.uk/tracking" style="color: #d62828; text-decoration: none; font-weight: bold;">Track My Tiffin</a></p>
          
          <p>Thank you for choosing TiffinBox!</p>
          <p>Warm regards,<br>The TiffinBox Team</p>
        </div>
      `
    };

    // Send email
    const result = await transporter.sendMail(message);
    console.log("Email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending subscription confirmation email:", error);
    throw error;
  }
};

// Create a Checkout Session
exports.createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    try {
      const { planType, userEmail, price, userId, customerData } = data;

      if (!planType || !userEmail || !price || !customerData) {
        throw new Error("Missing required fields");
      }

      // Create a Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `TiffinBox ${
                  planType === "veg" ? "Vegetarian" : "Non-Vegetarian"
                } ${
                  customerData.subscriptionType === "monthly"
                    ? "Monthly"
                    : "Daily"
                } Plan`,
                description: `${
                  planType === "veg" ? "Vegetarian" : "Non-Vegetarian"
                } tiffin delivery service`,
              },
              unit_amount: price, // Price in pence
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${
          functions.config().app.url || "https://tiffinbox.co.uk"
        }/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${
          functions.config().app.url || "https://tiffinbox.co.uk"
        }/subscription`,
        customer_email: userEmail,
        metadata: {
          planType,
          userId: userId || "",
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
      console.error("Error creating checkout session:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// HTTP version of createCheckoutSession with CORS support
exports.createCheckoutSessionHttp = functions.https.onRequest((req, res) => {
  // Check if the origin is allowed
  const allowedOrigins = [
    "https://tiffinbox.co.uk",
    "https://www.tiffinbox.co.uk",
    "https://joyful-gnome-a3b9ae.netlify.app",
  ];

  const origin = req.headers.origin;

  // Set CORS headers based on the origin
  if (origin && allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");
  }

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const { planType, userEmail, price, userId, customerData } = req.body;

    if (!planType || !userEmail || !price || !customerData) {
      res.status(400).send("Missing required fields");
      return;
    }

    // Create a Checkout Session
    stripe.checkout.sessions
      .create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `TiffinBox ${
                  planType === "veg" ? "Vegetarian" : "Non-Vegetarian"
                } ${
                  customerData.subscriptionType === "monthly"
                    ? "Monthly"
                    : "Daily"
                } Plan`,
                description: `${
                  planType === "veg" ? "Vegetarian" : "Non-Vegetarian"
                } tiffin delivery service`,
              },
              unit_amount: price, // Price in pence
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${
          functions.config().app.url || "https://tiffinbox.co.uk"
        }/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${
          functions.config().app.url || "https://tiffinbox.co.uk"
        }/subscription`,
        customer_email: userEmail,
        metadata: {
          planType,
          userId: userId || "",
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          deliverySlot: customerData.deliverySlot,
          studentStatus: customerData.studentStatus.toString(),
          subscriptionType: customerData.subscriptionType,
        },
      })
      .then((session) => {
        res.status(200).json({ sessionId: session.id });
      })
      .catch((error) => {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: error.message });
      });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify a Checkout Session and create customer records
exports.verifyCheckoutSession = functions.https.onCall(
  async (data, context) => {
    try {
      const { sessionId } = data;

      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verify payment status
      if (session.payment_status !== "paid") {
        throw new Error("Payment not completed");
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
        subscriptionType,
      } = session.metadata;

      // Generate tracking token
      const trackingToken = generateTrackingToken();

      // Calculate subscription end date if monthly
      let subscriptionEndDate = null;
      if (subscriptionType === "monthly") {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 days from now
        subscriptionEndDate = admin.firestore.Timestamp.fromDate(endDate);
      }

      // Create or update customer record
      let customerId;

      // Check if customer already exists (by userId if available, or by email)
      let customerQuery;
      if (userId) {
        customerQuery = await db
          .collection("customers")
          .where("userId", "==", userId)
          .limit(1)
          .get();
      } else if (session.customer_email) {
        customerQuery = await db
          .collection("customers")
          .where("email", "==", session.customer_email)
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
          studentStatus: studentStatus === "true",
          subscriptionType,
          trackingToken,
          ...(subscriptionEndDate && { subscriptionEndDate }),
          ...(userId && { userId }),
        });
      } else {
        // Create new customer
        const customerRef = await db.collection("customers").add({
          name,
          email: session.customer_email,
          phone,
          address,
          deliverySlot,
          planType,
          studentStatus: studentStatus === "true",
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
      await db.collection("paymentHistory").add({
        customerId,
        amount: session.amount_total,
        currency: session.currency,
        status: "succeeded",
        paymentMethod: "card",
        stripeSessionId: session.id,
        createdAt: admin.firestore.Timestamp.now(),
        metadata: {
          planType,
          subscriptionType,
          studentStatus: studentStatus === "true",
        },
      });

      // Create initial delivery status
      await db
        .collection("deliveryStatus")
        .doc(trackingToken)
        .set({
          customerId,
          customerName: name,
          orderId,
          trackingToken,
          status: "prepared",
          assignedPartner: "unassigned",
          currentLocation: "Kitchen - Being Prepared",
          estimatedArrival: calculateETA(deliverySlot),
          lastUpdated: admin.firestore.Timestamp.now(),
          expiresAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 48 * 60 * 60 * 1000)
          ), // 48 hours
        });

      // Send confirmation email
      try {
        // Calculate price string for email
        const basePrice = planType === "veg" ? 181.99 : 259.99;
        const finalPrice =
          studentStatus === "true" ? basePrice * 0.8 : basePrice;
        const priceDisplay =
          subscriptionType === "monthly"
            ? `£${finalPrice.toFixed(2)} for 30 days`
            : `£${basePrice.toFixed(2)}/day`;

        await sendSubscriptionConfirmationEmail({
          customerName: name,
          customerEmail: session.customer_email,
          trackingToken,
          planType,
          deliverySlot,
          orderId,
          price: priceDisplay,
          studentDiscount: studentStatus === "true",
          subscriptionType,
        });

        console.log(`Confirmation email sent to ${session.customer_email}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't throw error - payment verification should still succeed
      }

      return {
        success: true,
        trackingToken,
        orderId,
        customerId,
      };
    } catch (error) {
      console.error("Error verifying checkout session:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// HTTP version of verifyCheckoutSession with CORS support
exports.verifyCheckoutSessionHttp = functions.https.onRequest((req, res) => {
  // Check if the origin is allowed
  const allowedOrigins = [
    "https://tiffinbox.co.uk",
    "https://www.tiffinbox.co.uk",
    "https://joyful-gnome-a3b9ae.netlify.app",
  ];

  const origin = req.headers.origin;

  // Set CORS headers based on the origin
  if (origin && allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");
  }

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).send("Session ID is required");
      return;
    }

    // Retrieve the session from Stripe
    stripe.checkout.sessions
      .retrieve(sessionId)
      .then(async (session) => {
        // Verify payment status
        if (session.payment_status !== "paid") {
          res
            .status(400)
            .json({ success: false, error: "Payment not completed" });
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
          subscriptionType,
        } = session.metadata;

        // Generate tracking token
        const trackingToken = generateTrackingToken();

        // Calculate subscription end date if monthly
        let subscriptionEndDate = null;
        if (subscriptionType === "monthly") {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30); // 30 days from now
          subscriptionEndDate = admin.firestore.Timestamp.fromDate(endDate);
        }

        // Create or update customer record
        let customerId;

        // Check if customer already exists (by userId if available, or by email)
        let customerQuery;
        if (userId) {
          customerQuery = await db
            .collection("customers")
            .where("userId", "==", userId)
            .limit(1)
            .get();
        } else if (session.customer_email) {
          customerQuery = await db
            .collection("customers")
            .where("email", "==", session.customer_email)
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
            studentStatus: studentStatus === "true",
            subscriptionType,
            trackingToken,
            ...(subscriptionEndDate && { subscriptionEndDate }),
            ...(userId && { userId }),
          });
        } else {
          // Create new customer
          const customerRef = await db.collection("customers").add({
            name,
            email: session.customer_email,
            phone,
            address,
            deliverySlot,
            planType,
            studentStatus: studentStatus === "true",
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
        await db.collection("paymentHistory").add({
          customerId,
          amount: session.amount_total,
          currency: session.currency,
          status: "succeeded",
          paymentMethod: "card",
          stripeSessionId: session.id,
          createdAt: admin.firestore.Timestamp.now(),
          metadata: {
            planType,
            subscriptionType,
            studentStatus: studentStatus === "true",
          },
        });

        // Create initial delivery status
        await db
          .collection("deliveryStatus")
          .doc(trackingToken)
          .set({
            customerId,
            customerName: name,
            orderId,
            trackingToken,
            status: "prepared",
            assignedPartner: "unassigned",
            currentLocation: "Kitchen - Being Prepared",
            estimatedArrival: calculateETA(deliverySlot),
            lastUpdated: admin.firestore.Timestamp.now(),
            expiresAt: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 48 * 60 * 60 * 1000)
            ), // 48 hours
          });

        // Send confirmation email
        try {
          // Calculate price string for email
          const basePrice = planType === "veg" ? 181.99 : 259.99;
          const finalPrice =
            studentStatus === "true" ? basePrice * 0.8 : basePrice;
          const priceDisplay =
            subscriptionType === "monthly"
              ? `£${finalPrice.toFixed(2)} for 30 days`
              : `£${basePrice.toFixed(2)}/day`;

          await sendSubscriptionConfirmationEmail({
            customerName: name,
            customerEmail: session.customer_email,
            trackingToken,
            planType,
            deliverySlot,
            orderId,
            price: priceDisplay,
            studentDiscount: studentStatus === "true",
            subscriptionType,
          });

          console.log(`Confirmation email sent to ${session.customer_email}`);
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't throw error - payment verification should still succeed
        }

        res.status(200).json({
          success: true,
          trackingToken,
          orderId,
          customerId,
        });
      })
      .catch((error) => {
        console.error("Error verifying checkout session:", error);
        res.status(500).json({ success: false, error: error.message });
      });
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate ETA based on delivery slot
const calculateETA = (deliverySlot) => {
  const today = new Date();
  const [hours, minutes] = deliverySlot.split(":").map(Number);
  today.setHours(hours, minutes, 0, 0);

  // If time has passed, set for tomorrow
  if (today < new Date()) {
    today.setDate(today.getDate() + 1);
  }

  return today.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Stripe webhook handler
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    console.error("No Stripe signature found");
    return res.status(400).send("Webhook Error: No Stripe signature found");
  }

  // Get the webhook secret from environment variables or Firebase config
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET ||
    functions.config().stripe.webhook_secret;

  if (!webhookSecret) {
    console.error("Stripe webhook secret not configured");
    return res
      .status(500)
      .send("Webhook Error: Stripe webhook secret not configured");
  }

  let event;

  try {
    // Verify the event came from Stripe
    const rawBody = req.rawBody || req.body;

    if (!rawBody) {
      throw new Error("No raw body found in request");
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        // Process the successful checkout
        if (session.payment_status === "paid") {
          console.log(`Payment succeeded for session ${session.id}`);

          // Extract customer data from metadata
          const {
            planType,
            userId,
            name,
            phone,
            address,
            deliverySlot,
            studentStatus,
            subscriptionType,
          } = session.metadata;

          // Generate tracking token
          const trackingToken = generateTrackingToken();

          // Calculate subscription end date if monthly
          let subscriptionEndDate = null;
          if (subscriptionType === "monthly") {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // 30 days from now
            subscriptionEndDate = admin.firestore.Timestamp.fromDate(endDate);
          }

          // Create or update customer record
          let customerId;

          // Check if customer already exists (by userId if available, or by email)
          let customerQuery;
          if (userId) {
            customerQuery = await db
              .collection("customers")
              .where("userId", "==", userId)
              .limit(1)
              .get();
          } else if (session.customer_email) {
            customerQuery = await db
              .collection("customers")
              .where("email", "==", session.customer_email)
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
              studentStatus: studentStatus === "true",
              subscriptionType,
              trackingToken,
              ...(subscriptionEndDate && { subscriptionEndDate }),
              ...(userId && { userId }),
            });
          } else {
            // Create new customer
            const customerRef = await db.collection("customers").add({
              name,
              email: session.customer_email,
              phone,
              address,
              deliverySlot,
              planType,
              studentStatus: studentStatus === "true",
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
          await db.collection("paymentHistory").add({
            customerId,
            amount: session.amount_total,
            currency: session.currency,
            status: "succeeded",
            paymentMethod: "card",
            stripeSessionId: session.id,
            createdAt: admin.firestore.Timestamp.now(),
            metadata: {
              planType,
              subscriptionType,
              studentStatus: studentStatus === "true",
            },
          });

          // Create initial delivery status
          await db
            .collection("deliveryStatus")
            .doc(trackingToken)
            .set({
              customerId,
              customerName: name,
              orderId,
              trackingToken,
              status: "prepared",
              assignedPartner: "unassigned",
              currentLocation: "Kitchen - Being Prepared",
              estimatedArrival: calculateETA(deliverySlot),
              lastUpdated: admin.firestore.Timestamp.now(),
              expiresAt: admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 48 * 60 * 60 * 1000)
              ), // 48 hours
            });

          // Send confirmation email
          try {
            // Calculate price string for email
            const basePrice = planType === "veg" ? 181.99 : 259.99;
            const finalPrice =
              studentStatus === "true" ? basePrice * 0.8 : basePrice;
            const priceDisplay =
              subscriptionType === "monthly"
                ? `£${finalPrice.toFixed(2)} for 30 days`
                : `£${basePrice.toFixed(2)}/day`;

            await sendSubscriptionConfirmationEmail({
              customerName: name,
              customerEmail: session.customer_email,
              trackingToken,
              planType,
              deliverySlot,
              orderId,
              price: priceDisplay,
              studentDiscount: studentStatus === "true",
              subscriptionType,
            });

            console.log(`Confirmation email sent to ${session.customer_email}`);
          } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
            // Don't throw error - webhook should still succeed
          }

          console.log(
            `Created customer record and delivery status for ${name}`
          );
        }
        break;

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log(
          `PaymentIntent for ${paymentIntent.amount} was successful!`
        );
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object;
        console.log(
          `Payment failed: ${failedPaymentIntent.last_payment_error?.message}`
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send("Webhook received successfully");
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
});

// Send delivery status update email - FIXED to return a promise properly
exports.sendDeliveryStatusUpdate = functions.https.onCall(
  async (data, context) => {
    try {
      const {
        customerEmail,
        customerName,
        trackingToken,
        status,
        estimatedArrival
      } = data;

      if (!customerEmail || !customerName || !trackingToken || !status) {
        throw new Error("Missing required fields");
      }

      if (!transporter) {
        throw new Error("Email configuration missing");
      }

      const statusText =
        status === "prepared"
          ? "Your tiffin is being prepared"
          : status === "pickedUp"
          ? "Your tiffin has been picked up"
          : status === "onTheWay"
          ? "Your tiffin is on the way"
          : "Your tiffin has been delivered";

      // Send email using nodemailer
      const message = {
        from: `TiffinBox <${EMAIL_FROM}>`,
        to: customerEmail,
        subject: `TiffinBox Delivery Update: ${statusText}`,
        text: `Hello ${customerName},\n\nYour tiffin delivery status has been updated.\n\nStatus: ${statusText}\nTracking Code: ${trackingToken}\nEstimated Arrival: ${estimatedArrival || "Soon"}\n\nYou can track your delivery at: https://tiffinbox.co.uk/tracking\n\nThank you for choosing TiffinBox!\n`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #d62828;">TiffinBox Delivery Update</h2>
            <p>Hello ${customerName},</p>
            <p>Your tiffin delivery status has been updated.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #d62828;">Current Status: ${statusText}</h3>
              <p><strong>Tracking Code:</strong> ${trackingToken}</p>
              <p><strong>Estimated Arrival:</strong> ${estimatedArrival || "Soon"}</p>
            </div>
            
            <p>You can track your delivery status anytime using your tracking code at:</p>
            <p><a href="https://tiffinbox.co.uk/tracking" style="color: #d62828; text-decoration: none; font-weight: bold;">Track My Tiffin</a></p>
            
            <p>Thank you for choosing TiffinBox!</p>
            <p>Warm regards,<br>The TiffinBox Team</p>
          </div>
        `
      };

      // Send email and wait for the promise to resolve
      const result = await transporter.sendMail(message);
      console.log("Status update email sent successfully:", result);

      return { success: true };
    } catch (error) {
      console.error("Error sending status update email:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// Send delivery OTP email
exports.sendDeliveryOTPEmail = functions.https.onCall(
  async (data, context) => {
    try {
      const {
        customerEmail,
        customerName,
        otp,
        orderId
      } = data;

      if (!customerEmail || !customerName || !otp || !orderId) {
        throw new Error("Missing required fields");
      }

      if (!transporter) {
        throw new Error("Email configuration missing");
      }

      // Create email content
      const message = {
        from: `TiffinBox <${EMAIL_FROM}>`,
        to: customerEmail,
        subject: 'Your TiffinBox Delivery OTP',
        text: `Hello ${customerName},\n\nYour TiffinBox delivery is on the way! Please provide this OTP to the delivery partner when they arrive:\n\nOTP: ${otp}\n\nOrder ID: ${orderId}\n\nThank you for choosing TiffinBox!\n`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #d62828;">TiffinBox Delivery OTP</h2>
            <p>Hello ${customerName},</p>
            <p>Your TiffinBox delivery is on the way! Please provide this OTP to the delivery partner when they arrive:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h1 style="margin: 0; color: #d62828; font-size: 36px;">${otp}</h1>
              <p style="margin: 5px 0 0 0;"><strong>Order ID:</strong> ${orderId}</p>
            </div>
            
            <p>Thank you for choosing TiffinBox!</p>
            <p>Warm regards,<br>The TiffinBox Team</p>
          </div>
        `
      };

      // Send email and wait for the promise to resolve
      const result = await transporter.sendMail(message);
      console.log("OTP email sent successfully:", result);

      return { success: true };
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// Send delivery completion email
exports.sendDeliveryCompletionEmail = functions.https.onCall(
  async (data, context) => {
    try {
      const {
        customerEmail,
        customerName,
        trackingToken,
        otp,
        deliveryTime
      } = data;

      if (!customerEmail || !customerName || !trackingToken) {
        throw new Error("Missing required fields");
      }

      if (!transporter) {
        throw new Error("Email configuration missing");
      }

      // Create email content
      const message = {
        from: `TiffinBox <${EMAIL_FROM}>`,
        to: customerEmail,
        subject: 'Your TiffinBox Delivery is Complete!',
        text: `Hello ${customerName},\n\nYour TiffinBox delivery has been successfully completed!\n\nTracking Code: ${trackingToken}\nDelivery Time: ${deliveryTime || 'Just now'}\n\nWe hope you enjoy your meal. Thank you for choosing TiffinBox!\n`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #25d366;">TiffinBox Delivery Complete!</h2>
            <p>Hello ${customerName},</p>
            <p>Your TiffinBox delivery has been successfully completed!</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Tracking Code:</strong> ${trackingToken}</p>
              <p><strong>Delivery Time:</strong> ${deliveryTime || 'Just now'}</p>
              <p><strong>Verification OTP:</strong> ${otp}</p>
            </div>
            
            <p>We hope you enjoy your meal. Please let us know if you have any feedback!</p>
            <p>Thank you for choosing TiffinBox!</p>
            <p>Warm regards,<br>The TiffinBox Team</p>
          </div>
        `
      };

      // Send email and wait for the promise to resolve
      const result = await transporter.sendMail(message);
      console.log("Delivery completion email sent successfully:", result);

      return { success: true };
    } catch (error) {
      console.error("Error sending delivery completion email:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// Test email function
exports.testEmail = functions.https.onRequest(async (req, res) => {
  try {
    // Check if the origin is allowed
    const allowedOrigins = [
      "https://tiffinbox.co.uk",
      "https://www.tiffinbox.co.uk",
      "https://joyful-gnome-a3b9ae.netlify.app",
    ];

    const origin = req.headers.origin;

    // Set CORS headers based on the origin
    if (origin && allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.set("Access-Control-Allow-Credentials", "true");
    }

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (!transporter) {
      console.error("Email configuration missing. Cannot send email.");
      res.status(500).send("Email configuration missing");
      return;
    }

    // Create email content
    const message = {
      from: `TiffinBox <${EMAIL_FROM}>`,
      to: req.query.email || "test@example.com",
      subject: 'TiffinBox Email Test',
      text: `This is a test email from TiffinBox. If you're seeing this, email sending is working correctly!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #d62828;">TiffinBox Email Test</h2>
          <p>This is a test email from TiffinBox.</p>
          <p>If you're seeing this, email sending is working correctly!</p>
          <p>Email configuration:</p>
          <ul>
            <li>Host: ${EMAIL_HOST}</li>
            <li>User: ${EMAIL_USER}</li>
            <li>From: ${EMAIL_FROM}</li>
          </ul>
          <p>Warm regards,<br>The TiffinBox Team</p>
        </div>
      `
    };

    // Send email
    const result = await transporter.sendMail(message);
    console.log("Test email sent successfully:", result);

    res.status(200).send({
      success: true,
      message: "Test email sent successfully",
      emailInfo: {
        host: EMAIL_HOST,
        user: EMAIL_USER,
        from: EMAIL_FROM,
        to: req.query.email || "test@example.com"
      }
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).send({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});