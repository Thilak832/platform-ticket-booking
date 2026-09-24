import { Link } from "react-router-dom";
import { StationIcon } from "./icons";

export default function StationCard({ station, distanceKm, isNearest }) {
  return (
    <div className={`event-card station-card ${isNearest ? "station-card-nearest" : ""}`}>
      {isNearest && <span className="station-nearest-badge">Nearest to you</span>}
      <StationIcon />
      <h3 className="station-name">{station.name}</h3>
      <p className="event-meta">
        Station code: {station.code}
        {distanceKm != null && ` · ${distanceKm.toFixed(1)} km away`}
      </p>
      <Link to={`/book/${station.id}`} className="btn">Book Platform Ticket</Link>
    </div>
  );
}
