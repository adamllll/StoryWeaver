import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-lg text-card-foreground", {
  variants: {
    variant: {
      default: "border bg-card shadow-sm",
      sketch:
        "bg-white border-2 border-sketch-text-primary rounded-xl p-6 font-patrick shadow-sketch transition-all duration-sketch ease-sketch hover:-translate-y-1 hover:rotate-1 hover:shadow-sketch-lg",
      "sticky-yellow":
        "bg-sticky-yellow border-2 border-sketch-text-primary/20 rounded-xl p-6 font-patrick shadow-sticky transition-all duration-sketch ease-sketch hover:scale-105 hover:rotate-0 hover:shadow-sticky-hover hover:z-10",
      "sticky-pink":
        "bg-sticky-pink border-2 border-sketch-text-primary/20 rounded-xl p-6 font-patrick shadow-sticky transition-all duration-sketch ease-sketch hover:scale-105 hover:rotate-0 hover:shadow-sticky-hover hover:z-10",
      "sticky-blue":
        "bg-sticky-blue border-2 border-sketch-text-primary/20 rounded-xl p-6 font-patrick shadow-sticky transition-all duration-sketch ease-sketch hover:scale-105 hover:rotate-0 hover:shadow-sticky-hover hover:z-10",
      "sticky-green":
        "bg-sticky-green border-2 border-sketch-text-primary/20 rounded-xl p-6 font-patrick shadow-sticky transition-all duration-sketch ease-sketch hover:scale-105 hover:rotate-0 hover:shadow-sticky-hover hover:z-10",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Deterministic rotation based on string hash
function getRotation(id?: string): string {
  if (!id) return "rotate-0";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const rotation = (Math.abs(hash) % 5) - 2;
  if (rotation === -2) return "-rotate-2";
  if (rotation === -1) return "-rotate-1";
  if (rotation === 0) return "rotate-0";
  if (rotation === 1) return "rotate-1";
  return "rotate-2";
}

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  rotationId?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, rotationId, ...props }, ref) => {
    const isSticky = variant?.startsWith("sticky-");
    const rotationClass = isSticky ? getRotation(rotationId) : "";

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant }),
          rotationClass,
          "motion-reduce:rotate-0 motion-reduce:transition-none",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
