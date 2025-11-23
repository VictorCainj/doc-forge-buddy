import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const TaskBoardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Highlight Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        {[1, 2].map((i) => (
          <Card key={i} className="border-2 border-neutral-200 bg-white/50 h-[200px]">
            <CardHeader className="pb-3 pt-4 px-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex items-center justify-center">
              <div className="w-full space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Columns Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((col) => (
          <div key={col} className="flex flex-col h-[600px]">
            <Card className="h-full bg-neutral-50/50 border-neutral-200">
              <CardHeader className="pb-4 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="bg-white p-4 rounded-lg border border-neutral-200 space-y-3"
                  >
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="pt-2 border-t border-neutral-100 flex justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

