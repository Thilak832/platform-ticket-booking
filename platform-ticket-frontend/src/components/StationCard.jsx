import { Link } from "react-router-dom";
import { StationIcon } from "./icons";

export default function StationCard({ station }) {
  return (
    <div className="event-card station-card">
      <StationIcon />
      <h3 className="station-name">{station.name}</h3>
      <p className="event-meta">Station code: {station.code}</p>
      <Link to={`/book/${station.id}`} className="btn">Book Platform Ticket</Link>
    </div>
  );
}
