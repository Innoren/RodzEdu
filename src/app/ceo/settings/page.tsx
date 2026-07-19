import { getSettings } from "@/lib/db";
import { SettingsForm } from "@/components/SettingsForm";

export default async function CeoSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Company controls</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
        Site settings
      </h1>
      <p className="mt-3 mb-6 text-muted">
        Update the public announcement bar, contact details, and company
        messaging shown across the marketing site.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
