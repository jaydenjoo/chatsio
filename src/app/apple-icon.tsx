import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#006195",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "sans-serif",
          }}
        >
          C
        </span>
      </div>
    ),
    { ...size },
  );
}
