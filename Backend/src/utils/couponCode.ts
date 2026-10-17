import { DealModel } from "../models/deals.model";
import { OrderModel } from "../models/orders.model";
import { Product, ProductModel } from "../models/products.model";

export const isDealApplicable = async (
  couponCode: string | null,
  productId: string,
  email: string,
) => {
  try {
    // CHANGE: if no coupon is sent, do nothing (otherwise findOne({couponCode: null})
    // could match a random deal that has no code)
    if (!couponCode || !couponCode.trim()) {
      return {
        valid: false,
        message: "No coupon provided",
        discount: 0,
        dealId: null,
      };
    }

    // 1️⃣ Find the deal by coupon code
    const deal = await DealModel.findOne({ couponCode: couponCode.trim() });
    if (!deal) {
      return {
        valid: false,
        message: "Invalid coupon code",
        discount: 0,
        dealId: null,
      };
    }

    // For product-specific deals, ensure product matches
    if (deal.dealType === "product" && deal.productName) {
      const product: Product | null = await ProductModel.findById(productId);
      if (product && product.name !== deal.productName) {
        return {
          valid: false,
          message: `This coupon is only valid for ${deal.productName}.`,
          discount: 0,
          dealId: null,
        };
      }
    }

    // 2️⃣ Check expiration
    if (new Date(deal.expiresAt) < new Date()) {
      return {
        valid: false,
        message: "This deal has expired",
        discount: 0,
        dealId: null,
      };
    }

    // 3️⃣ Handle general vs product deals
    // CHANGE: failed / cancelled orders do not use up the coupon
    let prevOrder;

    if (deal.dealType === "general") {
      // User can only use this coupon once — on any product
      prevOrder = await OrderModel.findOne({
        "customer.email": email,
        couponCode: deal._id,
        status: { $ne: "cancelled" },
        $or: [
          { payment_status: { $in: ["paid", "partial"] } },
          { payment_method: "cod" },
        ],
      });
    } else if (deal.dealType === "product") {
      // Only for the specific product
      prevOrder = await OrderModel.findOne({
        "customer.email": email,
        couponCode: deal._id,
        "order_items.productId": productId,
        status: { $ne: "cancelled" },
        $or: [
          { payment_status: { $in: ["paid", "partial"] } },
          { payment_method: "cod" },
        ],
      });
    }

    // 4️⃣ If the user already used it
    if (prevOrder) {
      return {
        valid: false,
        message:
          deal.dealType === "general"
            ? "You have already availed this general offer."
            : "You have already availed this offer for this product.",
        discount: 0,
        dealId: null,
      };
    }

    // 5️⃣ All good → apply discount
    let discount = 0;

    if (deal.dealType === "product") {
      // discountedPrice = final product price
      discount = (deal.mrp ?? 0) - (deal.discountedPrice ?? 0);
    }

    if (deal.dealType === "general") {
      // discountedPrice = discount amount
      discount = deal.discountedPrice ?? 0;
    }

    // Safety guard
    discount = Math.max(discount, 0);

    return {
      valid: true,
      message: "Coupon code applied successfully.",
      discount,
      // CHANGE: return deal id so the order can store it
      dealId: deal._id,
    };
  } catch (err) {
    console.error("Error validating deal:", err);
    return {
      valid: false,
      message: "An error occurred while validating the coupon.",
      discount: 0,
      dealId: null,
    };
  }
};