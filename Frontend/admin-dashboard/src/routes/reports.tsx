import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Flag, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolutionNotes: string | null;
  createdAt: string;
  reporter: { id: string; fullName: string; email?: string } | null;
};
type ReportsResponse = { items: Report[]; total: number; page: number; limit: number };

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

const statusVariant = (s: ReportStatus) =>
  s === "PENDING" ? ("default" as const) : s === "DISMISSED" ? ("outline" as const) : ("secondary" as const);

function ReportsPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [status, setStatus] = useState<"" | ReportStatus>("PENDING");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const reportsQuery = useQuery({
    queryKey: ["admin-reports", status, page],
    queryFn: () =>
      apiFetch<ReportsResponse>(
        `/admin/reports?page=${page}&limit=20${status ? `&status=${status}` : ""}`,
      ),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: ReportStatus }) =>
      apiFetch(`/admin/reports/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not update report"),
  });

  const data = reportsQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("reports")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("reportsSub")}
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {(["", "PENDING", "RESOLVED", "DISMISSED"] as const).map((s) => (
              <Button
                key={s || "ALL"}
                size="sm"
                variant={status === s ? "default" : "outline"}
                className="rounded-full"
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
              >
                {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
          {error ? <CardDescription className="text-destructive">{error}</CardDescription> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {reportsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading reports…</p>
          ) : (data?.items.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              No reports here. All clear. 🎉
            </p>
          ) : (
            data?.items.map((r) => (
              <div key={r.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">{r.reason}</span>
                    <Badge variant="outline">{r.targetType}</Badge>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </div>
                {r.details ? (
                  <p className="mt-2 text-sm text-muted-foreground">{r.details}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Reported by {r.reporter?.fullName ?? "Unknown"} ·{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </p>
                {r.status === "PENDING" ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={resolveMutation.isPending}
                      onClick={() => resolveMutation.mutate({ id: r.id, newStatus: "RESOLVED" })}
                    >
                      <Check className="h-3.5 w-3.5" /> Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={resolveMutation.isPending}
                      onClick={() => resolveMutation.mutate({ id: r.id, newStatus: "DISMISSED" })}
                    >
                      <X className="h-3.5 w-3.5" /> Dismiss
                    </Button>
                  </div>
                ) : r.resolutionNotes ? (
                  <p className="mt-2 text-xs text-muted-foreground">Note: {r.resolutionNotes}</p>
                ) : null}
              </div>
            ))
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2 text-sm">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-muted-foreground">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
