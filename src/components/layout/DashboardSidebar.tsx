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
  ChevronLeft,
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

export function DashboardSidebar({ gymName = "Mi Gimnasio", userRole }: DashboardSidebarProps) {
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
          "fixed left-0 top-0 z-50 flex h-full flex-col bg-[#0D0D12] border-r border-[#1A1A24] transition-all duration-300",
          isCollapsed && "-translate-x-full lg:translate-x-0 lg:w-[72px]"
        )}
      >
        <div className="relative flex h-16 items-center justify-between border-b border-[#1A1A24] px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-lg shadow-[#22c55e]/20">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <span
                className="text-2xl tracking-wider text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                CROSSFLOW
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#8B8B9A] hover:text-white hover:bg-[#1A1A24] lg:hidden"
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
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-[#22c55e]/20 to-transparent text-[#22c55e]"
                      : "text-[#8B8B9A] hover:bg-[#1A1A24] hover:text-white"
                  )}
                  title={isCollapsed ? item.label : undefined}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-[#22c55e]" />
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

        <div className="border-t border-[#1A1A24] p-3 space-y-1">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#8B8B9A] transition-all duration-200 hover:bg-[#1A1A24] hover:text-[#ef4444]"
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>

        {!isCollapsed && (
          <div className="hidden lg:block h-16 border-t border-[#1A1A24] p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-xs text-[#8B8B9A]">Sistema activo</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
