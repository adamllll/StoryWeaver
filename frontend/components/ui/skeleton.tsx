/**
 * 骨架屏组件（Skeleton）
 * 用于在内容加载时显示占位符，提升用户体验
 * 符合 shadcn/ui 设计规范
 */

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 骨架屏的宽度
   * 可以是具体数值（如 "200px"）或 Tailwind 类名（如 "w-full"）
   */
  width?: string;

  /**
   * 骨架屏的高度
   * 可以是具体数值（如 "20px"）或 Tailwind 类名（如 "h-4"）
   */
  height?: string;

  /**
   * 圆角样式
   * @default "md"
   */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

  /**
   * 是否显示脉冲动画
   * @default true
   */
  animate?: boolean;
}

function Skeleton({
  className,
  width,
  height,
  rounded = "md",
  animate = true,
  style,
  ...props
}: SkeletonProps) {
  const roundedClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={cn(
        "bg-gray-200/60",
        roundedClass,
        animate && "animate-pulse",
        className
      )}
      style={{
        width: width?.startsWith("w-") ? undefined : width,
        height: height?.startsWith("h-") ? undefined : height,
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * 小说卡片骨架屏
 */
function SkeletonNovelCard() {
  return (
    <div className="glass rounded-ios-xl p-6 space-y-4">
      {/* 封面 */}
      <Skeleton height="200px" rounded="lg" />

      {/* 标题 */}
      <Skeleton height="24px" width="80%" />

      {/* 作者 */}
      <div className="flex items-center space-x-2">
        <Skeleton width="20px" height="20px" rounded="full" />
        <Skeleton height="16px" width="100px" />
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Skeleton height="14px" width="100%" />
        <Skeleton height="14px" width="90%" />
        <Skeleton height="14px" width="70%" />
      </div>

      {/* 标签 */}
      <div className="flex gap-2">
        <Skeleton height="24px" width="60px" rounded="full" />
        <Skeleton height="24px" width="60px" rounded="full" />
      </div>

      {/* 按钮 */}
      <Skeleton height="40px" width="100%" rounded="lg" />
    </div>
  );
}

/**
 * 章节列表项骨架屏
 */
function SkeletonChapterItem() {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton height="18px" width="120px" />
        <Skeleton height="16px" width="60px" />
      </div>
      <Skeleton height="14px" width="100%" />
      <Skeleton height="14px" width="80%" />
    </div>
  );
}

/**
 * 小说详情页骨架屏
 */
function SkeletonNovelDetail() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 头部信息 */}
      <div className="glass rounded-ios-2xl p-8 space-y-6">
        {/* 标题 */}
        <Skeleton height="48px" width="60%" />

        {/* 作者和分类 */}
        <div className="flex items-center gap-4">
          <Skeleton height="20px" width="80px" />
          <Skeleton height="20px" width="60px" />
          <Skeleton height="20px" width="70px" />
        </div>

        {/* 描述 */}
        <div className="space-y-2">
          <Skeleton height="18px" width="100%" />
          <Skeleton height="18px" width="95%" />
          <Skeleton height="18px" width="85%" />
          <Skeleton height="18px" width="90%" />
        </div>

        {/* 按钮组 */}
        <div className="flex gap-4">
          <Skeleton height="48px" width="120px" rounded="lg" />
          <Skeleton height="48px" width="120px" rounded="lg" />
        </div>
      </div>

      {/* 章节列表 */}
      <div className="glass rounded-ios-2xl p-6 space-y-4">
        <Skeleton height="32px" width="150px" />
        <div className="grid gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonChapterItem key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 小说列表页骨架屏
 */
function SkeletonNovelList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNovelCard key={i} />
      ))}
    </div>
  );
}

/**
 * 文本行骨架屏
 */
function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? "70%" : "100%"}
        />
      ))}
    </div>
  );
}

/**
 * 头像骨架屏
 */
function SkeletonAvatar({
  size = "md",
}: {
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }[size];

  return <Skeleton className={sizeClass} rounded="full" />;
}

export {
  Skeleton,
  SkeletonNovelCard,
  SkeletonChapterItem,
  SkeletonNovelDetail,
  SkeletonNovelList,
  SkeletonText,
  SkeletonAvatar,
};
