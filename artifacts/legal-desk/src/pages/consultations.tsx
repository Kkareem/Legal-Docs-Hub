import { useState } from "react";
import { useListConsultations, useCreateConsultation, useUpdateConsultation, getListConsultationsQueryKey, useListClients, useListUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageSquare, Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending:      { label: "معلقة",       cls: "bg-amber-100 text-amber-700" },
  under_review: { label: "تحت المراجعة", cls: "bg-blue-100 text-blue-700" },
  responded:    { label: "تم الرد",      cls: "bg-green-100 text-green-700" },
  scheduled:    { label: "مجدولة",      cls: "bg-purple-100 text-purple-700" },
  closed:       { label: "مغلقة",       cls: "bg-slate-100 text-slate-500" },
};
const paymentStatusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: "معلق",    cls: "bg-amber-100 text-amber-700" },
  paid:    { label: "مدفوع",  cls: "bg-green-100 text-green-700" },
  waived:  { label: "معفو",   cls: "bg-slate-100 text-slate-500" },
};
const STATUSES = Object.keys(statusConfig);

export default function Consultations() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [respondId, setRespondId] = useState<number | null>(null);
  const [response, setResponse] = useState("");
  const [form, setForm] = useState({ clientId: "", summary: "", fee: "", paymentStatus: "pending", status: "pending", assignedTo: "" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: consultations, isLoading } = useListConsultations({ status: statusFilter === "all" ? undefined : statusFilter });
  const { data: clients } = useListClients();
  const { data: users } = useListUsers();
  const createMutation = useCreateConsultation();
  const updateMutation = useUpdateConsultation();

  const handleCreate = async () => {
    if (!form.clientId || !form.summary.trim()) { toast({ title: "الموكل والملخص مطلوبان", variant: "destructive" }); return; }
    await createMutation.mutateAsync({ data: { ...form, clientId: parseInt(form.clientId), fee: form.fee ? parseFloat(form.fee) : undefined, assignedTo: form.assignedTo ? parseInt(form.assignedTo) : undefined } as any });
    qc.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
    setShowCreate(false);
    setForm({ clientId: "", summary: "", fee: "", paymentStatus: "pending", status: "pending", assignedTo: "" });
    toast({ title: "تم إضافة الاستشارة" });
  };

  const handleRespond = async () => {
    if (!respondId || !response.trim()) return;
    await updateMutation.mutateAsync({ id: respondId, data: { response, status: "responded" } });
    qc.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
    setRespondId(null);
    setResponse("");
    toast({ title: "تم إرسال الرد" });
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">الاستشارات</h1>
          <p className="text-sm text-slate-500 mt-0.5">{consultations?.length ?? 0} استشارة</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الاستشارات</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> استشارة جديدة</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : !consultations?.length ? (
        <Card className="border-dashed"><CardContent className="flex items-center justify-center py-16"><p className="text-slate-400 text-lg">لا توجد استشارات</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {consultations.map((c: any) => {
            const sc = statusConfig[c.status] ?? { label: c.status, cls: "bg-slate-100 text-slate-600" };
            const pc = paymentStatusConfig[c.paymentStatus] ?? { label: c.paymentStatus, cls: "bg-slate-100 text-slate-600" };
            return (
              <div key={c.id} className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><MessageSquare className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold text-slate-800">{c.clientName ?? `#${c.clientId}`}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString("ar-SA")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${pc.cls}`}>{pc.label}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed pr-11">{c.summary}</p>
                {c.response && (
                  <div className="pr-11 pt-2 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-400 mb-1">الرد:</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{c.response}</p>
                  </div>
                )}
                {c.status !== "responded" && c.status !== "closed" && (
                  <div className="pr-11 flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setRespondId(c.id)}>
                      <Reply className="w-3.5 h-3.5" /> رد على الاستشارة
                    </Button>
                    {c.fee && <span className="text-xs text-slate-500 self-center">الرسوم: {c.fee} ريال</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!respondId} onOpenChange={() => setRespondId(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>الرد على الاستشارة</DialogTitle></DialogHeader>
          <div className="space-y-1.5"><Label>نص الرد</Label><Textarea rows={5} value={response} onChange={e => setResponse(e.target.value)} placeholder="أدخل ردك القانوني هنا..." /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondId(null)}>إلغاء</Button>
            <Button onClick={handleRespond} disabled={updateMutation.isPending}>{updateMutation.isPending ? "جاري الإرسال..." : "إرسال الرد"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>استشارة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>الموكل *</Label>
              <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الموكل" /></SelectTrigger>
                <SelectContent>{clients?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>ملخص الاستشارة *</Label><Textarea rows={4} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>الرسوم (ريال)</Label><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>حالة الدفع</Label>
                <Select value={form.paymentStatus} onValueChange={v => setForm(f => ({ ...f, paymentStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pending">معلق</SelectItem><SelectItem value="paid">مدفوع</SelectItem><SelectItem value="waived">معفو</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>المسند إليه</Label>
              <Select value={form.assignedTo} onValueChange={v => setForm(f => ({ ...f, assignedTo: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المحامي" /></SelectTrigger>
                <SelectContent>{users?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
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
