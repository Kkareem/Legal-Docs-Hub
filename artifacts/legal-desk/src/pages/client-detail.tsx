import { Link } from "wouter";
import { useGetClient, useGetClientSummary, useListCases, useListPayments, useListDocuments, getGetClientQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Phone, Mail, CreditCard, Briefcase, FileText } from "lucide-react";

const formatCurrency = (n: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);

const caseStatusLabels: Record<string, string> = {
  new: "جديد", active: "نشط", upcoming_hearing: "جلسة قادمة", verdict: "حكم", adjourned: "مؤجل", closed: "مغلق",
};
const paymentStatusCls: Record<string, string> = {
  paid: "bg-green-100 text-green-700", pending: "bg-amber-100 text-amber-700", overdue: "bg-red-100 text-red-700", partial: "bg-blue-100 text-blue-700",
};
const paymentStatusLabel: Record<string, string> = { paid: "مدفوع", pending: "معلق", overdue: "متأخر", partial: "جزئي" };

interface Props { id: string }

export default function ClientDetail({ id }: Props) {
  const clientId = parseInt(id);
  const { data: client, isLoading } = useGetClient(clientId);
  const { data: summary } = useGetClientSummary(clientId);
  const { data: cases } = useListCases({ clientId });
  const { data: payments } = useListPayments({ clientId });

  if (isLoading) return <div className="p-6 flex items-center justify-center min-h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!client) return <div className="p-6"><p className="text-slate-500">الموكل غير موجود</p></div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/clients"><Button size="icon" variant="ghost"><ArrowRight className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-navy">{client.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{client.serviceType ?? "موكل"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100"><CardTitle className="text-sm font-semibold text-navy">معلومات الاتصال</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-3">
            {client.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400 shrink-0" /><span className="text-sm text-slate-700">{client.phone}</span></div>}
            {client.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400 shrink-0" /><span className="text-sm text-slate-700">{client.email}</span></div>}
            {client.nationalId && <div className="text-sm text-slate-500">الهوية: {client.nationalId}</div>}
            {client.notes && <div className="text-sm text-slate-500 pt-2 border-t border-slate-50">{client.notes}</div>}
          </CardContent>
        </Card>

        {summary && (
          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="pb-3 border-b border-slate-100"><CardTitle className="text-sm font-semibold text-navy">ملخص الحساب</CardTitle></CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center"><p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p><p className="text-xs text-slate-400 mt-0.5">المحصّل</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.totalDue)}</p><p className="text-xs text-slate-400 mt-0.5">المستحق</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-primary">{summary.activeCases}</p><p className="text-xs text-slate-400 mt-0.5">قضايا نشطة</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-slate-700">{summary.totalCases}</p><p className="text-xs text-slate-400 mt-0.5">إجمالي القضايا</p></div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />القضايا</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!cases?.length ? <p className="p-5 text-sm text-slate-400 text-center">لا توجد قضايا</p> : (
            <div className="divide-y divide-slate-50">
              {cases.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
                  <div>
                    <Link href={`/cases/${c.id}`}><p className="text-sm font-semibold text-primary hover:underline cursor-pointer">{c.caseNumber}</p></Link>
                    <p className="text-xs text-slate-400 mt-0.5">{c.court ?? "—"}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{caseStatusLabels[c.status] ?? c.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />سجل المدفوعات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!payments?.length ? <p className="p-5 text-sm text-slate-400 text-center">لا توجد مدفوعات</p> : (
            <div className="divide-y divide-slate-50">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("ar-SA") : "—"}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${paymentStatusCls[p.status] ?? "bg-slate-100 text-slate-600"}`}>{paymentStatusLabel[p.status] ?? p.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
