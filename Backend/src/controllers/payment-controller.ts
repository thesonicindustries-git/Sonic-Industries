import { Request, Response } from "express";
import { razorpayInstance } from "../config/razorpay";
import { Product, ProductModel } from "../models/products.model";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Order, OrderModel } from "../models/orders.model";
import { handleSuccessfulOrderEmail } from "../config/MailActions";
import { isDealApplicable } from "../utils/couponCode";
import { generateInvoicePdf } from "../config/invoicePdf";
import { pickWeightedReward } from "../utils/rewardPicker";
import { sendMail } from "../config/mailer";
import {
  getCustomerRewardsEmailTemplate,
  getAdminRewardsEmailTemplate,
} from "../config/Emails";

const CheckoutSecret = process.env.JWT_CHECKOUT_SECRET!;

export const createRazorPayOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
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

    if (!["full", "partial"].includes(newOrderRequest.razorPayMode)) {
      res.status(400).json({ message: "Invalid payment mode" });
      return;
    }

    const decoded = jwt.verify(newOrderRequest.sessionToken, CheckoutSecret);
    if (!decoded) {
      res.status(401).json({
        message: "Session expired or invalid",
      });
      return;
    }

    const existingPaidOrder = await OrderModel.findOne({
      sessionToken: newOrderRequest.sessionToken,
      payment_status: { $in: ["paid", "partial"] }, // already paid
    });

    if (existingPaidOrder) {
      res.status(400).json({
        message:
          "This checkout session has already been used for a successful payment.",
      });
      return;
    }

    // Optionally, you can still limit retries for pending/failed orders
    const existingPendingOrFailed = await OrderModel.countDocuments({
      sessionToken: newOrderRequest.sessionToken,
      payment_status: { $in: ["pending", "failed"] },
    });

    if (existingPendingOrFailed >= 5) {
      res.status(429).json({
        message: "Too many payment attempts for this session",
      });
      return;
    }

    // fetch product securely from DB
    const product: Product | null = await ProductModel.findById(
      (decoded as { productId: string }).productId,
    );

    if (!product) {
      res.status(404).json({
        message: "Product not found",
      });
      return;
    }

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

    const subtotal: number = product.price * newOrderRequest.quantity;
    const gst: number = Math.round(subtotal * 0.18);
    let shipping = subtotal + gst < 10000 ? 1000 : 5000;

    const couponCode: string = newOrderRequest.couponCode || null;
    const { discount } = await isDealApplicable(
      couponCode,
      product._id.toString(),
      newOrderRequest.customer.email,
    );
    const priceAfterCoupon: number = subtotal + gst + shipping - discount;

    const prepaidDiscount = Math.round(priceAfterCoupon * 0.02);
    const finalPayable = Math.round(priceAfterCoupon - prepaidDiscount);

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
      payment_method:
        newOrderRequest.razorPayMode === "full"
          ? "razorpay_full"
          : "razorpay_partial",
      online_paid_amount:
        newOrderRequest.razorPayMode === "full" ? finalPayable : shipping,
      cod_amount:
        newOrderRequest.razorPayMode === "full" ? 0 : finalPayable - shipping,
      total_price: subtotal + gst,
      shipping_fee: shipping,
      discount: discount,
      prepaidDiscount: prepaidDiscount,
      final_price: finalPayable,
      shipping_address: { ...newOrderRequest.customer.shippingAddress },
      billing_address: { ...newOrderRequest.customer.billingAddress },
      order_items: {
        productId: product._id,
        categoryId: product.categoryId,
        quantity: newOrderRequest.quantity,
        price: product.price,
        name: product.name,
      },
    };

    const razorpayAmount =
      newOrderRequest.razorPayMode === "full" ? finalPayable : shipping;

    const RazorpayOrder = await razorpayInstance.orders.create({
      amount: razorpayAmount * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: true,
      notes: {
        productId: (decoded as { productId: string }).productId,
        payment_mode: newOrderRequest.razorPayMode,
      },
    });

    const newOrder = await OrderModel.create({
      ...orderToSave,
      razorpay: {
        razorpay_order_id: RazorpayOrder.id,
      },
    });

    res.status(200).json({
      message: "Order created successfully in razorpay and db.",
      newOrder,
      RazorpayOrder,
      customerData: newOrderRequest.customer,
    });
  } catch (error) {
    console.error("Error creating orders:", error);
    res.status(500).json({ message: "Failed to create orders", error });
  }
};

export const verifyPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { response } = req.body;
    if (
      !response.razorpay_order_id ||
      !response.razorpay_payment_id ||
      !response.razorpay_signature
    ) {
      res.status(400).json({
        message: "Invalid payment details",
      });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET as string;
    const sign =
      response.razorpay_order_id + "|" + response.razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(sign.toString())
      .digest("hex");

    if (expectedSignature !== response.razorpay_signature) {
      res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
      return;
    }

    const order = await OrderModel.findOne({
      "razorpay.razorpay_order_id": response.razorpay_order_id,
    });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    await OrderModel.updateOne(
      {
        "razorpay.razorpay_order_id": response.razorpay_order_id,
      },
      {
        $set: {
          payment_status:
            order.payment_method === "razorpay_full" ? "paid" : "partial",
          "razorpay.razorpay_payment_id": response.razorpay_payment_id,
          "razorpay.paidAt": new Date().toISOString(),
          spinEligible: true,
        },
      },
    );

    await handleSuccessfulOrderEmail(response.razorpay_payment_id);
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error,
    });
  }
};

export const createCheckoutSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { productId } = req.body;

    const product = await ProductModel.findById(productId);
    if (!product) {
      res.status(404).json({
        message: "Product not found. Wrong details provided",
      });
      return;
    }

    const nonce = crypto.randomBytes(8).toString("hex");
    const checkoutSessionToken = jwt.sign(
      {
        productId,
        nonce,
      },
      CheckoutSecret,
      { expiresIn: "15m" },
    );

    res.status(200).json({
      message: "Success",
      checkoutSessionToken,
    });
  } catch (error) {
    console.error("Error creating checkout: ", error);
    res.status(500).json({
      message: "Failed to create checkout session",
      error,
    });
  }
};

export const verifyCheckoutSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { sessionToken } = req.body;

    const decoded = jwt.verify(sessionToken, CheckoutSecret) as {
      productId: string;
      nonce: string;
    };

    const product = await ProductModel.findById(decoded.productId).lean();
    if (!product) {
      res.status(404).json({
        message: "Product not found. Invalid session token",
      });
      return;
    }

    res.status(200).json({
      message: "Token verified successfully",
      product,
    });
  } catch (error) {
    console.error("Error verifying session: ", error);
    res.status(500).json({
      message: "Failed to verify session token",
      error,
    });
  }
};

export const markPaymentFailed = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId, reason } = req.body;
    await OrderModel.updateOne(
      {
        "razorpay.razorpay_order_id": orderId,
      },
      {
        $set: {
          payment_status: "failed",
          status: "cancelled",
        },
      },
    );
    res.status(200).json({
      message: reason,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
    });
  }
};

export const razorpayWebhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const signature = req.headers["x-razorpay-signature"] as string;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      res.status(400).json({ message: "Invalid signature" });
      return;
    }

    const event = req.body.event;
    const payment = req.body.payload.payment.entity;

    const order = await OrderModel.findOne({
      "razorpay.razorpay_order_id": payment.order_id,
    });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    if (event === "payment.captured") {
      order.payment_status =
        order.payment_method === "razorpay_full" ? "paid" : "partial";

      order.razorpay!.razorpay_payment_id = payment.id;
      order.razorpay!.paidAt = new Date();
      order.spinEligible = true;

      await order.save();

      await handleSuccessfulOrderEmail(order.orderNumber);
    }

    if (event === "payment.failed") {
      order.payment_status = "failed";
      order.status = "cancelled";
      await order.save();
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

export const spinReward = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { razorpayOrderId } = req.body;

    if (!razorpayOrderId) {
      res.status(400).json({
        message: "Order ID is required",
      });
      return;
    }

    const order = await OrderModel.findOne({
      "razorpay.razorpay_order_id": razorpayOrderId,
    });

    if (!order) {
      res.status(404).json({
        message: "Order not found",
      });
      return;
    }

    if (
      !order.payment_method.startsWith("razorpay") ||
      !["paid", "partial"].includes(order.payment_status) ||
      !order.spinEligible
    ) {
      res.status(403).json({
        message: "Payment not completed for this order",
      });
      return;
    }

    if (order.reward?.name) {
      res.status(200).json({
        message: "Reward already assigned for this order",
        reward: order.reward.name,
      });
      return;
    }

    const reward = pickWeightedReward();
    order.reward = {
      name: reward,
      spunAt: new Date(),
    };
    await order.save();

    await sendMail({
      to: process.env.ADMIN_EMAILS?.split(",") as string[],
      subject: `New Reward Assigned - Order ${order.orderNumber} for ${order.customer?.firstName} ${order.customer?.lastName}`,
      html: getAdminRewardsEmailTemplate(order),
    });

    setTimeout(async () => {
      await sendMail({
        to: order.customer?.email as string,
        subject: "Congratulations! You've Won a Reward!",
        html: getCustomerRewardsEmailTemplate(order),
      });
    });
    res.status(200).json({
      reward,
      messaege: "Reward assigned successfully",
      alreadySpun: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Spin failed" });
  }
};

export const generateReceipt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400).json({
        message: "Order ID is required",
      });
      return;
    }

    const order: Order | null = await OrderModel.findOne({
      $or: [
        { "razorpay.razorpay_order_id": identifier },
        { orderNumber: identifier },
      ],
    }).populate("order_items.productId order_items.categoryId");

    if (!order) {
      res.status(404).json({
        message: "Order not found",
      });
      return;
    }
    const pdfDoc = await generateInvoicePdf(order);

    const chunks: Buffer[] = [];
    pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));

    pdfDoc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

      res.send(pdfBuffer);
    });

    pdfDoc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Invoice Generation failed" });
  }
};
