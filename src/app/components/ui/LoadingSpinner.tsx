import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function LoadingSpinner({ size = "md", text, fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className={`${sizeMap[size]} animate-spin text-[#622599]`} />
      {text && <p className="text-xs text-gray-500 font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        {spinner}
      </div>
    );
  }

  return spinner;
}

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = "", count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 rounded-xl ${className}`}
        />
      ))}
    </>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <Skeleton className="h-36 w-full !rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" count={2} />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
