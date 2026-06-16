"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  CalendarClock,
  Star,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  email: string | null;
  fullName: string | null;
  photoUrl: string | null;
  isExpert: boolean;
  isAdmin: boolean;
}

function initials(name: string | null, email: string | null) {
  const base = name?.trim() || email?.split("@")[0] || "?";
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({
  email,
  fullName,
  photoUrl,
  isExpert,
  isAdmin,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <Avatar className="size-8">
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback>{initials(fullName, email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">
          {fullName || email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/bookings" />}>
          <CalendarClock /> My bookings
        </DropdownMenuItem>
        {isExpert ? (
          <DropdownMenuItem render={<Link href="/dashboard" />}>
            <LayoutDashboard /> Expert dashboard
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem render={<Link href="/become-an-expert" />}>
            <Star /> Become an expert
          </DropdownMenuItem>
        )}
        {isAdmin ? (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <ShieldCheck /> Admin
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" render={<Link href="/auth/signout" />}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
