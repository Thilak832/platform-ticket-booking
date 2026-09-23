import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { loadRazorpayScript, mockRazorpayPayment } from "../utils/loadRazorpay";
import MockPaymentModal from "../components/MockPaymentModal";
import { WalletChipIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";

const isDev = import.meta.env.VITE_ENVIRONMENT === "development";
const PRESET_AMOUNTS = [100, 200, 500, 1000];

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState(200);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  const load = () => {
    Promise.all([apiClient.get("/api/wallet/balance"), apiClient.get("/api/wallet/transactions")])
      .then(([balRes, txnRes]) => {
        setBalance(balRes.data.balance);
        setTransactions(txnRes.data);
      })
      .catch(() => setError("Failed to load wallet"));
  };

  useEffect(() => {
    load();
  }, []);

  const completeTopup = async (paymentResult) => {
    await apiClient.post("/api/wallet/topup/verify", {
      razorpay_order_id: paymentResult.razorpay_order_id,
      razorpay_payment_id: paymentResult.razorpay_payment_id,
      razorpay_signature: paymentResult.razorpay_signature,
    });
    load();
  };

  const handleAddMoney = async () => {
    setError("");
    setBusy(true);
    try {
      const { data: order } = await apiClient.post("/api/wallet/topup", { amount });

      if (isDev) {
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
          description: "Wallet top-up",
          order_id: order.order_id,
          handler: (response) => resolve(response),
          theme: { color: "#0f766e" },
        };
        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", () => reject(new Error("Payment failed")));
        razorpay.open();
      });

      await completeTopup(paymentResult);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Top-up failed");
    } finally {
      setBusy(false);
    }
  };

  const handleMockPay = async () => {
    setBusy(true);
    try {
      await completeTopup(mockRazorpayPayment(pendingOrder.order_id));
      setPendingOrder(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Top-up failed");
      setPendingOrder(null);
    } finally {
      setBusy(false);
    }
  };

  if (balance === null && !error) return <p>Loading...</p>;

  return (
    <div>
      <h2>My Wallet</h2>
      {error && <p className="error">{error}</p>}

      <div className="wallet-card">
        <div className="wallet-card-top">
          <WalletChipIcon />
          <span className="wallet-card-brand">Platform Ticket</span>
        </div>
        <p className="wallet-card-number">•••• •••• •••• {user.id.slice(0, 4).toUpperCase()}</p>
        <div className="wallet-card-bottom">
          <div>
            <span className="wallet-card-label">Available balance</span>
            <p className="wallet-balance-amount">₹{balance}</p>
          </div>
          <div>
            <span className="wallet-card-label">Card holder</span>
            <p className="wallet-card-holder">{user.full_name}</p>
          </div>
        </div>
      </div>

      <div className="event-detail" style={{ marginTop: "1.5rem", maxWidth: 480 }}>
        <h3>Add Money</h3>
        <div className="preset-amounts">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              className={`btn btn-secondary btn-sm ${amount === a ? "preset-active" : ""}`}
              onClick={() => setAmount(a)}
            >
              ₹{a}
            </button>
          ))}
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.75rem", fontSize: "0.85rem", fontWeight: 600 }}>
          Amount
          <input
            type="number"
            min="1"
            max="50000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
        <button type="button" className="btn" style={{ marginTop: "1rem" }} disabled={busy || amount <= 0 || !!pendingOrder} onClick={handleAddMoney}>
          {busy ? "Processing..." : `Add ₹${amount}`}
        </button>
        {isDev && <p className="event-meta" style={{ marginTop: "0.5rem" }}>Dev mode: payment is simulated, no real Razorpay charge.</p>}
      </div>

      {pendingOrder && (
        <MockPaymentModal
          amount={amount}
          onPay={handleMockPay}
          onCancel={() => setPendingOrder(null)}
        />
      )}

      <h3 className="section-title">Transaction History</h3>
      <div className="bookings-list">
        {transactions.length === 0 && <p className="event-meta">No transactions yet.</p>}
        {transactions.map((t) => (
          <div key={t.id} className="booking-card">
            <p>
              <strong>{t.type.replace(/_/g, " ")}</strong>{" "}
              <span className={Number(t.amount) >= 0 ? "status status-active" : "status status-cancelled"}>
                {Number(t.amount) >= 0 ? "+" : ""}₹{t.amount}
              </span>
            </p>
            <p className="event-meta">Balance after: ₹{t.balance_after} &middot; {new Date(t.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
