import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h1
          className="text-3xl font-bold tracking-tight text-white"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}
        >
          {title.toUpperCase()}
        </h1>
        {description && (
          <p className="text-sm text-[#8B8B9A] mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
