import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
}

export function StatCard({ label, value, delta, trend = "up", icon: Icon }: StatCardProps) {
  return (
    <div className="group rounded-xl border border-border bg-background p-5 shadow-soft hover:shadow-elevated transition-all">
      <div className="flex items-start justify-between">
        <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
          <Icon className="h-4 w-4" />
        </div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md",
              trend === "up"
                ? "text-success bg-success/10"
                : "text-destructive bg-destructive/10"
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
      </div>
    </div>
  );
}
