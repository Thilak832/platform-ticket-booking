import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { EmptyTicketsIllustration } from "../components/icons";
import BackButton from "../components/BackButton";

const PURPOSE_LABELS = {
  drop_off: "Drop-off",
  pick_up: "Pick-up",
  view_wait: "View / Wait",
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = () => {
    Promise.all([apiClient.get("/api/bookings/me"), apiClient.get("/api/stations")])
      .then(([bookingsRes, stationsRes]) => {
        setBookings(bookingsRes.data);
        const map = {};
        stationsRes.data.forEach((s) => (map[s.id] = s.name));
        setStations(map);
      })
      .catch(() => setError("Failed to load bookings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    try {
      const { data } = await apiClient.post(`/api/bookings/${bookingId}/cancel`);
      alert(`Cancelled. Refund amount: ₹${data.refund_amount}`);
      loadBookings();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to cancel booking");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  if (bookings.length === 0) {
    return (
      <div className="empty-state">
        <BackButton fallback="/" style={{ alignSelf: "flex-start" }} />
        <EmptyTicketsIllustration />
        <h3>No tickets yet</h3>
        <p className="event-meta">Book a platform ticket and it'll show up here with a QR code.</p>
      </div>
    );
  }

  return (
    <div>
      <BackButton fallback="/" />
      <h2>My Tickets</h2>
      <div className="ticket-stub-list">
        {bookings.map((b) => (
          <div key={b.id} className="ticket-stub">
            <div className="ticket-stub-main">
              <div className="ticket-stub-header">
                <div>
                  <p className="ticket-station">{stations[b.station_id] || b.station_id}</p>
                  <p className="event-meta">{PURPOSE_LABELS[b.purpose] || b.purpose}</p>
                </div>
                <span className={`status status-${b.status}`}>{b.status}</span>
              </div>

              <div className="ticket-stub-grid">
                <div>
                  <span className="ticket-field-label">Duration</span>
                  <strong>{b.duration_hours} hr</strong>
                </div>
                <div>
                  <span className="ticket-field-label">Quantity</span>
                  <strong>{b.quantity}</strong>
                </div>
                <div>
                  <span className="ticket-field-label">Total</span>
                  <strong>₹{b.total_amount}</strong>
                </div>
                {b.valid_until && (
                  <div>
                    <span className="ticket-field-label">Valid until</span>
                    <strong>{new Date(b.valid_until).toLocaleString()}</strong>
                  </div>
                )}
              </div>

              <p className="ticket-code">#{b.ticket_code}</p>

              {b.refund_amount && <p className="event-meta">Refund issued: ₹{b.refund_amount}</p>}

              {b.status === "active" && (
                <button onClick={() => handleCancel(b.id)} className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }}>
                  Cancel Ticket
                </button>
              )}
            </div>

            <div className="ticket-stub-divider">
              <span className="ticket-stub-notch ticket-stub-notch-top" />
              <span className="ticket-stub-notch ticket-stub-notch-bottom" />
            </div>

            <div className="ticket-stub-qr">
              {b.status === "active" && b.qr_code ? (
                <img src={b.qr_code} alt="Ticket QR code" />
              ) : (
                <div className="ticket-stub-qr-placeholder">Not scannable</div>
              )}
              <span className="event-meta">Scan at gate</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
