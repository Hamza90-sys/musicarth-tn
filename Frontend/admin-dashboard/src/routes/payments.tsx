import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RotateCcw, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Payment = {
  id: string;
  amountMillimes: number;
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";
  provider: string;
  createdAt: string;
  user: { fullName: string; email: string };
  course: { title: string } | null;
  availabilityId: string | null;
};

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
});

const tnd = (m: number) => `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 3)} TND`;
const statusVariant = (s: Payment["status"]) =>
  s === "PAID" ? ("default" as const) : s === "REFUNDED" || s === "FAILED" ? ("destructive" as const) : ("outline" as const);

function PaymentsPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  const paymentsQuery = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => apiFetch<Payment[]>("/payments/admin/recent"),
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/payments/${id}/refund`, { method: "POST" }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Refund failed"),
  });

  const payments = paymentsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("payments")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("paymentsSub")}
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" /> Recent payments
          </CardTitle>
          {error ? <CardDescription className="text-destructive">{error}</CardDescription> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading payments…</p>
          ) : payments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              No payments yet.
            </p>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {p.course?.title ?? "Live session booking"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.user.fullName} · {p.user.email} · {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{tnd(p.amountMillimes)}</span>
                  <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  {p.status === "PAID" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      disabled={refundMutation.isPending}
                      onClick={() => {
                        if (confirm(`Refund ${tnd(p.amountMillimes)} to ${p.user.fullName}? This also removes their access.`)) {
                          refundMutation.mutate(p.id);
                        }
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Refund
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
