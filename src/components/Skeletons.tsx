export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-stone-200 rounded-lg ${className || ''}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="h-6 w-32 bg-stone-200 rounded-md mb-2" />
          <div className="h-8 w-48 bg-stone-200 rounded-md" />
        </div>
        <div className="w-12 h-12 bg-stone-200 rounded-full" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-stone-100 rounded-3xl p-5 border border-stone-200/50 aspect-square flex flex-col justify-between">
            <div className="w-10 h-10 bg-stone-200 rounded-2xl" />
            <div>
              <div className="w-8 h-8 bg-stone-200 rounded-lg mb-2" />
              <div className="w-20 h-4 bg-stone-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Agenda */}
      <div className="space-y-4">
        <div className="w-32 h-6 bg-stone-200 rounded-md" />
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-stone-50 border border-stone-100 rounded-2xl p-4 flex gap-4">
              <div className="w-12 h-12 bg-stone-200 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-3/4 h-5 bg-stone-200 rounded" />
                <div className="w-1/2 h-4 bg-stone-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlansListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-stone-200/60 p-4 sm:p-5 rounded-3xl">
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-stone-200 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="w-3/4 h-5 bg-stone-200 rounded" />
              <div className="flex gap-2">
                <div className="w-16 h-5 bg-stone-200 rounded-full" />
                <div className="w-20 h-5 bg-stone-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-stone-200 animate-pulse mt-8">
      {[1, 2].map((i) => (
        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse mb-8 md:mb-12">
          {/* Timeline dot */}
          <div className="w-10 h-10 rounded-full border-4 border-white bg-stone-200 shrink-0 md:order-1 md:-translate-x-1/2 z-10 relative" />
          
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-stone-200/60 shadow-sm rounded-3xl overflow-hidden h-64">
            <div className="w-full h-48 bg-stone-200" />
            <div className="p-4 flex gap-2">
              <div className="w-6 h-6 rounded-full bg-stone-300" />
              <div className="w-1/2 h-4 bg-stone-300 rounded mt-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlanDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="w-10 h-10 bg-stone-200 rounded-full" />
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-stone-200 rounded-full" />
          <div className="w-10 h-10 bg-stone-200 rounded-full" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="w-16 h-6 bg-stone-200 rounded-full" />
          <div className="w-20 h-6 bg-stone-200 rounded-full" />
          <div className="w-20 h-6 bg-stone-200 rounded-full" />
        </div>
        <div className="w-3/4 h-8 bg-stone-200 rounded-lg" />
        <div className="w-1/2 h-5 bg-stone-200 rounded" />
      </div>

      <div className="h-px bg-stone-200 my-6" />
      
      <div className="space-y-3">
        <div className="w-1/4 h-6 bg-stone-200 rounded" />
        <div className="w-full h-24 bg-stone-200 rounded-2xl" />
      </div>
    </div>
  );
}
