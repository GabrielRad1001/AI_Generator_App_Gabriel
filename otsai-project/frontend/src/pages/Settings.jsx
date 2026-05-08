import React from "react";
import { Card, Badge } from "../components/ui/card";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Settings</span>
      <h1 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest">Account</h1>

      <Card className="mt-10" data-testid="settings-profile-card">
        <h3 className="text-lg font-medium mb-6">Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="User ID" value={user.user_id} mono />
          <Field label="Auth provider" value={user.auth_provider} />
          <Field label="Role" value={user.role} />
          <Field label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-lg font-medium mb-2">Notifications</h3>
        <p className="text-sm text-ink-secondary">Notification preferences are coming in the next iteration. For now, OtsAI is silent until you ask it to do something.</p>
      </Card>

      <Card className="mt-6">
        <h3 className="text-lg font-medium mb-2">Danger zone</h3>
        <p className="text-sm text-ink-secondary">Account deletion will be available post-MVP. Email <a className="text-brand hover:underline" href="mailto:hello@otsai.app">hello@otsai.app</a> if you need it now.</p>
      </Card>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-ink-muted">{label}</div>
      <div className={`mt-1 text-ink-primary ${mono ? "font-mono text-sm" : ""}`}>{value}</div>
    </div>
  );
}
