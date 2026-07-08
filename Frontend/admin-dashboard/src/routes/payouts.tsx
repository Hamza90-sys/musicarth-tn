import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Wallet, Check, Banknote, Smartphone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Instructor = {
  id: string;
  fullName: string;
  email: string;
  payoutMethod: string | null;
  bankName: string | null;
  bankRib: string | null;
  bankAccountHolder: string | null;
  flouciNumber: string | null;
};
type PayoutRow = {
  instructor: Instructor;
  earnedMillimes: number;
  sales: number;
  paid: boolean;
  paidAt: string | null;
  hasPayoutDetails: boolean;
};
type PayoutsResponse = { month: string; instructors: PayoutRow[] };

export const Route = createFileRoute("/payouts")({
  component: PayoutsPage,
});

const tnd = (m: number) => `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 3)} TND`;
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function PayoutsPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [month, setMonth] = useState(currentMonth());
  const [error, setError] = useState<string | null>(null);

  const payoutsQuery = useQuery({
    queryKey: ["admin-payouts", month],
    queryFn: () => apiFetch<PayoutsResponse>(`/payments/admin/payouts?month=${month}`),
  });

  const markPaid = useMutation({
    mutationFn: (instructorId: string) =>
      apiFetch("/payments/admin/payouts", {
        method: "POST",
        body: JSON.stringify({ instructorId, month }),
      }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Could not mark paid"),
  });

  const rows = payoutsQuery.data?.instructors ?? [];
  const totalOwed = rows.filter((r) => !r.paid).reduce((s, r) => s + r.earnedMillimes, 0);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("payouts")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("payoutsSub")}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs text-primary">Still to transfer this month</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{tnd(totalOwed)}</p>
        </div>
      ) : null}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" /> Instructor earnings — {payoutsQuery.data?.month ?? month}
          </CardTitle>
          <CardDescription>
            Each instructor's 70% share for this month. Transfer to their account, then mark it paid.
          </CardDescription>
          {error ? <CardDescription className="text-destructive">{error}</CardDescription> : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {payoutsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              No instructor earnings for this month yet.
            </p>
          ) : (
            rows.map((r) => (
              <div key={r.instructor.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.instructor.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.instructor.email} · {r.sales} sale{r.sales === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">{tnd(r.earnedMillimes)}</span>
                    {r.paid ? (
                      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                        <Check className="h-3 w-3" /> Paid
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        disabled={markPaid.isPending || !r.hasPayoutDetails}
                        onClick={() => {
                          if (confirm(`Mark ${tnd(r.earnedMillimes)} as paid to ${r.instructor.fullName}?`)) {
                            markPaid.mutate(r.instructor.id);
                          }
                        }}
                      >
                        Mark as paid
                      </Button>
                    )}
                  </div>
                </div>

                {/* Payout destination */}
                <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs">
                  {!r.hasPayoutDetails ? (
                    <p className="flex items-center gap-1.5 text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      No payout details yet — ask this instructor to add them in their profile.
                    </p>
                  ) : r.instructor.payoutMethod === "flouci" ? (
                    <p className="flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">Flouci:</span> {r.instructor.flouciNumber}
                    </p>
                  ) : (
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1.5">
                        <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{r.instructor.bankName}</span>
                      </span>
                      <span>RIB: {r.instructor.bankRib}</span>
                      <span className="text-muted-foreground">{r.instructor.bankAccountHolder}</span>
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
