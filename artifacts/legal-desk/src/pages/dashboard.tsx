import { useGetDashboardSummary, useGetUpcomingHearings, useGetOverdueTasks, useGetPaymentSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, CheckSquare, Calendar, AlertTriangle, Clock, CreditCard, FileText } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

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

const PIE_COLORS = ["#1e3a5f", "#c9a227", "#4a7cbf", "#e07b3a", "#6dba7d", "#a855f7"];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: upcomingHearings } = useGetUpcomingHearings();
  const { data: overdueTasks } = useGetOverdueTasks();
  const { data: paymentSummary } = useGetPaymentSummary();
  const { data: recentActivity } = useGetRecentActivity();

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

  const casesByStatusChart = summary?.casesByStatus?.map((item: any) => ({
    name: statusLabels[item.label] ?? item.label,
    value: item.count,
  })) ?? [];

  const paymentPieData = paymentSummary ? [
    { name: "محصّل", value: paymentSummary.totalCollected },
    { name: "معلق", value: paymentSummary.totalPending },
    { name: "متأخر", value: paymentSummary.totalOverdue },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy">لوحة التحكم</h1>
        <p className="text-slate-500 text-sm mt-0.5">نظرة عامة على مكتبك القانوني</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="القضايا النشطة" value={summary?.activeCases} />
        <StatCard icon={Users} label="إجمالي الموكلين" value={summary?.totalClients} />
        <StatCard
          icon={CheckSquare} label="المهام المعلقة" value={summary?.pendingTasks}
          sub={summary?.overdueTasks ? `${summary.overdueTasks} متأخرة` : undefined}
          accent={!!summary?.overdueTasks}
        />
        <StatCard
          icon={Calendar} label="جلسات اليوم" value={summary?.todayHearings}
          sub={summary?.upcomingHearings ? `${summary.upcomingHearings} هذا الأسبوع` : undefined}
        />
        <StatCard icon={AlertTriangle} label="استشارات معلقة" value={summary?.pendingConsultations} />
        <StatCard
          icon={CreditCard} label="مستحقات متأخرة"
          value={paymentSummary ? formatCurrency(paymentSummary.totalPending) : "—"} accent
        />
        <StatCard
          icon={FileText} label="وكالات خارج المكتب" value={summary?.powersOfAttorneyOut}
          sub={summary?.overduePoAs ? `${summary.overduePoAs} متأخرة` : undefined}
          accent={!!summary?.overduePoAs}
        />
        <StatCard
          icon={Briefcase} label="إجمالي المحصّل"
          value={paymentSummary ? formatCurrency(paymentSummary.totalCollected) : "—"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Status Bar Chart */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-navy">القضايا حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {casesByStatusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={casesByStatusChart} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: any) => [`${v} قضية`, ""]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="value" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-12">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Pie Chart */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-navy">توزيع المدفوعات</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {paymentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentPieData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {paymentPieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-12">لا توجد بيانات مالية</p>
            )}
            {paymentSummary && (
              <div className="mt-2 grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
                <div><p className="text-xs text-slate-400">محصّل</p><p className="text-sm font-bold text-green-600">{formatCurrency(paymentSummary.totalCollected)}</p></div>
                <div><p className="text-xs text-slate-400">معلق</p><p className="text-sm font-bold text-amber-600">{formatCurrency(paymentSummary.totalPending)}</p></div>
                <div><p className="text-xs text-slate-400">متأخر</p><p className="text-sm font-bold text-red-600">{formatCurrency(paymentSummary.totalOverdue)}</p></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lists Row */}
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
                      <p className="text-xs text-slate-400 mt-0.5">{(h as any).caseNumber ?? `#${h.caseId}`}</p>
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
                      <p className="text-xs text-slate-400 mt-0.5">{(t as any).assigneeName ?? "غير محدد"}</p>
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

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentActivity.slice(0, 8).map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                  <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{a.description ?? a.action}</p>
                    {a.entityType && <p className="text-xs text-slate-400 mt-0.5">{a.entityType}</p>}
                  </div>
                  <p className="text-xs text-slate-400 shrink-0">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }) : ""}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Debtors */}
      {(paymentSummary?.topDebtors?.length ?? 0) > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-500" />
              أكبر المدينين
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {paymentSummary?.topDebtors?.map((d: any) => (
                <div key={d.clientId} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 font-bold text-sm">
                      {d.clientName?.charAt(0) ?? "#"}
                    </div>
                    <p className="text-sm font-medium text-slate-800">{d.clientName}</p>
                  </div>
                  <p className="text-sm font-bold text-red-500">{formatCurrency(d.amountDue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
