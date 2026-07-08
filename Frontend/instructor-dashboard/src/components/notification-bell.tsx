import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type NotificationFeed = { unreadCount: number };

export function NotificationBell() {
  const badgeQuery = useQuery({
    queryKey: ["instructor-notifications-badge"],
    queryFn: () => apiFetch<NotificationFeed>("/notifications"),
    refetchInterval: 60_000,
  });

  const unread = badgeQuery.data?.unreadCount ?? 0;

  return (
    <Button variant="ghost" size="icon" asChild className="relative" aria-label="Notifications">
      <Link to="/notifications">
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
