import { Card, CardContent } from "@/components/ui/card";
import type { KPICardProps } from "@/types/components";

export function KPICard({ label, value, change, icon }: KPICardProps): React.ReactElement {
  return (
    <Card className="hover-lift">
      <CardContent className="flex items-center gap-4 p-6">
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed-variant">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-on-surface">
            {value}
          </p>
        </div>
        {change && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              change.trend === "up"
                ? "bg-secondary-fixed text-on-secondary-fixed-variant"
                : change.trend === "down"
                  ? "bg-error-container text-on-error-container"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {change.trend === "up" ? "+" : change.trend === "down" ? "" : ""}
            {change.value}%
          </span>
        )}
      </CardContent>
    </Card>
  );
}
