import { ImageResponse } from "next/og";

export const alt = "RodzEdu — Radiology Continuing Education";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "linear-gradient(145deg, #0b2433 0%, #123a4d 45%, #1a5c63 100%)",
          color: "white",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#7fd4cf",
          }}
        >
          Radiology CE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 96, lineHeight: 1, fontWeight: 700 }}>
            RodzEdu
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.35,
              maxWidth: 820,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            Continuing education imaging professionals can trust.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          rodzedu.org
        </div>
      </div>
    ),
    { ...size },
  );
}
