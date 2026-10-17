"use client";

import axios, { AxiosError } from "axios";
import { initiatePayment } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductBackend } from "@/types";
import { CustomerForm } from "./CustomerForm";
import { OrderSummary } from "./OrderSummary";
import { LoadingSpinner } from "./LoadingSpinner";
import CheckoutTimer from "./CheckoutTimer";
import { toast } from "sonner";
import { RazorpayModeDialog } from "./RazorpayModeDialog";

interface Address {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gstin?: string;
  shippingAddress: Address;
  billingAddress: Address;
}

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("token");
  const [product, setProduct] = useState<ProductBackend | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [razorPayMode, setRazorPayMode] = useState<"full" | "partial" | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [customer, setCustomer] = useState<CustomerData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gstin: "",
    shippingAddress: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
    billingAddress: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
  });
  const [sameAsShipping, setSameAsShipping] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    if (!sessionToken) return;

    const verifyToken = async () => {
      setIsLoading(true);
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/checkout/verify-token`,
          { sessionToken },
        );

        const productData = await res.data;
        setProduct(productData.product);
        toast.success(res.data.message);
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        console.error("Verification failed during session: ", error);

        if (error.response) {
          // Server responded with error (400, 401, 404, 500)
          toast.error(error.response.data.message || "Something went wrong");
        } else if (error.request) {
          // Request made but no response (network issue)
          toast.error("No response from server. Please check your connection.");
        } else {
          // Something else happened
          toast.error("Unexpected error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [sessionToken]);

  // Update billing if same as shipping
  useEffect(() => {
    if (sameAsShipping) {
      setCustomer((prev) => ({
        ...prev,
        billingAddress: { ...prev.shippingAddress },
      }));
    }
  }, [sameAsShipping, customer.shippingAddress]);

  if (!sessionToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded border">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Product Selected
          </h2>
          <p className="text-gray-600">
            Please select a product to proceed with checkout.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !product) {
    return <LoadingSpinner />;
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.min(10, Math.max(1, prev + delta)));
  };

  const isCustomerFormValid = () => {
    const c = customer;

    if (!c.firstName || !c.lastName || !c.email || !c.phone) return false;

    const s = c.shippingAddress;
    if (
      !s.firstName ||
      !s.lastName ||
      !s.address ||
      !s.city ||
      !s.state ||
      !s.postalCode ||
      !s.country
    )
      return false;

    const b = c.billingAddress;
    if (
      !b.firstName ||
      !b.lastName ||
      !b.address ||
      !b.city ||
      !b.state ||
      !b.postalCode ||
      !b.country
    )
      return false;

    return true;
  };

  const applyCoupon = async () => {
    if (coupon.trim()) {
      // CHANGE: the backend checks "already used" by email, so email is needed first
      if (!customer.email) {
        setMessage("Please enter your email before applying a coupon.");
        return;
      }

      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deals/validate`,
          {
            couponCode: coupon.trim(),
            productId: product._id,
            email: customer.email,
          },
        );
        const { valid, message, discount } = await res.data;

        if (!valid) {
          setMessage(message || "Invalid coupon code.");
          setDiscount(0);
          return;
        }
        // CHANGE: clear old error message on success
        setMessage("");
        setDiscount(discount);
      } catch (error) {
        console.error("Coupon validation failed:", error);
        toast.error("Coupon validation failed");
        setDiscount(0);
        setMessage("Something went wrong while validating the coupon.");
      }
    }
  };

  const handleCodCheckout = async () => {
    if (!isCustomerFormValid()) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (!otpSent) {
      toast.error("Please send OTP to your email");
      return;
    }

    if (!otpVerified) {
      toast.error("Please verify OTP before proceeding");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders`,
        {
          sessionToken,
          customer: {
            ...customer,
          },
          payment_method: "cod",
          quantity,
          // CHANGE: send the coupon code to the backend
          couponCode: discount > 0 ? coupon.trim() : undefined,
        },
      );
      const data = res.data;

      if (data.newOrder) {
        toast.success("Order placed successfully!");
        window.location.href = `/payment-success?cod_order_id=${data.newOrder.orderNumber}`;
      } else {
        window.location.href = `/payment-failed`;
      }
    } catch (error) {
      console.error("COD checkout failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Order failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    if (!isCustomerFormValid()) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (!otpSent) {
      toast.error("Please send OTP to your email");
      return;
    }

    if (!otpVerified) {
      toast.error("Please verify OTP before proceeding");
      return;
    }

    if (!isPartialPaymentAllowed) {
      setRazorPayMode("full");
      // CHANGE: pass "full" directly, because state updates are not instant
      confirmRazorpayPayment("full");
      return;
    }

    setRazorPayMode(null);
    setIsPaymentModalOpen(true);
  };

  // CHANGE: accepts an optional mode, falls back to the state value
  const confirmRazorpayPayment = async (modeOverride?: unknown) => {
    const mode =
      modeOverride === "full" || modeOverride === "partial"
        ? modeOverride
        : razorPayMode;
    if (!mode) return;

    setIsLoading(true);
    setIsPaymentModalOpen(false);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/create-order`,
        {
          sessionToken,
          customer: {
            ...customer,
          },
          payment_method: "razorpay",
          quantity,
          razorPayMode: mode,
          // CHANGE: send the coupon code to the backend (this fixes the main bug)
          couponCode: discount > 0 ? coupon.trim() : undefined,
        },
      );
      const { RazorpayOrder, customerData } = res.data;
      const paymentPayLoad = {
        order: RazorpayOrder,
        customerData: customerData,
      };
      initiatePayment(paymentPayLoad, () => setIsLoading(true));
    } catch (error) {
      console.error("Razorpay checkout failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Payment initialization failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = product.price * quantity;
  // CHANGE: rounded, to match the backend
  const gstPrice = Math.round(totalPrice * 0.18);
  const shippingFee = totalPrice + gstPrice < 10000 ? 1000 : 5000;
  const finalPrice = totalPrice + gstPrice + shippingFee - discount;
  const prepaidDiscount = Math.round(finalPrice * 0.02);

  const isPartialPaymentAllowed = finalPrice > shippingFee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6  tracking-wide border-b pb-2">
              CHECKOUT
            </h2>
          </div>

          <div>
            <CheckoutTimer token={sessionToken} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Side - Forms */}
          <div className="lg:col-span-2">
            <CustomerForm
              customer={customer}
              setCustomer={setCustomer}
              sameAsShipping={sameAsShipping}
              setSameAsShipping={setSameAsShipping}
              otpVerified={otpVerified}
              setOtpVerified={setOtpVerified}
              otpSent={otpSent}
              setOtpSent={setOtpSent}
              sessionToken={sessionToken}
            />
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <OrderSummary
                product={product}
                quantity={quantity}
                otpVerified={otpVerified}
                coupon={coupon}
                discount={discount}
                totalPrice={totalPrice}
                shippingFee={shippingFee}
                gstPrice={gstPrice}
                finalPrice={finalPrice}
                isLoading={isLoading}
                message={message}
                onQuantityChange={handleQuantityChange}
                // CHANGE: reset discount when the coupon text is edited
                onCouponChange={(value: string) => {
                  setCoupon(value);
                  setDiscount(0);
                  setMessage("");
                }}
                onApplyCoupon={applyCoupon}
                onCodCheckout={handleCodCheckout}
                onRazorpayCheckout={handleRazorpayCheckout}
              />
            </div>
          </div>
        </div>
      </div>

      <RazorpayModeDialog
        isPaymentDialogOpen={isPaymentModalOpen}
        setIsPaymentDialogOpen={setIsPaymentModalOpen}
        setPaymentMode={setRazorPayMode}
        finalPrice={finalPrice - prepaidDiscount}
        shippingFee={shippingFee}
        paymentMode={razorPayMode}
        isPartialPaymentAllowed={isPartialPaymentAllowed}
        confirmRazorpayPayment={confirmRazorpayPayment}
      />
    </div>
  );
}