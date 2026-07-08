import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

type NotificationItem = {
  id: string;
  userId: string;
  type: "SYSTEM" | "SESSION" | "FORUM";
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

type NotificationFeed = {
  items: NotificationItem[];
  unreadCount: number;
};

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["instructor-notifications"],
    queryFn: () => apiFetch<NotificationFeed>("/notifications"),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiFetch<NotificationFeed>("/notifications/read-all", { method: "PATCH" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["instructor-notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["instructor-notifications-badge"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiFetch(`/notifications/${notificationId}/read`, { method: "PATCH" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["instructor-notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["instructor-notifications-badge"] });
    },
  });

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 space-y-6">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Notifications
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Stay on top of student activity in real time.
            </h1>
            <p className="text-sm text-muted-foreground">
              Course approvals, enrolments, and session updates all land here instantly.
            </p>
          </div>
          <Card className="w-full max-w-sm border-border/60 bg-background/80 backdrop-blur">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs text-muted-foreground">Unread</p>
                <p className="mt-1 text-2xl font-semibold">{unreadCount}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3 text-primary">
                <Bell className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Activity feed</CardTitle>
              <CardDescription>Unread items are surfaced first.</CardDescription>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              disabled={markAllMutation.isPending || unreadCount === 0}
              onClick={() => markAllMutation.mutate()}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              You’re all caught up.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition-colors ${item.isRead ? "border-border/60 bg-background" : "border-primary/20 bg-primary/5"}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{item.type}</Badge>
                      {!item.isRead ? <Badge variant="outline">Unread</Badge> : null}
                    </div>
                    <h3 className="font-semibold tracking-tight">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.link ? (
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href={item.link} target="_blank" rel="noreferrer">
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : null}
                    {!item.isRead ? (
                      <Button
                        size="sm"
                        onClick={() => markReadMutation.mutate(item.id)}
                        disabled={markReadMutation.isPending}
                      >
                        Mark read
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
