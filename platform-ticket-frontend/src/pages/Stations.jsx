import { useEffect, useState } from "react";
import apiClient from "../api/client";
import StationCard from "../components/StationCard";
import { HeroIllustration } from "../components/icons";

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient
      .get("/api/stations")
      .then(({ data }) => setStations(data))
      .catch(() => setError("Failed to load stations. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">Chennai Suburban Railway</span>
          <h1 className="hero-title">Skip the counter queue.<br />Book your platform ticket</h1>
          <p className="hero-subtitle">
            A short-duration entry pass for drop-off, pick-up, or waiting — bought online in
            under a minute, verified with GPS, and scanned as a QR code at the gate.
          </p>
          <div className="hero-stats">
            <div>
              <strong>{stations.length || 7}</strong>
              <span>Stations live</span>
            </div>
            <div>
              <strong>&lt;5 min</strong>
              <span>Avg. booking time</span>
            </div>
            <div>
              <strong>₹50</strong>
              <span>Starting price</span>
            </div>
          </div>
        </div>
        <HeroIllustration />
      </section>

      <h2 style={{ marginTop: "2.5rem" }}>Select a Station</h2>
      <p className="event-meta" style={{ marginBottom: "1.5rem" }}>
        Choose a station to book a short-duration platform entry pass.
      </p>

      {loading && <p>Loading stations...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="event-grid">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      )}
    </div>
  );
}
