import { Bell, Search } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiFetch } from "@/lib/api";
import { clearStoredAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";

const LANGS: Lang[] = ["en", "fr", "ar"];

export function TopNavbar() {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();

  const badgeQuery = useQuery({
    queryKey: ["admin-notifications-badge"],
    queryFn: () => apiFetch<{ unreadCount: number }>("/notifications"),
    refetchInterval: 60_000,
  });
  const unread = badgeQuery.data?.unreadCount ?? 0;

  const handleSignOut = () => {
    clearStoredAuth();
    router.navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:gap-3 sm:px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute ltr:left-3 rtl:right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("searchPlaceholder")}
          className="h-9 ltr:pl-9 rtl:pr-9 bg-muted/40 border-transparent focus-visible:bg-background"
        />
      </div>
      <div className="ms-auto flex items-center gap-1">
        <div className="flex items-center rounded-md border border-border/60 p-0.5">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase transition-colors ${
                lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={lang === l}
            >
              {l}
            </button>
          ))}
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          {t("signOut")}
        </Button>
        <Button variant="ghost" size="icon" asChild className="relative" aria-label="Notifications">
          <Link to="/notifications">
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>
        </Button>
        <Avatar className="h-8 w-8 ring-2 ring-primary/20">
          <AvatarImage src="" alt="User" />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            AM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
