import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { StatIcon } from "../components/icons";

const STAT_TILES = [
  { key: "bookings_today", label: "Bookings today", kind: "bookings", prefix: "" },
  { key: "active_users", label: "Active users", kind: "users", prefix: "" },
  { key: "revenue_today", label: "Revenue today", kind: "revenue", prefix: "₹" },
  { key: "total_bookings", label: "Total bookings", kind: "total", prefix: "" },
];

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    Promise.all([apiClient.get("/api/admin/stats"), apiClient.get("/api/admin/activity-logs?limit=50")])
      .then(([statsRes, logsRes]) => {
        setStats(statsRes.data);
        setLogs(logsRes.data);
      })
      .catch(() => setError("Failed to load admin data"));
  }, [user]);

  if (user?.role !== "admin") return <p className="error">Admin access required</p>;
  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading...</p>;

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p className="event-meta" style={{ marginBottom: "1.5rem" }}>Real-time bookings, revenue, and system activity.</p>

      <div className="event-grid">
        {STAT_TILES.map(({ key, label, kind, prefix }) => (
          <div key={key} className="event-card stat-tile stat-tile-v2">
            <span className="stat-tile-icon"><StatIcon kind={kind} /></span>
            <h3>{prefix}{stats[key]}</h3>
            <p className="event-meta">{label}</p>
          </div>
        ))}
      </div>

      <h3 className="section-title">Recent Activity</h3>
      <div className="activity-feed">
        {logs.map((log) => (
          <div key={log.id} className="activity-row">
            <span className={`activity-dot ${log.status === "failed" ? "activity-dot-failed" : ""}`} />
            <div className="activity-row-body">
              <p>
                <strong>{log.action.replace(/_/g, " ")}</strong>{" "}
                <span className={`status ${log.status === "failed" ? "status-failed" : "status-active"}`}>{log.status}</span>
              </p>
              <p className="event-meta">
                {new Date(log.created_at).toLocaleString()} {log.ip_address ? `· ${log.ip_address}` : ""}
                {log.details ? ` · ${log.details}` : ""}
              </p>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="event-meta">No activity yet.</p>}
      </div>
    </div>
  );
}
