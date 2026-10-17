import { Request, Response } from "express";
import { OrderModel } from "../models/orders.model";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { Product, ProductModel } from "../models/products.model";
import { handleSuccessfulOrderEmail } from "../config/MailActions";
import { isDealApplicable } from "../utils/couponCode";
import { sendMail } from "../config/mailer";
import { getOtpEmailTemplate } from "../config/Emails";
import { OTPStoreModel } from "../models/otpStore.model";
import argon2 from "argon2";

export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orders = await OrderModel.find().populate("order_items.productId");

    if (!orders || orders.length === 0) {
      res.status(404).json({
        message: "No orders found.",
        items: [],
      });
      return;
    }

    res.status(200).json({
      message: "Orders found successfully.",
      items: orders,
    });
  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).json({ message: "Error fetching orders", error });
  }
};

export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const CheckoutSecret = process.env.JWT_CHECKOUT_SECRET;
    if (!CheckoutSecret) {
      throw new Error("JWT_CHECKOUT_SECRET is not configured");
    }
    const newOrderRequest = req.body;

    if (
      !newOrderRequest.sessionToken ||
      !newOrderRequest.payment_method ||
      !newOrderRequest.customer
    ) {
      res.status(400).json({
        message: "Insufficient order details.",
      });
      return;
    }

    const decoded = jwt.verify(newOrderRequest.sessionToken, CheckoutSecret);
    if (!decoded) {
      res.status(401).json({
        message: "Session expired or invalid",
      });
      return;
    }

    const existingOrder = await OrderModel.findOne({
      sessionToken: newOrderRequest.sessionToken,
    });

    if (existingOrder) {
      res.status(400).json({
        message: "This checkout session has already been used.",
      });
      return;
    }

    // Optionally, you can still limit retries for pending/failed orders
    const existingPendingOrFailed = await OrderModel.countDocuments({
      sessionToken: newOrderRequest.sessionToken,
      payment_status: { $in: ["pending", "failed"] },
    });

    if (existingPendingOrFailed >= 2) {
      res.status(429).json({
        message: "Too many payment attempts for this session",
      });
      return;
    }

    const productInfo: Product | null = await ProductModel.findById(
      (decoded as { productId: string }).productId
    );

    if (!productInfo) {
      res.status(404).json({
        message: "Product associated with this session token not found.",
      });
      return;
    }

    // 🔁 Generate a unique order number: ORD-XXXXXXXXXX
    let orderNumber = "";
    let isUnique = false;

    while (!isUnique) {
      const suffix = uuidv4().replace(/-/g, "").slice(0, 10).toUpperCase();
      orderNumber = `ORD-${suffix}`;

      const existingOrder = await OrderModel.findOne({ orderNumber });
      if (!existingOrder) {
        isUnique = true;
      }
    }

    const total_price: number = productInfo.price * newOrderRequest.quantity;
    // CHANGE: rounded GST, to match the frontend and the Razorpay flow
    const gstPrice: number = Math.round(total_price * 0.18);
    const couponCode: string | null = newOrderRequest.couponCode || null;

    let shipping = total_price + gstPrice < 10000 ? 1000 : 5000;
    // CHANGE: also get dealId so we can save it on the order
    const { discount, dealId } = await isDealApplicable(
      couponCode,
      productInfo._id.toString(),
      newOrderRequest.customer.email
    );

    const finalPrice = total_price + gstPrice + shipping - discount;
    const postpaidCharge = finalPrice * 0.02;

    // Add orderNumber and userId to the new order request
    const orderToSave = {
      orderNumber,
      sessionToken: newOrderRequest.sessionToken,
      customer: {
        firstName: newOrderRequest.customer.firstName,
        lastName: newOrderRequest.customer.lastName,
        email: newOrderRequest.customer.email,
        phone: newOrderRequest.customer.phone,
        gstin: newOrderRequest.customer.gstin,
      },
      payment_method: "cod",
      online_paid_amount: 0,
      cod_amount: finalPrice,
      total_price: total_price + gstPrice,
      shipping_fee: shipping,
      postpaidCharges: postpaidCharge,
      discount: discount,
      // CHANGE: save which deal was used (needs a couponCode field in orders.model.ts)
      couponCode: dealId,
      final_price: finalPrice,
      shipping_address: { ...newOrderRequest.customer.shippingAddress },
      billing_address: { ...newOrderRequest.customer.billingAddress },
      order_items: {
        productId: productInfo._id,
        categoryId: productInfo.categoryId,
        quantity: newOrderRequest.quantity,
        price: productInfo.price,
        name: productInfo.name,
      },
    };

    const newOrder = await OrderModel.create(orderToSave);
    await handleSuccessfulOrderEmail(newOrder.orderNumber, true);

    res.status(200).json({
      message: "Order created successfully.",
      newOrder,
    });
  } catch (error) {
    console.error("Error creating orders:", error);
    res.status(500).json({ message: "Failed to create orders", error });
  }
};

export const updateOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const allowedUpdates = ["status", "payment_status"];
    const updates: Partial<Record<string, any>> = {};

    if (!orderId) {
      res.status(400).json({ message: "Order ID is required." });
      return;
    }

    const order = await OrderModel.findById(orderId);

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    // Filter only allowed fields
    for (const key of allowedUpdates) {
      if (req.body.hasOwnProperty(key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ message: "No valid fields to update." });
      return;
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("order_items.productId");

    res.status(200).json({
      message: "Order updated successfully.",
      updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      message: "Failed to update order.",
      error,
    });
  }
};

export const deleteOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        message: "Order ID is required.",
      });
      return;
    }

    const order = await OrderModel.findById(orderId);

    if (!order) {
      res.status(404).json({
        message: "Order not found.",
      });
      return;
    }

    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);

    res.status(200).json({
      message: "Order deleted successfully.",
      deletedOrder,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      message: "Failed to delete order.",
      error,
    });
  }
};

export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        message: "Order ID is required.",
      });
      return;
    }

    const order = await OrderModel.findById(orderId).populate(
      "order_items.productId"
    );

    if (!order) {
      res.status(404).json({
        message: "Order not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Order fetched successfully.",
      order,
    });
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    res.status(500).json({
      message: "Failed to fetch order.",
      error,
    });
  }
};

export const sendOTPEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, sessionId } = req.body;

    if (!email || !sessionId) {
      res.status(400).json({ message: "Email and Session ID are required" });
      return;
    }

    const existing = await OTPStoreModel.findOne({ sessionId }).select(
      "createdAt"
    );

    if (existing && Date.now() - existing.createdAt.getTime() < 30_000) {
      res.status(429).json({
        message: "Please wait 30 seconds before requesting a new OTP",
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await argon2.hash(otp, {
      type: argon2.argon2id,
      memoryCost: 2 ** 14, // lower
      timeCost: 2,
      parallelism: 1,
    });

    await OTPStoreModel.updateOne(
      { sessionId },
      {
        $set: {
          email,
          otp: hashedOtp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
        },
      },
      { upsert: true }
    );

    sendMail({
      to: email,
      subject: "Your OTP Verification Code - Sonic Industries",
      html: getOtpEmailTemplate(otp),
    }).catch((err) => {
      console.error("OTP email failed:", err);
    });

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    res.status(500).json({
      message: "Failed to send OTP email",
      error,
    });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, otp } = req.body;

    if (!sessionId || !otp) {
      res.status(400).json({ message: "Session ID and OTP are required" });
      return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      res.status(400).json({ message: "Invalid OTP format" });
      return;
    }

    const record = await OTPStoreModel.findOne({ sessionId });

    if (!record) {
      res.status(400).json({ message: "OTP not found or expired" });
      return;
    }

    if (record.expiresAt < new Date()) {
      await OTPStoreModel.deleteOne({ sessionId });
      res.status(400).json({ message: "OTP expired" });
      return;
    }

    if (record.attempts >= 5) {
      await OTPStoreModel.deleteOne({ sessionId });
      res.status(429).json({ message: "Maximum OTP attempts exceeded" });
      return;
    }

    const isValid = await argon2.verify(record.otp, otp);
    if (!isValid) {
      // Increment attempts on failure
      record.attempts += 1;
      await record.save();
      res.status(400).json({ message: "Incorrect OTP" });
      return;
    }

    await OTPStoreModel.deleteOne({ sessionId });
    res.status(200).json({ message: "OTP verified successfully" });
    return;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
    return;
  }
};