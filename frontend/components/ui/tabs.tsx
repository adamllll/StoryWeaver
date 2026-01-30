/**
 * Tabs - shadcn/ui with Sketch variants
 */

"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "h-10 rounded-md bg-gray-100 p-1 text-gray-500",
        sketch:
          "rounded-full bg-sticky-yellow-light/50 border-2 border-dashed border-sketch-text-secondary/30 p-1.5 gap-1 overflow-x-auto scrollbar-hide snap-x",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm ring-offset-white transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-sm font-medium focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm",
        sketch:
          "rounded-full font-patrick text-sketch-text-secondary snap-start duration-sketch ease-sketch focus-visible:ring-2 focus-visible:ring-sketch-text-primary data-[state=active]:bg-sticky-yellow data-[state=active]:font-caveat data-[state=active]:text-lg data-[state=active]:font-bold data-[state=active]:text-sketch-text-primary data-[state=active]:shadow-sketch disabled:cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 data-[state=inactive]:hidden",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
