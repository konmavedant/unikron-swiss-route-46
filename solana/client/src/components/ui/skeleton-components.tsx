import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  showHeader?: boolean;
  lines?: number;
  animated?: boolean;
}

export const SkeletonCard = ({ 
  className, 
  showHeader = true, 
  lines = 3,
  animated = true 
}: SkeletonCardProps) => (
  <Card className={cn("w-full", className)}>
    <CardContent className="p-6 space-y-4">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className={cn("h-6 w-3/4", animated && "animate-pulse")} />
          <Skeleton className={cn("h-4 w-1/2", animated && "animate-pulse")} />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              "h-4", 
              i === lines - 1 ? "w-2/3" : "w-full",
              animated && "animate-pulse"
            )} 
          />
        ))}
      </div>
    </CardContent>
  </Card>
);

interface SkeletonTokenSelectorProps {
  className?: string;
}

export const SkeletonTokenSelector = ({ className }: SkeletonTokenSelectorProps) => (
  <div className={cn("flex items-center gap-2 p-3 border rounded-lg", className)}>
    <Skeleton className="w-8 h-8 rounded-full animate-pulse" />
    <div className="space-y-1 flex-1">
      <Skeleton className="h-4 w-16 animate-pulse" />
      <Skeleton className="h-3 w-20 animate-pulse" />
    </div>
    <Skeleton className="h-4 w-4 animate-pulse" />
  </div>
);

interface SkeletonSwapFormProps {
  className?: string;
}

export const SkeletonSwapForm = ({ className }: SkeletonSwapFormProps) => (
  <Card className={cn("w-full max-w-md mx-auto", className)}>
    <CardContent className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 animate-pulse" />
        <Skeleton className="h-8 w-8 rounded animate-pulse" />
      </div>
      
      {/* MEV Protection Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 animate-pulse" />
          <Skeleton className="h-4 w-20 animate-pulse" />
        </div>
        <Skeleton className="w-10 h-5 rounded-full animate-pulse" />
      </div>
      
      {/* From Token */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-8 animate-pulse" />
          <Skeleton className="h-4 w-16 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-12 rounded animate-pulse" />
          <SkeletonTokenSelector className="w-32" />
        </div>
      </div>
      
      {/* Swap Icon */}
      <div className="flex justify-center">
        <Skeleton className="w-10 h-10 rounded-full animate-pulse" />
      </div>
      
      {/* To Token */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-6 animate-pulse" />
          <Skeleton className="h-4 w-16 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-12 rounded animate-pulse" />
          <SkeletonTokenSelector className="w-32" />
        </div>
      </div>
      
      {/* Quote Area */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full animate-pulse" />
        <Skeleton className="h-4 w-3/4 animate-pulse" />
      </div>
      
      {/* Swap Button */}
      <Skeleton className="w-full h-12 rounded animate-pulse" />
    </CardContent>
  </Card>
);

interface SkeletonListProps {
  items?: number;
  className?: string;
}

export const SkeletonList = ({ items = 5, className }: SkeletonListProps) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
        <Skeleton className="w-8 h-8 rounded-full animate-pulse" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-16 animate-pulse" />
          <Skeleton className="h-3 w-24 animate-pulse" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-4 w-12 animate-pulse" />
          <Skeleton className="h-3 w-8 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

interface SkeletonChartProps {
  className?: string;
  height?: number;
}

export const SkeletonChart = ({ className, height = 200 }: SkeletonChartProps) => (
  <div className={cn("space-y-4", className)}>
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-24 animate-pulse" />
      <Skeleton className="h-8 w-20 animate-pulse" />
    </div>
    <Skeleton className={`w-full animate-pulse`} style={{ height }} />
    <div className="flex justify-between">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-12 animate-pulse" />
      ))}
    </div>
  </div>
);