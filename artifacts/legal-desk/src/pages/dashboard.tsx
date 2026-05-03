import { useGetDashboardSummary, useGetUpcomingHearings, useGetOverdueTasks, useGetPaymentSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, CheckSquare, Calendar, AlertTriangle, Clock, CreditCard, FileText } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, accent }: any) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold text-navy">{value ?? "—"}</p>
            {sub && <p className={`text-xs mt-1 ${accent ? "text-amber-600 font-medium" : "text-slate-400"}`}>{sub}</p>}
          </div>
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const statusLabels: Record<string, string> = {
  new: "جديد", active: "نشط", upcoming_hearing: "جلسة قادمة", verdict: "حكم", adjourned: "مؤجل", closed: "مغلق",
  civil: "مدني", criminal: "جنائي", commercial: "تجاري", family: "أسري", labor: "عمالي", administrative: "إداري", other: "أخرى",
};

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: upcomingHearings } = useGetUpcomingHearings();
  const { data: overdueTasks } = useGetOverdueTasks();
  const { data: paymentSummary } = useGetPaymentSummary();

  if (summaryLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy">لوحة التحكم</h1>
        <p className="text-slate-500 text-sm mt-0.5">نظرة عامة على مكتبك القانوني</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="القضايا النشطة" value={summary?.activeCases} />
        <StatCard icon={Users} label="إجمالي الموكلين" value={summary?.totalClients} />
        <StatCard icon={CheckSquare} label="المهام المعلقة" value={summary?.pendingTasks} sub={summary?.overdueTasks ? `${summary.overdueTasks} متأخرة` : undefined} accent={!!summary?.overdueTasks} />
        <StatCard icon={Calendar} label="جلسات اليوم" value={summary?.todayHearings} sub={summary?.upcomingHearings ? `${summary.upcomingHearings} هذا الأسبوع` : undefined} />
        <StatCard icon={AlertTriangle} label="استشارات معلقة" value={summary?.pendingConsultations} />
        <StatCard icon={CreditCard} label="مستحقات متأخرة" value={paymentSummary ? formatCurrency(paymentSummary.totalPending) : "—"} accent />
        <StatCard icon={FileText} label="وكالات خارج المكتب" value={summary?.powersOfAttorneyOut} sub={summary?.overduePoAs ? `${summary.overduePoAs} متأخرة` : undefined} accent={!!summary?.overduePoAs} />
        <StatCard icon={Briefcase} label="إجمالي المحصّل" value={paymentSummary ? formatCurrency(paymentSummary.totalCollected) : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              الجلسات القادمة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!upcomingHearings?.length ? (
              <p className="p-5 text-sm text-slate-400 text-center">لا توجد جلسات قادمة هذا الأسبوع</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {upcomingHearings.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{h.court ?? "محكمة غير محددة"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{h.caseNumber ?? `#${h.caseId}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-primary">
                        {new Date(h.datetime).toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(h.datetime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              المهام المتأخرة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!overdueTasks?.length ? (
              <p className="p-5 text-sm text-slate-400 text-center">لا توجد مهام متأخرة</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {overdueTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.assigneeName ?? "غير محدد"}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString("ar-SA") : "—"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-navy">القضايا حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {!summary?.casesByStatus?.length ? (
              <p className="text-sm text-slate-400 text-center py-4">لا توجد بيانات</p>
            ) : (
              summary.casesByStatus.map((item: any) => (
                <div key={item.label} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-slate-600">{statusLabels[item.label] ?? item.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (item.count / (summary.activeCases + 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-navy w-4 text-right">{item.count}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-navy">ملخص المدفوعات</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {paymentSummary && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">المحصّل</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(paymentSummary.totalCollected)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-500">معلق</span>
                  <span className="text-sm font-semibold text-amber-600">{formatCurrency(paymentSummary.totalPending)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-500">متأخر</span>
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(paymentSummary.totalOverdue)}</span>
                </div>
                {paymentSummary.topDebtors?.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">أكبر المدينين</p>
                    {paymentSummary.topDebtors.slice(0, 3).map((d: any) => (
                      <div key={d.clientId} className="flex justify-between items-center py-1.5">
                        <span className="text-sm text-slate-600 truncate max-w-32">{d.clientName}</span>
                        <span className="text-sm font-medium text-red-500">{formatCurrency(d.amountDue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
