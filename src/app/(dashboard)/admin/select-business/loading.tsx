export default function SelectBusinessLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Loading workspace hub">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}

