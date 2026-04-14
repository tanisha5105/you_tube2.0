import Razorpay from "razorpay";
import crypto from "crypto";
import users from "../Modals/Auth.js";
import nodemailer from "nodemailer";

const PLAN_PRICES = {
  bronze: 1000,  // ₹10 in paise
  silver: 5000,  // ₹50 in paise
  gold: 10000,   // ₹100 in paise
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export const createOrder = async (req, res) => {
  const { plan, userId } = req.body;
  const amount = PLAN_PRICES[plan];
  if (!amount) return res.status(400).json({ message: "Invalid plan" });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
    });
    return res.status(200).json({ orderId: order.id, amount, currency: "INR" });
  } catch (error) {
    console.error("Razorpay error:", error);
    return res.status(500).json({ message: "Payment initiation failed" });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  try {
    const user = await users.findByIdAndUpdate(userId, { $set: { plan } }, { new: true });

    // Send invoice email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const planLabels = { bronze: "Bronze - ₹10", silver: "Silver - ₹50", gold: "Gold - ₹100" };
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "YourTube - Plan Upgrade Invoice",
      html: `
        <h2>Payment Successful!</h2>
        <p>Hi ${user.name},</p>
        <p>Your plan has been upgraded to <strong>${planLabels[plan]}</strong>.</p>
        <hr/>
        <h3>Invoice</h3>
        <p>Order ID: ${razorpay_order_id}</p>
        <p>Payment ID: ${razorpay_payment_id}</p>
        <p>Plan: ${planLabels[plan]}</p>
        <p>Date: ${new Date().toLocaleString("en-IN")}</p>
        <hr/>
        <p>Thank you for upgrading!</p>
      `,
    });

    return res.status(200).json({ success: true, plan: user.plan });
  } catch (error) {
    console.error("Verify error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
