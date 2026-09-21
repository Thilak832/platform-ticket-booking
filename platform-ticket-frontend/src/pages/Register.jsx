import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const { signup, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await signup(form);
      setDevOtp(data.otp_debug || "");
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(form.email, otp, "signup");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <AuthLayout>
        <form className="auth-form" onSubmit={handleVerifyOtp}>
          <h2>Verify Your Email</h2>
          <p className="event-meta">OTP sent to {form.email}</p>
          {devOtp && <p className="dev-otp">Dev mode OTP: <strong>{devOtp}</strong></p>}
          {error && <p className="error">{error}</p>}
          <label>
            OTP Code
            <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
          </label>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Create Account"}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        {error && <p className="error">{error}</p>}
        <label>
          Full Name
          <input name="full_name" value={form.full_name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Phone (10 digits)
          <input name="phone" value={form.phone} onChange={handleChange} maxLength={10} required />
        </label>
        <label>
          Password
          <PasswordInput name="password" value={form.password} onChange={handleChange} minLength={8} required />
        </label>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </AuthLayout>
  );
}
