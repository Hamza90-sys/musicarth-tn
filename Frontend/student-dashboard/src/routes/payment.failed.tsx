import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/payment/failed")({
  component: PaymentFailed,
});

function PaymentFailed() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <XCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-semibold tracking-tight">Payment not completed</h1>
          <p className="text-muted-foreground">
            The payment was cancelled or didn’t go through. You weren’t charged — you can try again
            anytime.
          </p>
          <Button asChild className="mt-2">
            <Link to="/courses">Back to courses</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
