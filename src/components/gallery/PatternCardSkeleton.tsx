export function PatternCardSkeleton() {
  return (
    <div className="border border-[#00FF00]/10 bg-[#0a0a0a] rounded p-3 font-mono">
      <div className="aspect-square bg-[#1a1a1a] rounded mb-2 animate-pulse" />
      <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-2 animate-pulse" />
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-12 bg-[#1a1a1a] rounded animate-pulse" />
        <div className="h-4 w-10 bg-[#1a1a1a] rounded animate-pulse" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-8 bg-[#1a1a1a] rounded animate-pulse" />
          <div className="h-3 w-8 bg-[#1a1a1a] rounded animate-pulse" />
        </div>
        <div className="h-3 w-16 bg-[#1a1a1a] rounded animate-pulse" />
      </div>
    </div>
  )
}
