import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  User,
  MessagesSquare,
  Bell,
  Trophy,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useT } from "@/lib/locale";

const items = [
  { key: "dashboard", url: "/", icon: LayoutDashboard },
  { key: "myCourses", url: "/courses", icon: BookOpen },
  { key: "sessions", url: "/sessions", icon: CalendarDays },
  { key: "progress", url: "/progress", icon: Trophy },
  { key: "forum", url: "/forum", icon: MessagesSquare },
  { key: "notifications", url: "/notifications", icon: Bell },
  { key: "profile", url: "/profile", icon: User },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const t = useT();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex-row items-center border-b border-sidebar-border px-2">
        <Link to="/" className="flex items-center gap-2 px-2">
          <img
            src="/musicarth.png"
            alt="Musicarth"
            className={collapsed ? "h-7 w-7 shrink-0 object-contain" : "h-8 w-auto object-contain"}
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath === item.url || currentPath.startsWith(`${item.url}/`)}
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{t(item.key)}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
