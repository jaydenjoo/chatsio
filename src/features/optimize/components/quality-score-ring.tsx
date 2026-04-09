"use client";

import type { ReactElement } from "react";

interface QualityScoreRingProps {
  readonly score: number | null;
  readonly size?: number;
  readonly strokeWidth?: number;
}

interface ScoreStyle {
  readonly color: string;
  readonly label: string;
}

const RADIUS_RATIO = 0.45;

function getScoreStyle(score: number): ScoreStyle {
  if (score >= 80) {
    return { color: "var(--success)", label: "Excellent" };
  }
  if (score >= 60) {
    return { color: "var(--warning)", label: "Good" };
  }
  return { color: "var(--error)", label: "Needs Work" };
}

export function QualityScoreRing({
  score,
  size = 128,
  strokeWidth = 10,
}: QualityScoreRingProps): ReactElement {
  const radius = size * RADIUS_RATIO;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (score === null) {
    return (
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="var(--surface-container-high)"
            strokeWidth={strokeWidth}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-[var(--outline)]">
            -
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">
            점수 없음
          </span>
        </div>
      </div>
    );
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const dashOffset = circumference * (1 - clampedScore / 100);
  const style = getScoreStyle(clampedScore);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-label={`최적화 품질 점수 ${clampedScore}점`}
        role="img"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="var(--surface-container-high)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={style.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-extrabold text-[var(--on-surface)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {clampedScore}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: style.color }}
        >
          {style.label}
        </span>
      </div>
    </div>
  );
}
