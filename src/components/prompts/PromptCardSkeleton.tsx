import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PromptCardSkeleton() {
  return (
    <Card className="glass">
      <CardContent className="p-6 md:flex md:gap-6 md:items-start">
        {/* Image skeleton */}
        <div className="relative w-full md:w-48 shrink-0 mb-4 md:mb-0">
          <Skeleton className="aspect-video md:aspect-auto md:h-28 w-full rounded-lg" />
        </div>

        {/* Content skeleton */}
        <div className="md:flex-1 md:min-w-0 md:pl-6 md:border-l md:border-border/50">
          {/* Header skeleton */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-6 w-3/4" />
          </div>

          {/* Content preview */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Tags skeleton */}
          <div className="flex gap-1 mb-4 flex-wrap">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-14" />
          </div>

          {/* Footer skeleton */}
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
