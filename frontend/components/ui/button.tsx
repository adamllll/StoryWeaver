import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Sketch variants
        sketch:
          "font-caveat text-xl font-bold bg-sticky-yellow border-2 border-sketch-text-primary rounded-xl shadow-sketch transition-all duration-sketch ease-sketch hover:-translate-y-0.5 hover:shadow-sketch-lg active:translate-y-px active:shadow-sketch-sm motion-reduce:transform-none",
        "sketch-secondary":
          "font-patrick text-base bg-white border-2 border-dashed border-sketch-text-secondary rounded-xl transition-all duration-sketch ease-sketch hover:border-solid hover:border-sketch-text-primary motion-reduce:transform-none",
        "sketch-ghost":
          "font-patrick text-base text-sketch-text-primary bg-transparent border-none rounded-xl transition-all duration-sketch ease-sketch hover:bg-sticky-yellow-light/30 motion-reduce:transform-none",
        "sketch-destructive":
          "font-caveat text-xl font-bold bg-sticky-pink border-2 border-red-700 rounded-xl shadow-sketch transition-all duration-sketch ease-sketch hover:-translate-y-0.5 hover:shadow-sketch-lg active:translate-y-px active:shadow-sketch-sm motion-reduce:transform-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isSketch = variant?.startsWith("sketch");

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && isSketch ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
