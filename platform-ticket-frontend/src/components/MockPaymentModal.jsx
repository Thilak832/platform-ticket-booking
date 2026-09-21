import { useState } from "react";

const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank"];

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  angle: (360 / 14) * i,
  delay: (i % 5) * 0.04,
  color: ["#0f766e", "#f59e0b", "#059669", "#0891b2", "#ec4899"][i % 5],
}));

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function MockPaymentModal({ amount, onPay, onCancel }) {
  const [tab, setTab] = useState("card");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [phase, setPhase] = useState("form");

  const isCardValid = card.number.replace(/\s/g, "").length >= 12 && card.name.trim().length > 1 && card.expiry.length === 5 && card.cvv.length >= 3;
  const isUpiValid = /^[\w.-]+@[\w.-]+$/.test(upiId);
  const canPay = tab === "card" ? isCardValid : tab === "upi" ? isUpiValid : true;

  const handlePay = () => {
    setPhase("processing");
    setTimeout(() => {
      setPhase("success");
      setTimeout(() => onPay(), 1700);
    }, 750);
  };

  if (phase === "success") {
    return (
      <div className="modal-overlay">
        <div className="modal-card payment-success-card">
          <div className="payment-success-burst">
            {CONFETTI.map((c) => (
              <span
                key={c.id}
                className="payment-confetti"
                style={{
                  "--angle": `${c.angle}deg`,
                  "--delay": `${c.delay}s`,
                  background: c.color,
                }}
              />
            ))}
            <svg className="payment-check" width="88" height="88" viewBox="0 0 88 88" fill="none">
              <circle className="payment-check-ring" cx="44" cy="44" r="40" stroke="var(--success)" strokeWidth="4" />
              <path className="payment-check-mark" d="M28 45l11 11 21-23" stroke="var(--success)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <h3 className="payment-success-title">Payment Successful</h3>
          <p className="payment-success-amount">₹{amount}</p>
          <p className="event-meta">Confirming your ticket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Secure Payment</span>
          <button type="button" className="modal-close" onClick={onCancel}>&times;</button>
        </div>

        <p className="modal-amount">₹{amount}</p>

        <div className="modal-tabs">
          <button type="button" className={tab === "card" ? "active" : ""} onClick={() => setTab("card")}>Card</button>
          <button type="button" className={tab === "upi" ? "active" : ""} onClick={() => setTab("upi")}>UPI</button>
          <button type="button" className={tab === "netbanking" ? "active" : ""} onClick={() => setTab("netbanking")}>Net Banking</button>
        </div>

        {tab === "card" && (
          <div className="modal-form">
            <label>
              Card Number
              <input
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
              />
            </label>
            <label>
              Name on Card
              <input
                placeholder="John Doe"
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
              />
            </label>
            <div className="modal-form-row">
              <label>
                Expiry
                <input
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                />
              </label>
              <label>
                CVV
                <input
                  placeholder="123"
                  maxLength={4}
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") })}
                />
              </label>
            </div>
          </div>
        )}

        {tab === "upi" && (
          <div className="modal-form">
            <div className="upi-app-row">
              <span className="upi-app-badge">Google Pay</span>
              <span className="upi-app-badge">PhonePe</span>
              <span className="upi-app-badge">Paytm</span>
            </div>
            <label>
              UPI ID
              <input
                placeholder="yourname@okbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </label>
          </div>
        )}

        {tab === "netbanking" && (
          <div className="modal-form">
            <label>
              Select Bank
              <select value={bank} onChange={(e) => setBank(e.target.value)}>
                {BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <button type="button" className="btn" style={{ width: "100%", marginTop: "1.25rem" }} disabled={!canPay || phase === "processing"} onClick={handlePay}>
          {phase === "processing" ? <span className="btn-spinner" /> : `Pay ₹${amount}`}
        </button>
        <p className="event-meta" style={{ textAlign: "center", marginTop: "0.5rem" }}>
          Simulated payment — no real charge (dev mode)
        </p>
      </div>
    </div>
  );
}
