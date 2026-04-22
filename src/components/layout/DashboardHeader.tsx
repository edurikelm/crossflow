"use client";

import { useState, useEffect } from "react";
import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore, useAuthStore } from "@/store";
import type { Profile, Gym } from "@/types";
import { getInitials } from "@/lib/utils";

interface DashboardHeaderProps {
  user: Profile;
  gym?: Gym;
}

export function DashboardHeader({ user, gym }: DashboardHeaderProps) {
  const { toggleSidebar } = useUIStore();
  const { setGymId, setUser } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setGymId(gym?.id ?? null);
    setUser(user);
  }, [gym?.id, user, setGymId, setUser]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-surface border-b border-transparent px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-on_surface_variant hover:text-surface-foreground hover:bg-surface_container_low"
        onClick={toggleSidebar}
      >
        <Menu size={20} />
      </Button>

      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on_surface_variant" />
          <Input
            type="search"
            placeholder="Buscar atleta, clase..."
            className="bg-surface_container_low pl-10 h-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-on_surface_variant hover:text-surface-foreground hover:bg-surface_container_low"
        >
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on_primary_container">
            3
          </span>
        </Button>

        <DropdownMenu open={showUserMenu} onOpenChange={setShowUserMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface_container_low border border-transparent"
            >
              <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-primary_container text-on_primary_container text-xs font-bold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium text-surface-foreground">{user.full_name}</span>
                {gym && (
                  <span className="text-xs text-on_surface_variant">
                    {gym.name}
                  </span>
                )}
              </div>
              <ChevronDown size={14} className="text-on_surface_variant" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-surface_container_low shadow-xl ambient-shadow"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-surface-foreground">{user.full_name}</p>
                <p className="text-xs text-on_surface_variant">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-surface_container_high" />
            <DropdownMenuItem className="text-surface-foreground hover:bg-surface_container_high hover:text-primary cursor-pointer focus:bg-surface_container_high focus:text-primary">
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="text-surface-foreground hover:bg-surface_container_high hover:text-primary cursor-pointer focus:bg-surface_container_high focus:text-primary">
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-surface_container_high" />
            <DropdownMenuItem className="text-error hover:bg-error_container cursor-pointer focus:bg-error_container">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}