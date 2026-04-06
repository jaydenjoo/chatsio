import {
  Package,
  Sparkles,
  Rocket,
  FileText,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

export const SERVICE_NAV: readonly NavItem[] = [
  { href: "/products", label: "상품 관리", icon: Package },
  { href: "/optimize", label: "AI 최적화", icon: Sparkles },
  { href: "/deploy", label: "배포 관리", icon: Rocket },
  { href: "/citations", label: "AI 인용 리포트", icon: FileText },
];

export const SETTINGS_NAV: readonly NavItem[] = [
  { href: "/settings", label: "설정", icon: Settings },
];
