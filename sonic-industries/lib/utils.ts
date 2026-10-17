import {
  RazorpayPaymentFailedResponse,
  RazorpayPaymentOrder,
  RazorpayPaymentResponse,
} from "@/types";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// CHANGE: added optional onSuccess callback (used to show the loading screen)
export const initiatePayment = (
  orderData: RazorpayPaymentOrder,
  onSuccess?: () => void
) => {
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: orderData.order.amount,
    currency: orderData.order.currency,
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
      emi: true,
    },
    name: "Sonic Industries",
    description: "Test Transaction",
    order_id: orderData.order.id,
    handler: async function (response: RazorpayPaymentResponse) {
      // CHANGE: show the loading screen as soon as Razorpay reports success
      onSuccess?.();

      try {
        const verifyRes = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/verify-payment`,
          {
            response,
          }
        );

        const data = verifyRes.data;

        if (data.success) {
          window.location.href = `/payment-success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`;
        } else {
          window.location.href = `/payment-failed`;
        }
      } catch (err) {
        console.error(err);
        window.location.href = `/payment-failed`;
      }
    },
    prefill: {
      name: `${orderData.customerData.firstName} ${orderData.customerData.lastName}`,
      email: orderData.customerData.email,
      contact: orderData.customerData.phone,
    },
    theme: {
      color: "#3399cc",
    },
  };

  const rzp = new window.Razorpay(options);

  rzp.on("payment.failed", function (response: RazorpayPaymentFailedResponse) {
    axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/mark-failed`,
      {
        orderId: orderData.order.id,
        reason: response.error.description,
      }
    );
    window.location.href = "/payment-failed";
  });

  rzp.open();
};