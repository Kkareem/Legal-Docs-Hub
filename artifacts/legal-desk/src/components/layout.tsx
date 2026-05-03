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
  Settings,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "لوحة التحكم", href: "/", icon: LayoutDashboard },
    { name: "الموكلون", href: "/clients", icon: Users },
    { name: "القضايا", href: "/cases", icon: Briefcase },
    { name: "المهام", href: "/tasks", icon: CheckSquare },
    { name: "الجلسات", href: "/hearings", icon: Calendar },
    { name: "الاستشارات", href: "/consultations", icon: MessageSquare },
    { name: "المدفوعات", href: "/payments", icon: CreditCard },
    { name: "الوكالات", href: "/powers-of-attorney", icon: FileText },
    { name: "الإشعارات", href: "/notifications", icon: Bell },
    { name: "المستخدمون", href: "/users", icon: UserCog },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary w-8 h-8 rounded flex items-center justify-center shadow-sm">
              <span className="text-sidebar font-bold text-sm">LD</span>
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-white">LegalDesk</span>
          </div>
        </div>

        <ScrollArea className="flex-1 py-4 px-3">
          <nav className="space-y-1">
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
                    <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-400"}`} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-sidebar-accent"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800 font-serif">
            {navigation.find(n => location === n.href || (n.href !== "/" && location.startsWith(n.href)))?.name || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-500 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
