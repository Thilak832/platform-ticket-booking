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

function todayIso() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now - tzOffsetMs).toISOString().slice(0, 10);
}

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [allTime, setAllTime] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") return;
    apiClient
      .get("/api/admin/stats")
      .then(({ data }) => setStats(data))
      .catch(() => setError("Failed to load admin stats"));
  }, [user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    setLogsLoading(true);
    const params = allTime ? { all_time: true, limit: 50 } : { date: selectedDate, limit: 50 };
    apiClient
      .get("/api/admin/activity-logs", { params })
      .then(({ data }) => setLogs(data))
      .catch(() => setError("Failed to load activity logs"))
      .finally(() => setLogsLoading(false));
  }, [user, selectedDate, allTime]);

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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginTop: "2.5rem" }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          Recent Activity {!allTime && <span className="event-meta">&middot; {selectedDate}</span>}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <input
            type="date"
            value={selectedDate}
            disabled={allTime}
            max={todayIso()}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: "0.4rem 0.6rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem" }}
          />
          <button
            type="button"
            className={`btn btn-sm ${selectedDate === todayIso() && !allTime ? "" : "btn-secondary"}`}
            onClick={() => { setAllTime(false); setSelectedDate(todayIso()); }}
          >
            Today
          </button>
          <button
            type="button"
            className={`btn btn-sm ${allTime ? "" : "btn-secondary"}`}
            onClick={() => setAllTime(true)}
          >
            All time
          </button>
        </div>
      </div>

      <div className="activity-feed" style={{ marginTop: "1rem" }}>
        {logsLoading && <p className="event-meta">Loading activity...</p>}
        {!logsLoading && logs.map((log) => (
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
        {!logsLoading && logs.length === 0 && (
          <p className="event-meta">
            No activity {allTime ? "recorded yet" : `on ${selectedDate}`}.
          </p>
        )}
      </div>
    </div>
  );
}
