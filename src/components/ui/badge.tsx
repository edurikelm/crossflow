import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary_container text-on_primary_container",
        secondary:
          "bg-secondary_container text-on_secondary_container",
        destructive:
          "bg-error_container text-on_error_container",
        outline: "bg-transparent text-surface-foreground",
        success:
          "bg-secondary_container text-secondary",
        warning:
          "bg-tertiary_container text-on_tertiary_container",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };