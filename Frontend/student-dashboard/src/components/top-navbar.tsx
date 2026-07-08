import { useState, type FormEvent } from "react";
import { Bell, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { clearStoredAuth, useStoredAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { setLang, useLang, useT, type Lang } from "@/lib/locale";

const getInitials = (fullName?: string) => {
  if (!fullName) {
    return "ST";
  }

  const parts = fullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "ST";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

export function TopNavbar() {
  const router = useRouter();
  const auth = useStoredAuth();
  const lang = useLang();
  const t = useT();
  const [term, setTerm] = useState("");
  const notificationsQuery = useQuery({
    queryKey: ["student-notifications-badge"],
    queryFn: () => apiFetch<{ unreadCount: number }>("/notifications"),
  });
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  const handleSignOut = () => {
    clearStoredAuth();
    router.navigate({ to: "/login" });
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    router.navigate({ to: "/search", search: { q: term.trim() } });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:gap-3 sm:px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <form onSubmit={onSearch} className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-9 pl-9 bg-muted/40 border-transparent focus-visible:bg-background"
        />
      </form>
      <div className="ml-auto flex items-center gap-1">
        <div className="hidden items-center gap-0.5 rounded-full border border-border px-1 py-0.5 sm:flex">
          {(["en", "fr", "ar"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-full px-2 py-0.5 text-xs uppercase transition-colors ${
                lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          {t("signOut")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => router.navigate({ to: "/notifications" })}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary" />
          ) : null}
        </Button>
        <Avatar className="h-8 w-8 ring-2 ring-primary/20">
          <AvatarImage src="" alt="User" />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {getInitials(auth?.user.fullName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
