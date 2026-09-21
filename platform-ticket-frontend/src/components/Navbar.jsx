import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoMark } from "./icons";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <LogoMark />
        {import.meta.env.VITE_APP_NAME}
      </Link>
      <div className="nav-links">
        <Link to="/">Stations</Link>
        {user ? (
          <>
            <Link to="/my-bookings">My Tickets</Link>
            <Link to="/wallet">Wallet</Link>
            {user.role === "admin" && <Link to="/admin">Admin</Link>}
            <span className="nav-user">
              <span className="nav-avatar">{initials(user.full_name)}</span>
              {user.full_name}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
