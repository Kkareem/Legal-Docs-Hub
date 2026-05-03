import { useState } from "react";
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask, getListTasksQueryKey, useListUsers, useListCases } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; cls: string }> = {
  new:          { label: "جديد",       cls: "bg-slate-100 text-slate-600" },
  in_progress:  { label: "قيد التنفيذ", cls: "bg-blue-100 text-blue-700" },
  done:         { label: "مكتمل",       cls: "bg-green-100 text-green-700" },
  needs_review: { label: "مراجعة",     cls: "bg-purple-100 text-purple-700" },
  overdue:      { label: "متأخر",       cls: "bg-red-100 text-red-700" },
  cancelled:    { label: "ملغى",        cls: "bg-slate-100 text-slate-400" },
};
const priorityConfig: Record<string, { label: string; cls: string }> = {
  low:    { label: "منخفضة", cls: "text-slate-500" },
  medium: { label: "متوسطة", cls: "text-blue-500" },
  high:   { label: "عالية",  cls: "text-amber-500" },
  urgent: { label: "عاجلة",  cls: "text-red-600 font-bold" },
};

const STATUSES = Object.keys(statusConfig);
const PRIORITIES = Object.keys(priorityConfig);

export default function Tasks() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", caseId: "", assignedTo: "", dueDate: "", priority: "medium", status: "new" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useListTasks({ status: statusFilter === "all" ? undefined : statusFilter, priority: priorityFilter === "all" ? undefined : priorityFilter });
  const { data: users } = useListUsers();
  const { data: cases } = useListCases();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const filtered = tasks?.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase())) ?? [];

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ title: "عنوان المهمة مطلوب", variant: "destructive" }); return; }
    await createMutation.mutateAsync({ data: { ...form, caseId: form.caseId ? parseInt(form.caseId) : undefined, assignedTo: form.assignedTo ? parseInt(form.assignedTo) : undefined, dueDate: form.dueDate || undefined } as any });
    qc.invalidateQueries({ queryKey: getListTasksQueryKey() });
    setShowCreate(false);
    setForm({ title: "", description: "", caseId: "", assignedTo: "", dueDate: "", priority: "medium", status: "new" });
    toast({ title: "تم إضافة المهمة" });
  };

  const markDone = async (id: number) => {
    await updateMutation.mutateAsync({ id, data: { status: "done" } });
    qc.invalidateQueries({ queryKey: getListTasksQueryKey() });
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">المهام</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} مهمة</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> إضافة مهمة</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pr-9" placeholder="بحث في المهام..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="الأولوية" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {PRIORITIES.map(p => <SelectItem key={p} value={p}>{priorityConfig[p].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : !filtered.length ? (
        <Card className="border-dashed"><CardContent className="flex items-center justify-center py-16"><p className="text-slate-400 text-lg">لا توجد مهام</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t: any) => {
            const sc = statusConfig[t.status] ?? { label: t.status, cls: "bg-slate-100 text-slate-600" };
            const pc = priorityConfig[t.priority] ?? { label: t.priority, cls: "text-slate-500" };
            const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done";
            return (
              <div key={t.id} className={`flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm hover:shadow transition-shadow ${isOverdue ? "border-red-200" : "border-slate-200"}`}>
                <button onClick={() => markDone(t.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${t.status === "done" ? "bg-green-500 border-green-500 text-white" : "border-slate-300 hover:border-primary"}`}>
                  {t.status === "done" && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-slate-400" : "text-slate-800"}`}>{t.title}</p>
                    <span className={`text-xs font-medium ${pc.cls}`}>{pc.label}</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-slate-400">
                    {t.assigneeName && <span>{t.assigneeName}</span>}
                    {t.caseNumber && <span className="text-primary font-medium">#{t.caseNumber}</span>}
                    {t.dueDate && <span className={isOverdue ? "text-red-500 font-medium" : ""}>{new Date(t.dueDate).toLocaleDateString("ar-SA")}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${sc.cls}`}>{sc.label}</span>
                <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600 shrink-0" onClick={async () => { if (confirm(`حذف المهمة؟`)) { await deleteMutation.mutateAsync({ id: t.id }); qc.invalidateQueries({ queryKey: getListTasksQueryKey() }); } }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة مهمة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>العنوان *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>الوصف</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>الأولوية</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{priorityConfig[p].label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>المسند إليه</Label>
              <Select value={form.assignedTo} onValueChange={v => setForm(f => ({ ...f, assignedTo: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المحامي" /></SelectTrigger>
                <SelectContent>{users?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>القضية</Label>
              <Select value={form.caseId} onValueChange={v => setForm(f => ({ ...f, caseId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر القضية" /></SelectTrigger>
                <SelectContent>{cases?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.caseNumber}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>تاريخ الاستحقاق</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
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
