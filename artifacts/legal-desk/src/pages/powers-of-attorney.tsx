import { useState } from "react";
import { useListPowersOfAttorney, useCreatePowerOfAttorney, useUpdatePowerOfAttorney, getListPowersOfAttorneyQueryKey, useListClients, useListCases, useListUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; cls: string }> = {
  in_office:   { label: "بالمكتب",     cls: "bg-green-100 text-green-700" },
  with_lawyer: { label: "مع المحامي",  cls: "bg-blue-100 text-blue-700" },
  used:        { label: "مستخدمة",     cls: "bg-purple-100 text-purple-700" },
  returned:    { label: "مُعادة",      cls: "bg-slate-100 text-slate-500" },
  overdue:     { label: "متأخرة",      cls: "bg-red-100 text-red-700" },
};
const STATUSES = Object.keys(statusConfig);

export default function PowersOfAttorney() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ clientId: "", caseId: "", receivedBy: "", handedBy: "", receivedAt: "", returnBy: "", status: "in_office", notes: "" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: poas, isLoading } = useListPowersOfAttorney({ status: statusFilter === "all" ? undefined : statusFilter });
  const { data: clients } = useListClients();
  const { data: cases } = useListCases();
  const { data: users } = useListUsers();
  const createMutation = useCreatePowerOfAttorney();
  const updateMutation = useUpdatePowerOfAttorney();

  const handleCreate = async () => {
    if (!form.clientId || !form.receivedBy || !form.receivedAt) { toast({ title: "الموكل والمستلم والتاريخ مطلوبة", variant: "destructive" }); return; }
    await createMutation.mutateAsync({ data: { ...form, clientId: parseInt(form.clientId), caseId: form.caseId ? parseInt(form.caseId) : undefined, receivedBy: parseInt(form.receivedBy), receivedAt: form.receivedAt, returnBy: form.returnBy || undefined } as any });
    qc.invalidateQueries({ queryKey: getListPowersOfAttorneyQueryKey() });
    setShowCreate(false);
    toast({ title: "تم إضافة الوكالة" });
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">الوكالات القانونية</h1>
          <p className="text-sm text-slate-500 mt-0.5">{poas?.length ?? 0} وكالة</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> إضافة وكالة</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : !poas?.length ? (
        <Card className="border-dashed"><CardContent className="flex items-center justify-center py-16"><p className="text-slate-400 text-lg">لا توجد وكالات مسجلة</p></CardContent></Card>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-right px-5 py-3 font-medium text-slate-500">الموكل</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">القضية</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">المستلم</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">تاريخ الاستلام</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">تاريخ الإعادة</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">الحالة</th>
                <th className="px-5 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {poas.map((p: any) => {
                const sc = statusConfig[p.status] ?? { label: p.status, cls: "bg-slate-100 text-slate-600" };
                const isOverdue = p.status === "overdue" || (p.returnBy && new Date(p.returnBy) < new Date() && p.status !== "returned");
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isOverdue ? "bg-red-50/40" : ""}`}>
                    <td className="px-5 py-4 font-medium text-slate-800">{p.clientName ?? `#${p.clientId}`}</td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{p.caseNumber ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{p.receivedByName ?? `#${p.receivedBy}`}</td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{new Date(p.receivedAt).toLocaleDateString("ar-SA")}</td>
                    <td className="px-5 py-4 text-xs">
                      {p.returnBy ? (
                        <span className={isOverdue ? "text-red-600 font-semibold flex items-center gap-1" : "text-slate-600"}>
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                          {new Date(p.returnBy).toLocaleDateString("ar-SA")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.cls}`}>{sc.label}</span></td>
                    <td className="px-5 py-4">
                      {p.status !== "returned" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={async () => { await updateMutation.mutateAsync({ id: p.id, data: { status: "returned", returnedAt: new Date().toISOString() } }); qc.invalidateQueries({ queryKey: getListPowersOfAttorneyQueryKey() }); toast({ title: "تم تسجيل إعادة الوكالة" }); }}>إعادة</Button>
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
          <DialogHeader><DialogTitle>إضافة وكالة قانونية</DialogTitle></DialogHeader>
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
                <SelectContent>{cases?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.caseNumber}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>المستلم *</Label>
              <Select value={form.receivedBy} onValueChange={v => setForm(f => ({ ...f, receivedBy: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المستلم" /></SelectTrigger>
                <SelectContent>{users?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>مسلّم من</Label><Input value={form.handedBy} onChange={e => setForm(f => ({ ...f, handedBy: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>تاريخ الاستلام *</Label><Input type="date" value={form.receivedAt} onChange={e => setForm(f => ({ ...f, receivedAt: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>تاريخ الإعادة</Label><Input type="date" value={form.returnBy} onChange={e => setForm(f => ({ ...f, returnBy: e.target.value }))} /></div>
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
