import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D12] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-lg shadow-[#22c55e]/20 hover:from-[#16a34a] hover:to-[#22c55e]",
        destructive:
          "bg-[#ef4444] text-white shadow-sm hover:bg-[#ef4444]/90",
        outline:
          "border border-[#1A1A24] bg-transparent text-white hover:bg-[#1A1A24] hover:border-[#22c55e]/30",
        secondary:
          "bg-[#1A1A24] text-[#e5e5e5] shadow-sm hover:bg-[#1A1A24]/80",
        ghost: "text-[#8B8B9A] hover:bg-[#1A1A24] hover:text-white",
        link: "text-[#22c55e] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
