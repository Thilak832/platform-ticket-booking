import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import StationCard from "../components/StationCard";
import { HeroIllustration } from "../components/icons";
import { distanceMeters, NEARBY_RADIUS_METERS } from "../utils/geo";

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [locating, setLocating] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [locateError, setLocateError] = useState("");

  useEffect(() => {
    apiClient
      .get("/api/stations")
      .then(({ data }) => setStations(data))
      .catch(() => setError("Failed to load stations. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  // Distance (in km) from the user to each station, once we have their GPS
  // coordinates. Falls back to manual browsing if location isn't available
  // or no station is within NEARBY_RADIUS_METERS (e.g. outside Chennai).
  const stationsWithDistance = useMemo(() => {
    if (!userCoords) return stations.map((s) => ({ ...s, distanceKm: null }));
    return stations
      .map((s) => ({
        ...s,
        distanceKm: distanceMeters(userCoords.latitude, userCoords.longitude, s.latitude, s.longitude) / 1000,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [stations, userCoords]);

  const nearestStation = userCoords && stationsWithDistance.length > 0 ? stationsWithDistance[0] : null;
  const nearestIsWithinRadius = nearestStation && nearestStation.distanceKm * 1000 <= NEARBY_RADIUS_METERS;

  const handleFindNearest = () => {
    setLocateError("");
    if (!navigator.geolocation) {
      setLocateError("Location isn't supported by your browser. Pick a station manually below.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was blocked. Pick a station manually below."
            : "Couldn't determine your location. Pick a station manually below."
        );
        setLocating(false);
      }
    );
  };

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
      <p className="event-meta" style={{ marginBottom: "1rem" }}>
        Choose a station to book a short-duration platform entry pass.
      </p>

      <div className="locate-station-bar">
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleFindNearest} disabled={locating}>
          {locating ? "Finding your location..." : "📍 Find station near me"}
        </button>
        {userCoords && nearestIsWithinRadius && (
          <span className="event-meta">
            Nearest: <strong>{nearestStation.name}</strong> ({nearestStation.distanceKm.toFixed(1)} km away)
          </span>
        )}
        {userCoords && !nearestIsWithinRadius && (
          <span className="event-meta">
            You don't appear to be near any of our {stations.length} live stations. Browse and book manually below.
          </span>
        )}
        {locateError && <span className="error">{locateError}</span>}
      </div>

      <p className="event-meta" style={{ marginBottom: "1.5rem" }}>
        No location? No problem — pick any station manually from the list below.
      </p>

      {loading && <p>Loading stations...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="event-grid">
          {stationsWithDistance.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              distanceKm={station.distanceKm}
              isNearest={nearestIsWithinRadius && station.id === nearestStation.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
