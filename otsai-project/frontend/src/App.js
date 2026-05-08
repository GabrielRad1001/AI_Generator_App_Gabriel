import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Generate from "./pages/Generate";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import CreditsPage from "./pages/CreditsPage";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AppShell from "./pages/AppShell";
import "./App.css";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-ink-muted text-sm uppercase tracking-[0.2em]">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  // Synchronous check — process Emergent Google Auth callback BEFORE any other route.
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="grain min-h-screen">
          <AppRouter />
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#0D1D13",
                color: "#F4FFF9",
                border: "1px solid #172A1F",
                borderRadius: 0,
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
