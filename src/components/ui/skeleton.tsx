import { cn } from "@/utils/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted shimmer", className)}
      {...props}
    />
  )
}

// Specialized skeleton components
function SkeletonText({ 
  className, 
  lines = 1,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  if (lines === 1) {
    return <Skeleton className={cn("h-4 w-full", className)} {...props} />
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full",
            className
          )}
          {...props}
        />
      ))}
    </div>
  )
}

function SkeletonButton({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton 
      className={cn("h-10 w-24 rounded-md", className)} 
      {...props} 
    />
  )
}

function SkeletonCard({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <Skeleton className="h-4 w-1/2" />
      <SkeletonText lines={3} />
      <div className="flex space-x-2">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  )
}

function SkeletonAvatar({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton 
      className={cn("h-10 w-10 rounded-full", className)} 
      {...props} 
    />
  )
}

function SkeletonImage({ 
  className, 
  aspectRatio = "16/9",
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { aspectRatio?: string }) {
  return (
    <Skeleton 
      className={cn("w-full rounded-md", className)} 
      style={{ aspectRatio }}
      {...props} 
    />
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonButton, 
  SkeletonCard, 
  SkeletonAvatar, 
  SkeletonImage 
}