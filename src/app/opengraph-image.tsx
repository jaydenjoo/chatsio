import { ImageResponse } from "next/og";

export const alt = "Chatsio — 쇼핑몰 상품 데이터 인프라";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #006195 0%, #004b74 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* 로고 */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 800, color: "#ffffff" }}>
            C
          </span>
        </div>
        {/* 타이틀 */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            marginBottom: 16,
          }}
        >
          Chatsio
        </div>
        {/* 서브타이틀 */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: "rgba(255,255,255,0.8)",
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          쇼핑몰 URL만 연결하면 AI가 상품정보를 자동 구조화합니다
        </div>
        {/* 뱃지들 */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["JSON-LD", "llms.txt", "AI 인용 추적"].map((badge) => (
            <div
              key={badge}
              style={{
                padding: "8px 20px",
                borderRadius: 40,
                background: "rgba(255,255,255,0.15)",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
