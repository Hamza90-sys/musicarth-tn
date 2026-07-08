import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, BookOpen, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Courses", url: "/courses", icon: BookOpen },
  { title: "Sessions", url: "/sessions", icon: Calendar },
  { title: "Profile", url: "/profile", icon: User },
];

export function InstructorSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border">
        <img src="/musicarth.png" alt="Musicarth" className="h-8 w-auto object-contain" />
        <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
          Instructor
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const active =
            item.url === "/"
              ? path === "/"
              : path === item.url || path.startsWith(`${item.url}/`);
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-gradient-to-br from-primary to-primary-light p-4 text-primary-foreground">
          <p className="text-xs font-medium opacity-90">Pro Tip</p>
          <p className="text-sm font-semibold mt-1">Boost engagement</p>
          <p className="text-xs opacity-90 mt-1">Upload at least 1 lesson per week.</p>
        </div>
      </div>
    </aside>
  );
}
