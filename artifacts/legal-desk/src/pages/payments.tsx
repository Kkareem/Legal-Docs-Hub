import { useState } from "react";
import { useListPayments, useCreatePayment, useUpdatePayment, getListPaymentsQueryKey, useGetPaymentSummary, useListClients, useListCases } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: "معلق",    cls: "bg-amber-100 text-amber-700" },
  paid:    { label: "مدفوع",  cls: "bg-green-100 text-green-700" },
  partial: { label: "جزئي",   cls: "bg-blue-100 text-blue-700" },
  overdue: { label: "متأخر",  cls: "bg-red-100 text-red-700" },
};
const typeConfig: Record<string, string> = {
  case_fee: "رسوم قضية", consultation_fee: "رسوم استشارة", retainer: "أتعاب", expense: "مصروفات", other: "أخرى",
};
const STATUSES = Object.keys(statusConfig);
const TYPES = Object.keys(typeConfig);

const formatCurrency = (n: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);

export default function Payments() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ clientId: "", caseId: "", amount: "", type: "case_fee", status: "pending", notes: "" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: payments, isLoading } = useListPayments({ status: statusFilter === "all" ? undefined : statusFilter });
  const { data: summary } = useGetPaymentSummary();
  const { data: clients } = useListClients();
  const { data: cases } = useListCases();
  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();

  const handleCreate = async () => {
    if (!form.clientId || !form.amount) { toast({ title: "الموكل والمبلغ مطلوبان", variant: "destructive" }); return; }
    await createMutation.mutateAsync({ data: { ...form, clientId: parseInt(form.clientId), caseId: form.caseId ? parseInt(form.caseId) : undefined, amount: parseFloat(form.amount) } as any });
    qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
    setShowCreate(false);
    setForm({ clientId: "", caseId: "", amount: "", type: "case_fee", status: "pending", notes: "" });
    toast({ title: "تم إضافة الدفعة" });
  };

  const markPaid = async (id: number) => {
    await updateMutation.mutateAsync({ id, data: { status: "paid", paidAt: new Date().toISOString() } });
    qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">المدفوعات</h1>
          <p className="text-sm text-slate-500 mt-0.5">سجل المعاملات المالية</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> إضافة دفعة</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">المحصّل</p><p className="text-2xl font-bold text-green-700">{formatCurrency(summary.totalCollected)}</p></div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-amber-600 font-medium uppercase tracking-wider mb-1">معلق</p><p className="text-2xl font-bold text-amber-700">{formatCurrency(summary.totalPending)}</p></div>
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-red-600 font-medium uppercase tracking-wider mb-1">متأخر</p><p className="text-2xl font-bold text-red-700">{formatCurrency(summary.totalOverdue)}</p></div>
                <TrendingDown className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : !payments?.length ? (
        <Card className="border-dashed"><CardContent className="flex items-center justify-center py-16"><p className="text-slate-400 text-lg">لا توجد مدفوعات</p></CardContent></Card>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-right px-5 py-3 font-medium text-slate-500">الموكل</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">القضية</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">النوع</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">المبلغ</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">الحالة</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">تاريخ الدفع</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((p: any) => {
                const sc = statusConfig[p.status] ?? { label: p.status, cls: "bg-slate-100 text-slate-600" };
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800">{p.clientName ?? `#${p.clientId}`}</td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{p.caseNumber ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{typeConfig[p.type] ?? p.type}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.cls}`}>{sc.label}</span></td>
                    <td className="px-5 py-4 text-slate-400 text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="px-5 py-4">
                      {p.status !== "paid" && (
                        <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-200 hover:bg-green-50" onClick={() => markPaid(p.id)}>تحصيل</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة دفعة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>الموكل *</Label>
              <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الموكل" /></SelectTrigger>
                <SelectContent>{clients?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>القضية</Label>
              <Select value={form.caseId} onValueChange={v => setForm(f => ({ ...f, caseId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر القضية" /></SelectTrigger>
                <SelectContent>{cases?.filter((c: any) => !form.clientId || c.clientId === parseInt(form.clientId)).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.caseNumber}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>المبلغ (ريال) *</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>النوع</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{typeConfig[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
