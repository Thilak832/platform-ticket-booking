import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import AuthLayout from "../components/AuthLayout";

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setDevOtp(data.otp_debug || "");
      setMessage(data.message);
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (step === "reset") {
    return (
      <AuthLayout>
        <form className="auth-form" onSubmit={handleReset}>
          <h2>Reset Password</h2>
          <p className="event-meta">{message || `OTP sent to ${email}`}</p>
          {devOtp && <p className="dev-otp">Dev mode OTP: <strong>{devOtp}</strong></p>}
          {error && <p className="error">{error}</p>}
          <label>
            OTP Code
            <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
          </label>
          <label>
            New Password
            <PasswordInput name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
          </label>
          <label>
            Confirm New Password
            <PasswordInput name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
          </label>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <p><Link to="/login">Back to Login</Link></p>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleRequestOtp}>
        <h2>Forgot Password</h2>
        <p className="event-meta">Enter your email and we'll send you an OTP to reset your password.</p>
        {error && <p className="error">{error}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
        <p><Link to="/login">Back to Login</Link></p>
      </form>
    </AuthLayout>
  );
}
