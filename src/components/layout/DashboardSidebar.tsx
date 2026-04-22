"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Dumbbell,
  UserCog,
  Ticket,
  Bell,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import type { UserRole } from "@/types";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/", label: "Inicio", icon: <LayoutDashboard size={20} /> },
  { href: "/calendar", label: "Calendario", icon: <Calendar size={20} /> },
  { href: "/athletes", label: "Atletas", icon: <Users size={20} /> },
  { href: "/classes", label: "Clases", icon: <Dumbbell size={20} /> },
  { href: "/coaches", label: "Coaches", icon: <UserCog size={20} /> },
  { href: "/tickets", label: "Tickets", icon: <Ticket size={20} /> },
  { href: "/notifications", label: "Notificar", icon: <Bell size={20} /> },
  {
    href: "/settings",
    label: "Configuración",
    icon: <Settings size={20} />,
    roles: ["super_admin", "owner", "manager"],
  },
];

interface DashboardSidebarProps {
  gymName?: string;
  userRole: UserRole;
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { sidebar, setSidebarCollapsed } = useUIStore();
  const { isCollapsed } = sidebar;

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col bg-surface_container_lowest transition-all duration-300",
          isCollapsed && "-translate-x-full lg:translate-x-0 lg:w-[72px]"
        )}
      >
        <div className="relative flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-primary_container shadow-sm milled-edge">
              <Dumbbell className="h-4 w-4 text-on_primary_container" />
            </div>
            {!isCollapsed && (
              <span
                className="text-2xl tracking-wider text-surface-foreground font-display"
              >
                CROSSFLOW
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-on_surface_variant hover:text-surface-foreground hover:bg-surface_container_low lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          >
            <X size={18} />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNavItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-on_surface_variant hover:bg-surface_container_low hover:text-surface-foreground"
                  )}
                  title={isCollapsed ? item.label : undefined}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r-full bg-primary" />
                  )}
                  <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="relative">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </nav>

        <div className="p-3 space-y-1">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-on_surface_variant transition-all duration-200 hover:bg-error_container hover:text-error"
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>

        {!isCollapsed && (
          <div className="hidden lg:block h-14 p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-on_surface_variant">Sistema activo</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}