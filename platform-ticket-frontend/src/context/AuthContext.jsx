import { createContext, useContext, useState, useCallback } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const signup = useCallback(async (payload) => {
    const { data } = await apiClient.post("/api/auth/signup", payload);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post("/api/auth/login", { email, password });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const verifyOtp = useCallback(async (email, otp_code, purpose) => {
    const { data } = await apiClient.post("/api/auth/verify-otp", { email, otp_code, purpose });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const { data } = await apiClient.post("/api/auth/forgot-password", { email });
    return data;
  }, []);

  const resetPassword = useCallback(async (email, otp_code, new_password) => {
    const { data } = await apiClient.post("/api/auth/reset-password", { email, otp_code, new_password });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signup, login, verifyOtp, forgotPassword, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
