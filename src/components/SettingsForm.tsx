"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    setMessage(res.ok ? "Site settings saved." : "Unable to save settings.");
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      {(
        [
          ["companyName", "Company name"],
          ["tagline", "Tagline"],
          ["phone", "Phone"],
          ["email", "Email"],
          ["address", "Address"],
          ["announcement", "Homepage announcement"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="block text-sm font-medium text-navy">
          {label}
          <input
            value={settings[key]}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, [key]: e.target.value }))
            }
            className="mt-1 w-full border border-line px-3 py-2"
          />
        </label>
      ))}
      {message && <p className="text-sm text-teal">{message}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
