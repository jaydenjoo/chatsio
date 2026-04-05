"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "@/types/components";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-low px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed-variant">
          {icon}
        </div>
      )}
      <h3 className="text-subtitle text-on-surface">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-on-surface-variant">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href} className={buttonVariants()}>
              {action.label} &rarr;
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label} &rarr;</Button>
          )}
        </div>
      )}
    </div>
  );
}
