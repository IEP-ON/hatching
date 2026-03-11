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

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-pink-100 text-pink-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
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
        <div className="md:hidden border-b bg-white px-4 py-3 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                pathname.startsWith(item.href)
                  ? "bg-pink-100 text-pink-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* 본문 */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
