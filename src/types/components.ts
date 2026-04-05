import type { ReactNode } from "react";

/** KPICard */
export interface KPICardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
  icon?: ReactNode;
}

/** StatusBadge */
export type BadgeStatus =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "pending"
  | "processing";

export interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  size?: "sm" | "md";
}

/** EmptyState */
export interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: ReactNode;
}

/** PageHeader */
export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}
