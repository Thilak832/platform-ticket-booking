import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    apiClient
      .get("/api/admin/stats")
      .then(({ data }) => setStats(data))
      .catch(() => setError("Failed to load admin stats"));
  }, [user]);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    setLogsLoading(true);
    const params = allTime ? { all_time: true, limit: 50 } : { date: selectedDate, limit: 50 };
    if (search) params.search = search;
    apiClient
      .get("/api/admin/activity-logs", { params })
      .then(({ data }) => setLogs(data))
      .catch(() => setError("Failed to load activity logs"))
      .finally(() => setLogsLoading(false));
  }, [user, selectedDate, allTime, search]);

  if (user?.role !== "admin") return <p className="error">Admin access required</p>;
  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2>Admin Dashboard</h2>
          <p className="event-meta">Real-time bookings, revenue, and system activity.</p>
        </div>
        <Link to="/admin/scan" className="btn">📷 Scan Ticket</Link>
      </div>

      <div className="event-grid" style={{ marginTop: "1.5rem" }}>
        {STAT_TILES.map(({ key, label, kind, prefix }) => (
          <div key={key} className="event-card stat-tile stat-tile-v2">
            <span className="stat-tile-icon"><StatIcon kind={kind} /></span>
            <h3>{prefix}{stats[key]}</h3>
            <p className="event-meta">{label}</p>
          </div>
        ))}
      </div>

      <div className="admin-activity-header">
        <h3 className="section-title" style={{ margin: 0 }}>
          Recent Activity {!allTime && <span className="event-meta">&middot; {selectedDate}</span>}
        </h3>

        <div className="admin-activity-controls">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="admin-search-input"
          />
          <input
            type="date"
            value={selectedDate}
            disabled={allTime}
            max={todayIso()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="admin-date-input"
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

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Action</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logsLoading && (
              <tr><td colSpan={7} className="event-meta">Loading activity...</td></tr>
            )}
            {!logsLoading && logs.map((log) => {
              const dt = new Date(log.created_at);
              const confirmed = log.status !== "failed";
              return (
                <tr key={log.id}>
                  <td>
                    {log.user_name ? (
                      <>
                        <strong>{log.user_name}</strong>
                        <div className="event-meta">{log.user_email}</div>
                      </>
                    ) : (
                      <span className="event-meta">Unknown user</span>
                    )}
                  </td>
                  <td>{log.action.replace(/_/g, " ")}</td>
                  <td>{dt.toLocaleDateString()}</td>
                  <td>{dt.toLocaleTimeString()}</td>
                  <td>
                    <span className={`status ${confirmed ? "status-active" : "status-failed"}`}>
                      {confirmed ? "Confirmed" : "Failed"}
                    </span>
                  </td>
                  <td>{log.ip_address || "-"}</td>
                  <td>{log.details || "-"}</td>
                </tr>
              );
            })}
            {!logsLoading && logs.length === 0 && (
              <tr>
                <td colSpan={7} className="event-meta">
                  No activity {allTime ? "recorded yet" : `on ${selectedDate}`}
                  {search ? ` matching "${search}"` : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
