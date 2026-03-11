"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Profile } from "@/lib/types";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Users,
  Calendar,
  Bird,
  TrendingUp,
  Eye,
  Radio,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Profile["role"][];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "대시보드",
    icon: <LayoutDashboard size={20} />,
    roles: ["teacher"],
  },
  {
    href: "/guide",
    label: "지도서",
    icon: <BookOpen size={20} />,
    roles: ["teacher"],
  },
  {
    href: "/guide/students",
    label: "학생",
    icon: <Users size={20} />,
    roles: ["teacher"],
  },
  {
    href: "/guide/schedule",
    label: "시간표",
    icon: <Calendar size={20} />,
    roles: ["teacher"],
  },
  {
    href: "/guide/quails",
    label: "메추리",
    icon: <Bird size={20} />,
    roles: ["teacher"],
  },
  {
    href: "/guide/growth",
    label: "성장",
    icon: <TrendingUp size={20} />,
    roles: ["teacher"],
  },
  {
    href: "/guide/observations",
    label: "관찰",
    icon: <Eye size={20} />,
    roles: ["teacher"],
  },
  {
    href: "/guide/iot",
    label: "IoT",
    icon: <Radio size={20} />,
    roles: ["teacher"],
  },
  {
    href: "/textbook",
    label: "교과서",
    icon: <GraduationCap size={20} />,
    roles: ["teacher", "student"],
  },
];

interface AppShellProps {
  children: React.ReactNode;
  profile: Profile;
}

export default function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(profile.role)
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("로그아웃되었습니다.");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 헤더 */}
      <header className="h-14 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40 flex items-center px-4 gap-3">
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="메뉴"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span>🥚</span>
          <span className="hidden sm:inline">사계절 메추리</span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 ml-4 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {filteredNav.map((item) => {
            const hasMoreSpecific = item.href === "/guide" && filteredNav.some(
              (other) => other.href !== "/guide" && other.href.startsWith("/guide/") && pathname.startsWith(other.href)
            );
            const isActive = !hasMoreSpecific && (pathname === item.href || pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0",
                  isActive
                    ? "bg-pink-100 text-pink-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:inline">
            {profile.name}
            {profile.level_code && (
              <span className="ml-1 text-xs text-gray-400">
                ({profile.level_code})
              </span>
            )}
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="로그아웃">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="md:hidden border-b bg-white px-4 py-3">
          <div className="grid grid-cols-3 gap-1.5">
            {filteredNav.map((item) => {
              const hasMoreSpecific = item.href === "/guide" && filteredNav.some(
                (other) => other.href !== "/guide" && other.href.startsWith("/guide/") && pathname.startsWith(other.href)
              );
              const isActive = !hasMoreSpecific && (pathname === item.href || pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-pink-100 text-pink-700"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 본문 */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
