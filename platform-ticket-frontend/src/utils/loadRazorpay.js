export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Local dev has no real Razorpay sandbox account, so the checkout widget can't
// open with a real key. This simulates a successful payment against the
// backend's matching dev-mode signature check (payment_service.py).
export function mockRazorpayPayment(orderId) {
  const paymentId = `pay_dev_${Math.random().toString(36).slice(2, 12)}`;
  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: `dev_signature_${orderId}_${paymentId}`,
  };
}
