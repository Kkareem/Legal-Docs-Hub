import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Calendar, CheckSquare, CreditCard, FileText, AlertCircle, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const typeIcons: Record<string, any> = {
  hearing: Calendar,
  task:    CheckSquare,
  payment: CreditCard,
  poa:     FileText,
  case:    AlertCircle,
  general: Bell,
};

const typeColors: Record<string, string> = {
  hearing: "text-blue-500 bg-blue-50",
  task:    "text-amber-500 bg-amber-50",
  payment: "text-red-500 bg-red-50",
  poa:     "text-purple-500 bg-purple-50",
  case:    "text-green-500 bg-green-50",
  general: "text-slate-500 bg-slate-100",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `منذ ${days} ${days === 1 ? "يوم" : "أيام"}`;
  if (hours > 0) return `منذ ${hours} ${hours === 1 ? "ساعة" : "ساعات"}`;
  if (mins > 0) return `منذ ${mins} ${mins === 1 ? "دقيقة" : "دقائق"}`;
  return "الآن";
}

export default function Notifications() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, isLoading } = useListNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n: any) => !n.read).length ?? 0;

  const handleMarkAll = async () => {
    await markAllMutation.mutateAsync();
    qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    toast({ title: "تم تعليم جميع الإشعارات كمقروءة" });
  };

  const handleMarkOne = async (id: number) => {
    await markReadMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">الإشعارات</h1>
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "جميع الإشعارات مقروءة"}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleMarkAll} disabled={markAllMutation.isPending}>
            <CheckCheck className="w-4 h-4" /> تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : !notifications?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-400 text-lg font-medium">لا توجد إشعارات</p>
            <p className="text-slate-400 text-sm mt-1">ستظهر هنا إشعارات الجلسات والمهام والمدفوعات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const Icon = typeIcons[n.type] ?? Bell;
            const colorCls = typeColors[n.type] ?? typeColors.general;
            return (
              <button
                key={n.id}
                onClick={() => !n.read && handleMarkOne(n.id)}
                className={`w-full text-right flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${!n.read ? "bg-white border-primary/20 shadow-sm" : "bg-slate-50/50 border-slate-200"}`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${colorCls}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium leading-snug ${n.read ? "text-slate-500" : "text-slate-800"}`}>{n.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                      {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
                    </div>
                  </div>
                  <p className={`text-xs mt-0.5 leading-relaxed ${n.read ? "text-slate-400" : "text-slate-600"}`}>{n.body}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
