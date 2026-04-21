"use client";

import { useState } from "react";
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
import { useUIStore } from "@/store";
import type { Profile, Gym } from "@/types";
import { getInitials } from "@/lib/utils";

interface DashboardHeaderProps {
  user: Profile;
  gym?: Gym;
}

export function DashboardHeader({ user, gym }: DashboardHeaderProps) {
  const { toggleSidebar } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[#1A1A24] bg-[#0D0D12] px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="text-[#8B8B9A] hover:text-white hover:bg-[#1A1A24]"
        onClick={toggleSidebar}
      >
        <Menu size={20} />
      </Button>

      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8B9A]" />
          <Input
            type="search"
            placeholder="Buscar atleta, clase..."
            className="bg-[#1A1A24] border-[#1A1A24] text-white placeholder:text-[#8B8B9A] pl-10 h-10 rounded-lg focus:ring-[#22c55e]/50 focus:border-[#22c55e]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-[#8B8B9A] hover:text-white hover:bg-[#1A1A24]"
        >
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#22c55e] text-[10px] font-bold text-[#0D0D12]">
            3
          </span>
        </Button>

        <DropdownMenu open={showUserMenu} onOpenChange={setShowUserMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1A1A24] border border-transparent hover:border-[#1A1A24]"
            >
              <Avatar className="h-8 w-8 ring-2 ring-[#22c55e]/30">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white text-xs font-bold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium text-white">{user.full_name}</span>
                {gym && (
                  <span className="text-xs text-[#8B8B9A]">
                    {gym.name}
                  </span>
                )}
              </div>
              <ChevronDown size={14} className="text-[#8B8B9A]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-[#1A1A24] border-[#1A1A24] shadow-xl shadow-black/40"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-white">{user.full_name}</p>
                <p className="text-xs text-[#8B8B9A]">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#1A1A24]" />
            <DropdownMenuItem className="text-[#e5e5e5] hover:bg-[#22c55e]/10 hover:text-[#22c55e] cursor-pointer focus:bg-[#22c55e]/10 focus:text-[#22c55e]">
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[#e5e5e5] hover:bg-[#22c55e]/10 hover:text-[#22c55e] cursor-pointer focus:bg-[#22c55e]/10 focus:text-[#22c55e]">
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#1A1A24]" />
            <DropdownMenuItem className="text-[#ef4444] hover:bg-[#ef4444]/10 cursor-pointer focus:bg-[#ef4444]/10">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
