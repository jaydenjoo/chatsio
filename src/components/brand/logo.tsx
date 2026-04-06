import type { ReactElement } from "react";

interface LogoProps {
  /** 로고 한 변의 픽셀 크기 (기본 32) */
  size?: number;
  className?: string;
}

/**
 * Chatsio 모노그램 로고
 *
 * 둥근 사각형 안에 "C" 한 글자. 디자인 시스템 v3.0의 `--primary` /
 * `--on-primary` 토큰을 직접 사용하여 라이트/다크 모드 자동 전환.
 *
 * Phase 3 정식 랜딩(Task 3-3)에서 더 정교한 워드마크로 교체될 수 있음.
 */
export function Logo({ size = 32, className }: LogoProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Chatsio"
    >
      <rect
        width="32"
        height="32"
        rx="8"
        style={{ fill: "var(--primary)" }}
      />
      <text
        x="16"
        y="17"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="800"
        fontFamily="var(--font-display), 'DM Sans', sans-serif"
        style={{ fill: "var(--on-primary)" }}
      >
        C
      </text>
    </svg>
  );
}
