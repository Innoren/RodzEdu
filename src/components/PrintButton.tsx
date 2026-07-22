"use client";

export function PrintButton({ label = "Download / Print" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary">
      {label}
    </button>
  );
}
