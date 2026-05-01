import { Skeleton } from "@/components/ui/skeleton";

export const HomeTabSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-3 shadow-sm text-center space-y-2">
          <Skeleton className="h-6 w-10 mx-auto" />
          <Skeleton className="h-2.5 w-12 mx-auto" />
        </div>
      ))}
    </div>
    <Skeleton className="h-24 w-full rounded-xl" />
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-[72px] rounded-xl" />
      <Skeleton className="h-[72px] rounded-xl" />
    </div>
  </div>
);

export const OrdersTabSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-5 w-36" />
    {[...Array(3)].map((_, i) => (
      <div key={i} className="rounded-xl bg-card p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-24 mt-2" />
      </div>
    ))}
  </div>
);

export const VisitsTabSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-5 w-36" />
    {[...Array(3)].map((_, i) => (
      <div key={i} className="rounded-xl bg-card p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-40" />
      </div>
    ))}
  </div>
);

export const AlertsTabSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-5 w-28" />
    {[...Array(4)].map((_, i) => (
      <div key={i} className="rounded-xl bg-card p-3.5 shadow-sm">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ProfileTabSkeleton = () => (
  <div className="space-y-4">
    <div className="rounded-xl bg-card p-5 shadow-sm text-center space-y-3">
      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
      <Skeleton className="h-5 w-32 mx-auto" />
      <Skeleton className="h-3 w-40 mx-auto" />
      <Skeleton className="h-6 w-20 rounded-full mx-auto" />
    </div>
    <div className="rounded-xl bg-card p-4 shadow-sm space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
    <Skeleton className="h-14 w-full rounded-xl" />
    <Skeleton className="h-14 w-full rounded-xl" />
  </div>
);
