import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript, mockRazorpayPayment } from "../utils/loadRazorpay";
import MockPaymentModal from "../components/MockPaymentModal";
import { DropOffIcon, PickUpIcon, ViewWaitIcon } from "../components/icons";
import BackButton from "../components/BackButton";

const DURATIONS = [
  { hours: 1, price: 50 },
  { hours: 2, price: 75 },
  { hours: 3, price: 100 },
];

const PURPOSES = [
  { value: "drop_off", label: "Drop-off", Icon: DropOffIcon },
  { value: "pick_up", label: "Pick-up", Icon: PickUpIcon },
  { value: "view_wait", label: "View / Wait", Icon: ViewWaitIcon },
];

const isDev = import.meta.env.VITE_ENVIRONMENT === "development";

export default function BookTicket() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("details");
  const [station, setStation] = useState(null);
  const [purpose, setPurpose] = useState("drop_off");
  const [duration, setDuration] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    apiClient
      .get(`/api/stations/${id}`)
      .then(({ data }) => setStation(data))
      .catch(() => setError("Station not found"));

    apiClient
      .get("/api/wallet/balance")
      .then(({ data }) => setWalletBalance(data.balance))
      .catch(() => setWalletBalance(null));
  }, [id, user, navigate]);

  const price = DURATIONS.find((d) => d.hours === duration).price;
  const total = price * quantity;
  const walletSufficient = walletBalance !== null && Number(walletBalance) >= total;
  const purposeLabel = PURPOSES.find((p) => p.value === purpose)?.label;

  const checkLocation = async (latitude, longitude) => {
    setCoords({ latitude, longitude });
    try {
      const { data } = await apiClient.post("/api/stations/verify-location", {
        station_id: id,
        latitude,
        longitude,
      });
      setLocationStatus(data);
    } catch (err) {
      setError("Failed to verify location");
      setLocationStatus(null);
    }
  };

  const handleVerifyLocation = () => {
    setError("");
    setLocationStatus("checking");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLocationStatus(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => checkLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access is blocked (by browser or system policy). Use the manual option below instead."
            : "Could not determine your location. Use the manual option below instead."
        );
        setLocationStatus(null);
      }
    );
  };

  const handleSimulateAwayFromStation = () => {
    setError("");
    setLocationStatus("checking");
    // Offset by ~0.005 degrees latitude (~550m) so the simulated position is
    // comfortably outside the required distance, without needing real GPS.
    checkLocation(station.latitude + 0.005, station.longitude);
  };

  const handleContinueToPayment = () => {
    if (!locationStatus?.verified) return;
    setError("");
    setStep("payment");
  };

  const completePayment = async (order, paymentResult) => {
    await apiClient.post("/api/bookings/verify-payment", {
      booking_id: order.booking_id,
      razorpay_order_id: paymentResult.razorpay_order_id,
      razorpay_payment_id: paymentResult.razorpay_payment_id,
      razorpay_signature: paymentResult.razorpay_signature,
    });
    navigate("/my-bookings");
  };

  const handleBooking = async () => {
    setError("");
    setBusy(true);
    try {
      const { data } = await apiClient.post("/api/bookings", {
        station_id: id,
        purpose,
        duration_hours: duration,
        quantity,
        latitude: coords.latitude,
        longitude: coords.longitude,
        payment_method: paymentMethod,
      });

      if (!data.razorpay) {
        // Paid instantly from wallet - booking is already active.
        navigate("/my-bookings");
        return;
      }

      const order = data.razorpay;

      if (isDev) {
        // Show an in-app mock checkout (card/UPI/netbanking) instead of
        // opening real Razorpay, since there's no real sandbox account.
        setPendingOrder(order);
        setBusy(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Failed to load payment gateway. Please try again.");
        setBusy(false);
        return;
      }
      const paymentResult = await new Promise((resolve, reject) => {
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: import.meta.env.VITE_APP_NAME,
          description: `Platform Ticket - ${station.name}`,
          order_id: order.order_id,
          handler: (response) => resolve(response),
          prefill: { name: user.full_name, email: user.email, contact: user.phone },
          theme: { color: "#0f766e" },
        };
        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", () => reject(new Error("Payment failed")));
        razorpay.open();
      });

      await completePayment(order, paymentResult);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Booking failed");
    } finally {
      setBusy(false);
    }
  };

  const handleMockPay = async () => {
    const order = pendingOrder;
    setBusy(true);
    try {
      await completePayment(order, mockRazorpayPayment(order.order_id));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Payment failed");
      setPendingOrder(null);
    } finally {
      setBusy(false);
    }
  };

  if (error && !station) return <p className="error">{error}</p>;
  if (!station) return <p>Loading...</p>;

  if (step === "payment") {
    return (
      <div className="event-detail">
        <button type="button" className="back-link" onClick={() => setStep("details")}>
          ← Back to details
        </button>

        <h2>Payment</h2>

        <div className="order-summary">
          <div className="order-summary-row">
            <span>Station</span>
            <strong>{station.name}</strong>
          </div>
          <div className="order-summary-row">
            <span>Purpose</span>
            <strong>{purposeLabel}</strong>
          </div>
          <div className="order-summary-row">
            <span>Duration</span>
            <strong>{duration} hr</strong>
          </div>
          <div className="order-summary-row">
            <span>Quantity</span>
            <strong>{quantity}</strong>
          </div>
          <div className="order-summary-row order-summary-total">
            <span>Total</span>
            <strong>₹{total}</strong>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.6rem" }}>Payment method</p>
          <div className="payment-method-list">
            <label className={`payment-method-option ${paymentMethod === "wallet" ? "selected" : ""} ${!walletSufficient ? "disabled" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="wallet"
                checked={paymentMethod === "wallet"}
                disabled={!walletSufficient}
                onChange={() => setPaymentMethod("wallet")}
              />
              <span className="payment-method-label">
                <strong>Platform Ticket Wallet</strong>
                <span className="event-meta">
                  {walletBalance === null
                    ? "Loading balance..."
                    : walletSufficient
                    ? `₹${walletBalance} available`
                    : `Insufficient balance (₹${walletBalance} available)`}
                </span>
              </span>
            </label>

            <label className={`payment-method-option ${paymentMethod === "razorpay" ? "selected" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="razorpay"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
              />
              <span className="payment-method-label">
                <strong>Credit/Debit Card, UPI, Net Banking</strong>
                <span className="event-meta">via Razorpay</span>
              </span>
            </label>
          </div>
        </div>

        <button type="button" className="btn" style={{ marginTop: "1.5rem" }} disabled={busy || !!pendingOrder} onClick={handleBooking}>
          {busy ? "Processing..." : `Pay ₹${total}`}
        </button>

        {isDev && <p className="event-meta" style={{ marginTop: "0.5rem" }}>Dev mode: payment is simulated, no real Razorpay charge.</p>}
        {error && <p className="error">{error}</p>}

        {pendingOrder && (
          <MockPaymentModal
            amount={total}
            onPay={handleMockPay}
            onCancel={() => setPendingOrder(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="event-detail">
      <BackButton fallback="/" />
      <h2>{station.name}</h2>
      <p className="event-meta">Station code: {station.code}</p>

      <div className="booking-form" style={{ flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
        <div>
          <p className="field-label">Purpose</p>
          <div className="choice-tiles">
            {PURPOSES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                className={`choice-tile ${purpose === value ? "selected" : ""}`}
                onClick={() => setPurpose(value)}
              >
                <Icon active={purpose === value} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="field-label">Duration</p>
          <div className="choice-tiles">
            {DURATIONS.map((d) => (
              <button
                key={d.hours}
                type="button"
                className={`choice-tile ${duration === d.hours ? "selected" : ""}`}
                onClick={() => setDuration(d.hours)}
              >
                <strong>{d.hours} hr</strong>
                <span>₹{d.price}</span>
              </button>
            ))}
          </div>
        </div>

        <label>
          Quantity (max 5)
          <input type="number" min="1" max="5" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </label>

        <p className="event-price">Total: ₹{total}</p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={handleVerifyLocation}>
            Verify Location
          </button>
          {isDev && (
            <button type="button" className="btn btn-secondary" onClick={handleSimulateAwayFromStation}>
              Simulate: I'm away from the station (dev)
            </button>
          )}
        </div>

        {locationStatus === "checking" && <p>Checking location...</p>}
        {locationStatus && locationStatus !== "checking" && (
          <p className={locationStatus.verified ? "status status-active" : "error"}>
            {locationStatus.verified
              ? `Location verified (${locationStatus.distance_meters}m away)`
              : `Too close: only ${locationStatus.distance_meters}m away. Move at least ${locationStatus.required_meters}m away to book.`}
          </p>
        )}

        <button
          type="button"
          className="btn"
          disabled={!locationStatus?.verified}
          onClick={handleContinueToPayment}
        >
          Continue to Payment
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
