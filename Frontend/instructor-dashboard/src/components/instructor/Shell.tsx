import { type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { InstructorSidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { clearStoredAuth, getStoredAuth } from "@/lib/auth";

const initialsOf = (name?: string) => {
  if (!name) return "IN";
  const parts = name.split(" ").map((p) => p.trim()).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "IN";
};

export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const auth = getStoredAuth();

  const signOut = () => {
    clearStoredAuth();
    router.navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <InstructorSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <span className="text-sm font-semibold lg:hidden">Musicarth</span>
          <div className="ms-auto flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
            <Link to="/profile" aria-label="Profile">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {initialsOf(auth?.user.fullName)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
