import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted gpu-accelerate", className)}
      style={{ animationDuration: '1s' }}
      {...props}
    />
  )
}

export { Skeleton }
