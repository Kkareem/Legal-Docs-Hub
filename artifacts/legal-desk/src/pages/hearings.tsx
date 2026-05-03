import { useState } from "react";
import { useListHearings, useCreateHearing, useUpdateHearing, useDeleteHearing, getListHearingsQueryKey, useListCases, useListUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; cls: string }> = {
  scheduled:  { label: "مجدولة",   cls: "bg-blue-100 text-blue-700" },
  completed:  { label: "منعقدت",   cls: "bg-green-100 text-green-700" },
  adjourned:  { label: "مؤجلة",    cls: "bg-amber-100 text-amber-700" },
  cancelled:  { label: "ملغاة",    cls: "bg-red-100 text-red-600" },
};
const typeConfig: Record<string, string> = { session: "جلسة", consultation: "استشارة", deadline: "موعد نهائي", other: "أخرى" };
const STATUSES = Object.keys(statusConfig);
const TYPES = Object.keys(typeConfig);

export default function Hearings() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ caseId: "", datetime: "", court: "", type: "session", assignedLawyer: "", status: "scheduled", notes: "" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: hearings, isLoading } = useListHearings({ status: statusFilter === "all" ? undefined : statusFilter });
  const { data: cases } = useListCases();
  const { data: users } = useListUsers();
  const createMutation = useCreateHearing();
  const updateMutation = useUpdateHearing();
  const deleteMutation = useDeleteHearing();

  const handleCreate = async () => {
    if (!form.caseId || !form.datetime) { toast({ title: "القضية والتاريخ مطلوبان", variant: "destructive" }); return; }
    await createMutation.mutateAsync({ data: { ...form, caseId: parseInt(form.caseId), assignedLawyer: form.assignedLawyer ? parseInt(form.assignedLawyer) : undefined } as any });
    qc.invalidateQueries({ queryKey: getListHearingsQueryKey() });
    setShowCreate(false);
    setForm({ caseId: "", datetime: "", court: "", type: "session", assignedLawyer: "", status: "scheduled", notes: "" });
    toast({ title: "تم إضافة الجلسة" });
  };

  const grouped = hearings?.reduce((acc: Record<string, any[]>, h: any) => {
    const date = new Date(h.datetime).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    acc[date] = acc[date] ?? [];
    acc[date].push(h);
    return acc;
  }, {}) ?? {};

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">الجلسات</h1>
          <p className="text-sm text-slate-500 mt-0.5">{hearings?.length ?? 0} جلسة</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الجلسات</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> إضافة جلسة</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : !hearings?.length ? (
        <Card className="border-dashed"><CardContent className="flex items-center justify-center py-16"><p className="text-slate-400 text-lg">لا توجد جلسات</p></CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayHearings]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />{date}
              </h3>
              <div className="space-y-2">
                {(dayHearings as any[]).map((h: any) => {
                  const sc = statusConfig[h.status] ?? { label: h.status, cls: "bg-slate-100 text-slate-600" };
                  const isUpcoming = new Date(h.datetime) > new Date();
                  return (
                    <div key={h.id} className={`flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm ${isUpcoming ? "border-primary/20" : "border-slate-200"}`}>
                      <div className="text-right shrink-0 w-16">
                        <p className="text-lg font-bold text-primary flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(h.datetime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">{h.court ?? "محكمة غير محددة"}</p>
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{typeConfig[h.type] ?? h.type}</span>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-slate-400">
                          {h.caseNumber && <span className="text-primary font-medium">#{h.caseNumber}</span>}
                          {h.assignedLawyerName && <span>{h.assignedLawyerName}</span>}
                        </div>
                        {h.notes && <p className="text-xs text-slate-500 mt-1 truncate">{h.notes}</p>}
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${sc.cls}`}>{sc.label}</span>
                      <div className="flex gap-1">
                        {h.status === "scheduled" && (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={async () => { await updateMutation.mutateAsync({ id: h.id, data: { status: "completed" } }); qc.invalidateQueries({ queryKey: getListHearingsQueryKey() }); }}>منعقدت</Button>
                        )}
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={async () => { if (confirm("حذف الجلسة؟")) { await deleteMutation.mutateAsync({ id: h.id }); qc.invalidateQueries({ queryKey: getListHearingsQueryKey() }); } }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة جلسة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>القضية *</Label>
              <Select value={form.caseId} onValueChange={v => setForm(f => ({ ...f, caseId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر القضية" /></SelectTrigger>
                <SelectContent>{cases?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.caseNumber} — {c.clientName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>التاريخ والوقت *</Label><Input type="datetime-local" value={form.datetime} onChange={e => setForm(f => ({ ...f, datetime: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>المحكمة</Label><Input value={form.court} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>النوع</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{typeConfig[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>المحامي</Label>
                <Select value={form.assignedLawyer} onValueChange={v => setForm(f => ({ ...f, assignedLawyer: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>{users?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
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
