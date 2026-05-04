import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  MessageSquare,
  CreditCard,
  FileText,
  LogOut,
  Bell,
  UserCog,
  FolderOpen,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import GlobalSearch from "@/components/global-search";

const roleLabels: Record<string, string> = {
  owner: "مالك المكتب",
  lawyer: "محامي",
  paralegal: "مساعد قانوني",
  assistant: "مساعد إداري",
};

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "لوحة التحكم",  href: "/",                    icon: LayoutDashboard },
    { name: "الموكلون",      href: "/clients",             icon: Users },
    { name: "القضايا",       href: "/cases",               icon: Briefcase },
    { name: "المستندات",     href: "/documents",           icon: FolderOpen },
    { name: "المهام",        href: "/tasks",               icon: CheckSquare },
    { name: "الجلسات",       href: "/hearings",            icon: Calendar },
    { name: "الاستشارات",   href: "/consultations",        icon: MessageSquare },
    { name: "المدفوعات",    href: "/payments",             icon: CreditCard },
    { name: "الوكالات",     href: "/powers-of-attorney",  icon: FileText },
    { name: "الإشعارات",    href: "/notifications",        icon: Bell },
    { name: "المستخدمون",   href: "/users",               icon: UserCog },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 border-l border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary w-8 h-8 rounded flex items-center justify-center shadow-sm">
              <span className="text-sidebar font-bold text-sm">LD</span>
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-white">LegalDesk</span>
          </div>
        </div>

        <ScrollArea className="flex-1 py-4 px-3">
          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer text-sm font-medium ${
                      isActive
                        ? "bg-sidebar-accent text-primary"
                        : "text-slate-300 hover:bg-sidebar-accent/50 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-slate-400"}`} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border">
          <Link href="/profile">
            <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer transition-colors group">
              <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{roleLabels[user?.role ?? ""] ?? user?.role}</p>
              </div>
              <UserCircle className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
            </div>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-sidebar-accent text-sm"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800 font-serif">
            {navigation.find(n => location === n.href || (n.href !== "/" && location.startsWith(n.href)))?.name
              || (location === "/profile" ? "الملف الشخصي" : "لوحة التحكم")}
          </h1>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="text-slate-500">
                <Bell className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-slate-500">
                <UserCircle className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-0 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
