import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

type VerifyResult = { status: string; enrolled: boolean };

export const Route = createFileRoute("/payment/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    pid: typeof search.pid === "string" ? search.pid : undefined,
  }),
  component: PaymentSuccess,
});

function PaymentSuccess() {
  const { pid } = Route.useSearch();

  const verifyQuery = useQuery({
    queryKey: ["verify-payment", pid],
    queryFn: () => apiFetch<VerifyResult>(`/payments/${pid}/verify`),
    enabled: Boolean(pid),
    retry: 3,
    retryDelay: 2000,
  });

  const enrolled = verifyQuery.data?.enrolled;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {!pid ? (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h1 className="text-xl font-semibold">Missing payment reference</h1>
              <Button asChild variant="outline" className="mt-2">
                <Link to="/courses">Back to courses</Link>
              </Button>
            </>
          ) : verifyQuery.isLoading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Confirming your payment…</p>
            </>
          ) : enrolled ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <h1 className="text-2xl font-semibold tracking-tight">Payment successful 🎉</h1>
              <p className="text-muted-foreground">
                You’re enrolled — jump in and start learning.
              </p>
              <Button asChild className="mt-2">
                <Link to="/courses">Go to My Courses</Link>
              </Button>
            </>
          ) : verifyQuery.data?.status === "PENDING" ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h1 className="text-xl font-semibold">Payment is processing</h1>
              <p className="text-muted-foreground">
                This can take a moment. Check again in a few seconds.
              </p>
              <Button onClick={() => verifyQuery.refetch()} variant="outline" className="mt-2">
                Check again
              </Button>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h1 className="text-xl font-semibold">We couldn’t confirm the payment</h1>
              <p className="text-muted-foreground">
                If you were charged, keep this reference and contact support: {pid}
              </p>
              <Button asChild variant="outline" className="mt-2">
                <Link to="/courses">Back to courses</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
