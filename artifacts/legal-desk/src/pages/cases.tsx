import { useState } from "react";
import { useListCases, useCreateCase, useDeleteCase, getListCasesQueryKey, useListClients, useListUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; variant: any; cls: string }> = {
  new:              { label: "جديد",         variant: "secondary", cls: "bg-slate-100 text-slate-600" },
  active:           { label: "نشط",          variant: "default",   cls: "bg-blue-100 text-blue-700" },
  upcoming_hearing: { label: "جلسة قادمة",   variant: "default",   cls: "bg-amber-100 text-amber-700" },
  verdict:          { label: "صدر حكم",      variant: "default",   cls: "bg-purple-100 text-purple-700" },
  adjourned:        { label: "مؤجل",         variant: "outline",   cls: "bg-orange-100 text-orange-700" },
  closed:           { label: "مغلق",         variant: "destructive", cls: "bg-red-100 text-red-600" },
};

const typeConfig: Record<string, string> = {
  civil: "مدني", criminal: "جنائي", commercial: "تجاري", family: "أسري", labor: "عمالي", administrative: "إداري", other: "أخرى",
};

const TYPES = Object.keys(typeConfig);
const STATUSES = Object.keys(statusConfig);

export default function Cases() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ caseNumber: "", courtCaseNumber: "", type: "civil", court: "", division: "", clientId: "", leadLawyerId: "", status: "new", opposingParty: "", description: "" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: cases, isLoading } = useListCases({
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    search: search || undefined,
  });
  const { data: clients } = useListClients();
  const { data: users } = useListUsers();
  const createMutation = useCreateCase();
  const deleteMutation = useDeleteCase();

  const handleCreate = async () => {
    if (!form.caseNumber.trim() || !form.clientId) { toast({ title: "رقم القضية والموكل مطلوبان", variant: "destructive" }); return; }
    await createMutation.mutateAsync({ data: { ...form, clientId: parseInt(form.clientId), leadLawyerId: form.leadLawyerId ? parseInt(form.leadLawyerId) : undefined } as any });
    qc.invalidateQueries({ queryKey: getListCasesQueryKey() });
    setShowCreate(false);
    toast({ title: "تم إضافة القضية بنجاح" });
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">القضايا</h1>
          <p className="text-sm text-slate-500 mt-0.5">{cases?.length ?? 0} قضية</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> إضافة قضية</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pr-9" placeholder="بحث برقم القضية أو المحكمة..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            {TYPES.map(t => <SelectItem key={t} value={t}>{typeConfig[t]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : !cases?.length ? (
        <Card className="border-dashed border-slate-300"><CardContent className="flex flex-col items-center justify-center py-16"><p className="text-slate-400 text-lg font-medium">لا توجد قضايا</p></CardContent></Card>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-right px-5 py-3 font-medium text-slate-500">رقم القضية</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">الموكل</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">المحكمة</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">النوع</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">الحالة</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">المحامي</th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cases.map((c: any) => {
                const sc = statusConfig[c.status] ?? { label: c.status, cls: "bg-slate-100 text-slate-600" };
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{c.caseNumber}</p>
                      {c.courtCaseNumber && <p className="text-xs text-slate-400 mt-0.5">{c.courtCaseNumber}</p>}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{c.clientName ?? `#${c.clientId}`}</td>
                    <td className="px-5 py-4 text-slate-600">{c.court ?? "—"}</td>
                    <td className="px-5 py-4"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{typeConfig[c.type] ?? c.type}</span></td>
                    <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.cls}`}>{sc.label}</span></td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{c.leadLawyerName ?? "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 justify-end">
                        <Link href={`/cases/${c.id}`}><Button size="icon" variant="ghost" className="w-8 h-8"><Eye className="w-4 h-4" /></Button></Link>
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={async () => { if (confirm(`حذف القضية "${c.caseNumber}"؟`)) { await deleteMutation.mutateAsync({ id: c.id }); qc.invalidateQueries({ queryKey: getListCasesQueryKey() }); } }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>إضافة قضية جديدة</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>رقم القضية *</Label><Input value={form.caseNumber} onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>رقم القضية بالمحكمة</Label><Input value={form.courtCaseNumber} onChange={e => setForm(f => ({ ...f, courtCaseNumber: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2">
              <Label>الموكل *</Label>
              <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الموكل" /></SelectTrigger>
                <SelectContent>{clients?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>نوع القضية</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{typeConfig[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>المحكمة</Label><Input value={form.court} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2">
              <Label>المحامي المسؤول</Label>
              <Select value={form.leadLawyerId} onValueChange={v => setForm(f => ({ ...f, leadLawyerId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المحامي" /></SelectTrigger>
                <SelectContent>{users?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>الطرف الخصم</Label><Input value={form.opposingParty} onChange={e => setForm(f => ({ ...f, opposingParty: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
