import { Skeleton } from "@/components/ui/skeleton";

const HomePageSkeleton = () => (
  <div className="min-h-screen bg-background pb-20">
    {/* Header */}
    <header className="flex items-center justify-between px-5 pt-10 pb-2">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </header>

    <div className="px-5 space-y-5 mt-3">
      {/* Hero Marquee */}
      <Skeleton className="h-44 w-full rounded-2xl" />

      {/* Activity Ticker */}
      <Skeleton className="h-8 w-full rounded-lg" />

      {/* Quote */}
      <div className="text-center py-1 space-y-1">
        <Skeleton className="h-3 w-64 mx-auto" />
        <Skeleton className="h-3 w-32 mx-auto" />
      </div>

      {/* Daan Categories */}
      <div>
        <Skeleton className="h-5 w-36 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card shadow-sm overflow-hidden">
              <Skeleton className="h-28 w-full" />
              <div className="p-3 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Bar */}
      <div className="flex justify-center gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Impact Strip */}
      <div>
        <Skeleton className="h-5 w-28 mb-3" />
        <div className="flex justify-between rounded-2xl bg-card p-4 shadow-sm">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center space-y-1.5">
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default HomePageSkeleton;
