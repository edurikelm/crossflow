import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col gap-1">
        <div className="h-10 w-64 animate-pulse rounded-md bg-surface_container_high" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded-md bg-surface_container_high" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="h-10 w-10 animate-pulse rounded-md bg-surface_container_high" />
              <div className="mt-4">
                <div className="h-8 w-16 animate-pulse rounded-md bg-surface_container_high" />
                <div className="mt-1 h-3 w-24 animate-pulse rounded-md bg-surface_container_high" />
                <div className="mt-1 h-3 w-16 animate-pulse rounded-md bg-surface_container_high" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 animate-pulse rounded-md bg-surface_container_high" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-10 w-0.5 animate-pulse rounded-full bg-surface_container_high" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-40 animate-pulse rounded-md bg-surface_container_high" />
                      <div className="h-3 w-24 animate-pulse rounded-md bg-surface_container_high" />
                    </div>
                    <div className="h-4 w-12 animate-pulse rounded-md bg-surface_container_high" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
