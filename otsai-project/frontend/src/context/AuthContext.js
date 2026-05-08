import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth as authApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const u = await authApi.me();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = async (data) => {
    const r = await authApi.login(data);
    localStorage.setItem("otsai_token", r.access_token);
    setUser(r.user);
    return r.user;
  };

  const signup = async (data) => {
    const r = await authApi.signup(data);
    localStorage.setItem("otsai_token", r.access_token);
    setUser(r.user);
    return r.user;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem("otsai_token");
    setUser(null);
  };

  const refresh = checkAuth;

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
