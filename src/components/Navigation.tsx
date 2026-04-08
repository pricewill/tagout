"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Trophy, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  username?: string | null;
}

export function Navigation({ username }: NavigationProps) {
  const pathname = usePathname();

  const links = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/post/new", label: "Post", icon: PlusCircle },
    username
      ? { href: `/profile/${username}`, label: "Profile", icon: User }
      : { href: "/login", label: "Sign In", icon: LogIn },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-slate-900 border-r border-slate-800 p-4 gap-1 z-30">
        <Link href="/feed" className="flex items-center gap-2 px-2 py-3 mb-4">
          <span className="text-2xl">🧬</span>
          <span className="font-bold text-xl text-amber-400 tracking-tight">Defective Gene Club</span>
        </Link>

        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href) && href !== "/";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-amber-600/20 text-amber-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href) && href !== "/";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                active ? "text-amber-400" : "text-slate-500"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
