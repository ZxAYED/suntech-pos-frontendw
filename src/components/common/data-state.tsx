import Link from "next/link";
import { AlertCircle, Building2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ErrorState({
  resource,
  onRetry,
  className,
}: {
  resource: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 px-6 py-10 text-center",
        className,
      )}
    >
      <AlertCircle className="mb-3 h-8 w-8 text-rose-500" aria-hidden="true" />
      <p className="text-sm font-semibold text-[#070B28]">Something went wrong</p>
      <p className="mt-1 text-xs text-slate-600">Could not load {resource}.</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-busy="true" aria-label="Loading table">
      <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, index) => <Skeleton key={index} className="h-3 w-20" />)}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="grid gap-4 border-b border-slate-100 px-4 py-4 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, column) => <Skeleton key={column} className="h-4 w-full max-w-32" />)}
        </div>
      ))}
    </div>
  );
}

export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading metrics">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-7 w-32" />
          <Skeleton className="mt-3 h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export function DataState<T>({
  data,
  isLoading,
  isError,
  resource,
  emptyTitle,
  emptyDescription,
  onRetry,
  loading,
  children,
}: {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  resource: string;
  emptyTitle: string;
  emptyDescription?: string;
  onRetry?: () => void;
  loading?: ReactNode;
  children: (data: T[]) => ReactNode;
}) {
  if (isLoading) return <>{loading ?? <TableSkeleton />}</>;
  if (isError) return <ErrorState resource={resource} onRetry={onRetry} />;
  if (data.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <>{children(data)}</>;
}

export function TenantRequiredState() {
  return (
    <EmptyState
      title="Select a business and branch before continuing."
      description="Admin data is scoped to the active business and operational branch."
      action={
        <Button asChild className="gap-2 bg-[#0052FF] text-white hover:bg-[#0047E0]">
          <Link href="/admin/select-business">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            Select tenant context
          </Link>
        </Button>
      }
    />
  );
}
