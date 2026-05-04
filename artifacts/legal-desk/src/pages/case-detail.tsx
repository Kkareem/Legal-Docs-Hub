import { useState } from "react";
import { Link } from "wouter";
import {
  useGetCase, useListHearings, useListTasks, useListDocuments,
  useUpdateCase, useCreateDocument, useDeleteDocument,
  getGetCaseQueryKey, getListDocumentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowRight, Calendar, CheckSquare, FileText, User, Scale, Plus, Trash2, ExternalLink, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const statusCls: Record<string, string> = {
  new: "bg-slate-100 text-slate-600", active: "bg-blue-100 text-blue-700",
  upcoming_hearing: "bg-amber-100 text-amber-700", verdict: "bg-purple-100 text-purple-700",
  adjourned: "bg-orange-100 text-orange-700", closed: "bg-red-100 text-red-600",
};
const statusLabel: Record<string, string> = {
  new: "جديد", active: "نشط", upcoming_hearing: "جلسة قادمة",
  verdict: "حكم", adjourned: "مؤجل", closed: "مغلق"
};
const taskPriorityCls: Record<string, string> = {
  low: "text-slate-400", medium: "text-blue-500", high: "text-amber-500", urgent: "text-red-600"
};
const docTypeLabel: Record<string, string> = {
  contract: "عقد", ruling: "حكم", memo: "مذكرة",
  power_of_attorney: "وكالة", id_copy: "هوية", other: "أخرى"
};
const DOC_TYPES = Object.keys(docTypeLabel);

const CASE_STATUSES = Object.keys(statusLabel);

interface Props { id: string }

export default function CaseDetail({ id }: Props) {
  const caseId = parseInt(id);
  const { data: caseItem, isLoading } = useGetCase(caseId);
  const { data: hearings } = useListHearings({ caseId });
  const { data: tasks } = useListTasks({ caseId });
  const { data: docs } = useListDocuments({ caseId });
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const updateMutation = useUpdateCase();
  const createDocMutation = useCreateDocument();
  const deleteDocMutation = useDeleteDocument();

  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docForm, setDocForm] = useState({ fileName: "", fileUrl: "", docType: "other", notes: "", isOriginal: false });

  if (isLoading) return <div className="p-6 flex items-center justify-center min-h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!caseItem) return <div className="p-6"><p className="text-slate-500">القضية غير موجودة</p></div>;

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === caseItem.status) { setEditingStatus(false); return; }
    await updateMutation.mutateAsync({ id: caseId, data: { status: newStatus as any } });
    qc.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
    setEditingStatus(false);
    toast({ title: "تم تحديث حالة القضية" });
  };

  const handleAddDoc = async () => {
    if (!docForm.fileName.trim() || !docForm.fileUrl.trim()) {
      toast({ title: "اسم الملف والرابط مطلوبان", variant: "destructive" }); return;
    }
    await createDocMutation.mutateAsync({
      data: {
        fileName: docForm.fileName,
        fileUrl: docForm.fileUrl,
        docType: docForm.docType as any,
        caseId,
        notes: docForm.notes || undefined,
        isOriginal: docForm.isOriginal,
        uploadedBy: user?.id,
      } as any,
    });
    qc.invalidateQueries({ queryKey: getListDocumentsQueryKey({ caseId }) });
    setShowAddDoc(false);
    setDocForm({ fileName: "", fileUrl: "", docType: "other", notes: "", isOriginal: false });
    toast({ title: "تم إضافة المستند" });
  };

  const handleDeleteDoc = async (docId: number, name: string) => {
    if (!confirm(`حذف "${name}"؟`)) return;
    await deleteDocMutation.mutateAsync({ id: docId });
    qc.invalidateQueries({ queryKey: getListDocumentsQueryKey({ caseId }) });
    toast({ title: "تم حذف المستند" });
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/cases"><Button size="icon" variant="ghost"><ArrowRight className="w-4 h-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-navy">{caseItem.caseNumber}</h1>
            {editingStatus ? (
              <div className="flex items-center gap-2">
                <Select value={newStatus || caseItem.status} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CASE_STATUSES.map(s => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 text-xs" onClick={handleStatusChange} disabled={updateMutation.isPending}>حفظ</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingStatus(false)}>إلغاء</Button>
              </div>
            ) : (
              <button
                onClick={() => { setNewStatus(caseItem.status); setEditingStatus(true); }}
                className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity ${statusCls[caseItem.status] ?? "bg-slate-100"}`}
              >
                {statusLabel[caseItem.status] ?? caseItem.status}
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
          {caseItem.courtCaseNumber && <p className="text-sm text-slate-500 mt-0.5">رقم المحكمة: {caseItem.courtCaseNumber}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex gap-2 text-sm">
              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div><p className="text-xs text-slate-400">الموكل</p><p className="font-medium text-slate-800">{(caseItem as any).clientName ?? `#${caseItem.clientId}`}</p></div>
            </div>
            <div className="flex gap-2 text-sm">
              <Scale className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div><p className="text-xs text-slate-400">المحكمة</p><p className="font-medium text-slate-800">{caseItem.court ?? "—"}</p></div>
            </div>
            {(caseItem as any).leadLawyerName && (
              <div className="flex gap-2 text-sm">
                <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div><p className="text-xs text-slate-400">المحامي المسؤول</p><p className="font-medium text-slate-800">{(caseItem as any).leadLawyerName}</p></div>
              </div>
            )}
            {caseItem.opposingParty && (
              <div className="flex gap-2 text-sm">
                <User className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                <div><p className="text-xs text-slate-400">الطرف الخصم</p><p className="font-medium text-slate-800">{caseItem.opposingParty}</p></div>
              </div>
            )}
            {caseItem.description && <div className="pt-3 border-t border-slate-100"><p className="text-sm text-slate-600 leading-relaxed">{caseItem.description}</p></div>}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />الجلسات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!hearings?.length ? <p className="p-4 text-sm text-slate-400 text-center">لا توجد جلسات</p> : (
              <div className="divide-y divide-slate-50">
                {hearings.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{h.court}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(h.datetime).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{h.status === "scheduled" ? "مجدولة" : h.status === "completed" ? "منعقدت" : h.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="w-4 h-4 text-primary" />المهام المرتبطة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!tasks?.length ? <p className="p-4 text-sm text-slate-400 text-center">لا توجد مهام</p> : (
            <div className="divide-y divide-slate-50">
              {tasks.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div>
                    <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-slate-400" : "text-slate-800"}`}>{t.title}</p>
                    {t.assigneeName && <p className="text-xs text-slate-400 mt-0.5">{t.assigneeName}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {t.dueDate && <span className="text-xs text-slate-400">{new Date(t.dueDate).toLocaleDateString("ar-SA")}</span>}
                    <span className={`text-xs font-medium ${taskPriorityCls[t.priority]}`}>
                      {t.priority === "urgent" ? "عاجلة" : t.priority === "high" ? "عالية" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />المستندات</CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowAddDoc(true)}>
              <Plus className="w-3.5 h-3.5" /> إضافة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!docs?.length ? (
            <div className="p-5 text-center">
              <p className="text-sm text-slate-400">لا توجد مستندات</p>
              <Button size="sm" variant="ghost" className="mt-2 text-xs text-primary" onClick={() => setShowAddDoc(true)}>
                + إضافة مستند
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {docs.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 group">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{d.fileName}</p>
                    <p className="text-xs text-slate-400">{docTypeLabel[d.docType] ?? d.docType}{d.isOriginal ? " · أصلي" : ""}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.fileUrl && (
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-400 hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></Button>
                      </a>
                    )}
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-400 hover:text-red-500" onClick={() => handleDeleteDoc(d.id, d.fileName)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDoc} onOpenChange={setShowAddDoc}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة مستند للقضية</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم الملف *</Label>
              <Input value={docForm.fileName} onChange={e => setDocForm(f => ({ ...f, fileName: e.target.value }))} placeholder="مثال: عقد التوكيل.pdf" />
            </div>
            <div className="space-y-1.5">
              <Label>رابط الملف *</Label>
              <Input value={docForm.fileUrl} onChange={e => setDocForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <Select value={docForm.docType} onValueChange={v => setDocForm(f => ({ ...f, docType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{docTypeLabel[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Input value={docForm.notes} onChange={e => setDocForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="docOriginal" checked={docForm.isOriginal} onChange={e => setDocForm(f => ({ ...f, isOriginal: e.target.checked }))} className="w-4 h-4 accent-primary" />
              <Label htmlFor="docOriginal" className="cursor-pointer">نسخة أصلية</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDoc(false)}>إلغاء</Button>
            <Button onClick={handleAddDoc} disabled={createDocMutation.isPending}>{createDocMutation.isPending ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
