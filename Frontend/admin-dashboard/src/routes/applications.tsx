import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, FileText, MapPin, Phone, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, authHeaders, buildApiUrl } from "@/lib/api";

type Application = {
  id: string;
  role: "STUDENT" | "INSTRUCTOR";
  status: "PENDING" | "APPROVED" | "REJECTED";
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string | null;
  instruments: string | null;
  motivation: string | null;
  cvFileName: string | null;
  hasCv: boolean;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reviewedBy: { fullName: string } | null;
};

type ReviewResult = { inviteLink: string | null };

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const Route = createFileRoute("/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("PENDING");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [invites, setInvites] = useState<Record<string, string>>({});

  const applicationsQuery = useQuery({
    queryKey: ["admin-applications", status],
    queryFn: () => apiFetch<Application[]>(`/admin/applications?status=${status}`),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "APPROVED" | "REJECTED" }) =>
      apiFetch<ReviewResult>(`/admin/applications/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ decision, notes: notes[id] || undefined }),
      }),
    onSuccess: async (result, variables) => {
      if (result.inviteLink) {
        setInvites((prev) => ({ ...prev, [variables.id]: result.inviteLink! }));
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
  });

  const viewCv = async (id: string) => {
    const res = await fetch(buildApiUrl(`/admin/applications/${id}/cv`), {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const applications = applicationsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review student and instructor requests. Approving an account sends an invite to set a
          password.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
            className="rounded-full"
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {applicationsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading applications…</p>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No {status.toLowerCase()} applications.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="border-border/60">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={app.role === "INSTRUCTOR" ? "default" : "secondary"}>
                        {app.role}
                      </Badge>
                      <Badge
                        variant={
                          app.status === "APPROVED"
                            ? "default"
                            : app.status === "REJECTED"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold">{app.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(app.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {app.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {app.city}, {app.country}
                  </span>
                  {app.instruments ? (
                    <span className="text-muted-foreground">🎵 {app.instruments}</span>
                  ) : null}
                </div>

                {app.address ? (
                  <p className="text-sm text-muted-foreground">Address: {app.address}</p>
                ) : null}
                {app.motivation ? (
                  <p className="rounded-xl bg-muted/40 p-3 text-sm">{app.motivation}</p>
                ) : null}

                {app.hasCv ? (
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => viewCv(app.id)}>
                    <FileText className="h-4 w-4" />
                    View CV{app.cvFileName ? ` (${app.cvFileName})` : ""}
                  </Button>
                ) : null}

                {invites[app.id] ? (
                  <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <p className="text-xs font-medium text-primary">
                      Invite link (send this to the applicant to set their password):
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-background px-2 py-1 text-xs">
                        {invites[app.id]}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => navigator.clipboard.writeText(invites[app.id])}
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </Button>
                    </div>
                  </div>
                ) : null}

                {app.status === "PENDING" ? (
                  <div className="space-y-3 border-t border-border/60 pt-4">
                    <Textarea
                      placeholder="Optional review note (shown to the applicant on rejection)"
                      rows={2}
                      value={notes[app.id] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="gap-2"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: app.id, decision: "APPROVED" })}
                      >
                        <Check className="h-4 w-4" /> Approve &amp; invite
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: app.id, decision: "REJECTED" })}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ) : app.reviewNotes ? (
                  <p className="border-t border-border/60 pt-3 text-sm text-muted-foreground">
                    Note: {app.reviewNotes}
                    {app.reviewedBy ? ` — ${app.reviewedBy.fullName}` : ""}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
