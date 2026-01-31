import { cn } from "@/lib/utils";

interface SkeletonSketchProps {
  className?: string;
  variant?: "card" | "sticky-note" | "text" | "avatar";
}

export function SkeletonSketch({ className, variant = "card" }: SkeletonSketchProps) {
  const baseClasses = "animate-pulse bg-gray-200/60";

  if (variant === "sticky-note") {
    return (
      <div
        className={cn(
          baseClasses,
          "rounded-xl border-2 border-dashed border-gray-300/50 p-6",
          "rotate-[-1deg]",
          className
        )}
      >
        <div className="h-4 bg-gray-300/60 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-300/50 rounded w-full mb-2" />
        <div className="h-3 bg-gray-300/50 rounded w-2/3" />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={cn(baseClasses, "h-4 rounded", className)} />
    );
  }

  if (variant === "avatar") {
    return (
      <div className={cn(baseClasses, "rounded-full h-10 w-10", className)} />
    );
  }

  // Default card variant
  return (
    <div
      className={cn(
        baseClasses,
        "rounded-xl border-2 border-dashed border-gray-300/50 p-6",
        className
      )}
    >
      <div className="h-5 bg-gray-300/60 rounded w-1/2 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-300/50 rounded w-full" />
        <div className="h-3 bg-gray-300/50 rounded w-5/6" />
        <div className="h-3 bg-gray-300/50 rounded w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonSketchGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonSketch
          key={i}
          variant="sticky-note"
          className={i % 3 === 0 ? "rotate-[-2deg]" : i % 3 === 1 ? "rotate-[1deg]" : "rotate-[-1deg]"}
        />
      ))}
    </div>
  );
}
