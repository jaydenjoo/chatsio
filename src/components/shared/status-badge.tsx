import { Badge } from "@/components/ui/badge";
import type { StatusBadgeProps, BadgeStatus } from "@/types/components";

const statusConfig: Record<BadgeStatus, { label: string; className: string }> = {
  success: {
    label: "성공",
    className: "bg-secondary-fixed text-on-secondary-fixed-variant",
  },
  error: {
    label: "실패",
    className: "bg-error-container text-on-error-container",
  },
  warning: {
    label: "주의",
    className: "bg-warning/15 text-warning",
  },
  info: {
    label: "정보",
    className: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  pending: {
    label: "대기중",
    className: "bg-muted text-muted-foreground",
  },
  processing: {
    label: "처리중",
    className: "bg-primary-fixed-dim/20 text-primary",
  },
};

export function StatusBadge({
  status,
  label,
  size = "md",
}: StatusBadgeProps): React.ReactElement {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={`border-0 ${config.className} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      {status === "processing" && (
        <span className="pulse-dot mr-1.5 inline-block size-1.5 rounded-full bg-current" />
      )}
      {label ?? config.label}
    </Badge>
  );
}
