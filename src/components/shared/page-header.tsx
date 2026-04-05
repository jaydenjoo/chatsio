import type { PageHeaderProps } from "@/types/components";

export function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-section text-on-surface">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
