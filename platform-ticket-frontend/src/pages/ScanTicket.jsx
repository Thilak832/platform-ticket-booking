import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";

const SCANNER_ELEMENT_ID = "qr-scanner-viewport";

// The QR payload is "PT:{booking_id}:{ticket_code}" (see app/services/qr_service.py
// and app/routers/bookings.py's create_booking, which build it that way).
function extractBookingId(qrText) {
  const parts = qrText.split(":");
  if (parts.length >= 2 && parts[0] === "PT") return parts[1];
  return null;
}

export default function ScanTicket() {
  const { user } = useAuth();
  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScanSuccess = async (qrText) => {
    // Guard against the camera firing this callback repeatedly for the same
    // QR code while it's still in frame (html5-qrcode scans continuously).
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);

    if (scannerRef.current) {
      await scannerRef.current.pause(true).catch(() => {});
    }

    const bookingId = extractBookingId(qrText);
    if (!bookingId) {
      setResult({ valid: false, message: "Not a recognised platform ticket QR code" });
      setBusy(false);
      return;
    }

    try {
      const { data } = await apiClient.post(`/api/bookings/${bookingId}/scan`);
      setResult(data);
    } catch (err) {
      setResult({ valid: false, message: err.response?.data?.detail || "Failed to verify ticket" });
    } finally {
      setBusy(false);
    }
  };

  const startScanning = async () => {
    setError("");
    setResult(null);
    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScanSuccess(decodedText),
        () => {} // ignore per-frame "no QR found" noise
      );
      setScanning(true);
    } catch (err) {
      setError("Couldn't access the camera. Check browser camera permissions and try again.");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
    setResult(null);
  };

  const scanNext = async () => {
    setResult(null);
    busyRef.current = false;
    if (scannerRef.current) {
      await scannerRef.current.resume();
    }
  };

  if (user?.role !== "admin") return <p className="error">Admin access required</p>;

  return (
    <div>
      <BackButton fallback="/admin" />
      <h2>Scan Ticket</h2>
      <p className="event-meta" style={{ marginBottom: "1.5rem" }}>
        Point the camera at a passenger's ticket QR code to verify and mark it used.
      </p>

      <div className="event-detail" style={{ maxWidth: 480 }}>
        <div
          id={SCANNER_ELEMENT_ID}
          style={{ width: "100%", display: scanning ? "block" : "none" }}
        />

        {!scanning && (
          <button type="button" className="btn" onClick={startScanning}>
            Start Camera
          </button>
        )}
        {scanning && !result && (
          <button type="button" className="btn btn-secondary" style={{ marginTop: "1rem" }} onClick={stopScanning}>
            Stop Camera
          </button>
        )}

        {busy && <p className="event-meta" style={{ marginTop: "0.75rem" }}>Verifying ticket...</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {result && (
        <div className={`scan-result-card ${result.valid ? "scan-result-valid" : "scan-result-invalid"}`}>
          <div className="scan-result-status">
            <span className="scan-result-icon">{result.valid ? "✓" : "✕"}</span>
            <div>
              <strong>{result.valid ? "Entry Granted" : "Entry Denied"}</strong>
              <p>{result.message}</p>
            </div>
          </div>

          {(result.passenger_name || result.station_name) && (
            <div className="scan-result-details">
              {result.passenger_name && (
                <div>
                  <span className="ticket-field-label">Passenger</span>
                  <strong>{result.passenger_name}</strong>
                  <p className="event-meta">{result.passenger_email}</p>
                </div>
              )}
              {result.station_name && (
                <div>
                  <span className="ticket-field-label">Station</span>
                  <strong>{result.station_name}</strong>
                  <p className="event-meta">{result.station_code}</p>
                </div>
              )}
              {result.booking && (
                <>
                  <div>
                    <span className="ticket-field-label">Purpose</span>
                    <strong>{result.booking.purpose.replace(/_/g, " ")}</strong>
                  </div>
                  <div>
                    <span className="ticket-field-label">Duration / Quantity</span>
                    <strong>{result.booking.duration_hours} hr &middot; {result.booking.quantity}</strong>
                  </div>
                  <div>
                    <span className="ticket-field-label">Ticket status</span>
                    <strong>{result.booking.status}</strong>
                  </div>
                  {result.booking.valid_until && (
                    <div>
                      <span className="ticket-field-label">Valid until</span>
                      <strong>{new Date(result.booking.valid_until).toLocaleString()}</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button type="button" className="btn" onClick={scanNext}>
              Scan Next Ticket
            </button>
            <button type="button" className="btn btn-secondary" onClick={stopScanning}>
              Stop Camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
