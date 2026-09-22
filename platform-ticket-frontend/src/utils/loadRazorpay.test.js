import { describe, expect, it } from "vitest";
import { mockRazorpayPayment } from "./loadRazorpay";

describe("mockRazorpayPayment", () => {
  it("returns the order id it was given", () => {
    const result = mockRazorpayPayment("order_dev_abc123");
    expect(result.razorpay_order_id).toBe("order_dev_abc123");
  });

  it("generates a payment id prefixed with pay_dev_", () => {
    const result = mockRazorpayPayment("order_dev_abc123");
    expect(result.razorpay_payment_id).toMatch(/^pay_dev_[a-z0-9]+$/);
  });

  it("builds a signature matching the backend's dev-mode format", () => {
    // Must match app/services/payment_service.py: f"dev_signature_{order_id}_{payment_id}"
    const result = mockRazorpayPayment("order_dev_abc123");
    expect(result.razorpay_signature).toBe(
      `dev_signature_${result.razorpay_order_id}_${result.razorpay_payment_id}`
    );
  });

  it("generates a different payment id on each call", () => {
    const first = mockRazorpayPayment("order_dev_abc123");
    const second = mockRazorpayPayment("order_dev_abc123");
    expect(first.razorpay_payment_id).not.toBe(second.razorpay_payment_id);
  });
});
