import { useState } from "react";
import {
  useListDocuments, useCreateDocument, useDeleteDocument,
  getListDocumentsQueryKey, useListCases, useListClients
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, FileText, FileCheck, FileBadge, ScrollText, IdCard, File, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const docTypeConfig: Record<string, { label: string; icon: any; cls: string }> = {
  contract:         { label: "عقد",         icon: FileText,  cls: "bg-blue-50 text-blue-600" },
  ruling:           { label: "حكم قضائي",   icon: FileCheck, cls: "bg-purple-50 text-purple-600" },
  memo:             { label: "مذكرة",        icon: ScrollText,cls: "bg-amber-50 text-amber-600" },
  power_of_attorney:{ label: "وكالة",        icon: FileBadge, cls: "bg-green-50 text-green-600" },
  id_copy:          { label: "هوية",         icon: IdCard,    cls: "bg-slate-50 text-slate-600" },
  other:            { label: "أخرى",         icon: File,      cls: "bg-rose-50 text-rose-600" },
};

const DOC_TYPES = Object.keys(docTypeConfig);

const initForm = { fileName: "", fileUrl: "", docType: "other", caseId: "", clientId: "", notes: "", isOriginal: false };

export default function Documents() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initForm);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: docs, isLoading } = useListDocuments({ docType: typeFilter === "all" ? undefined : typeFilter });
  const { data: cases } = useListCases();
  const { data: clients } = useListClients();
  const createMutation = useCreateDocument();
  const deleteMutation = useDeleteDocument();

  const filtered = docs?.filter(d =>
    !search || d.fileName.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleCreate = async () => {
    if (!form.fileName.trim() || !form.fileUrl.trim()) {
      toast({ title: "اسم الملف والرابط مطلوبان", variant: "destructive" });
      return;
    }
    await createMutation.mutateAsync({
      data: {
        fileName: form.fileName,
        fileUrl: form.fileUrl,
        docType: form.docType as any,
        caseId: form.caseId ? parseInt(form.caseId) : undefined,
        clientId: form.clientId ? parseInt(form.clientId) : undefined,
        notes: form.notes || undefined,
        isOriginal: form.isOriginal,
        uploadedBy: user?.id,
      } as any,
    });
    qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    setShowCreate(false);
    setForm(initForm);
    toast({ title: "تم إضافة المستند بنجاح" });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`حذف "${name}"؟`)) return;
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    toast({ title: "تم حذف المستند" });
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">المستندات</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} مستند</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة مستند
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pr-9" placeholder="بحث في المستندات..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="نوع المستند" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{docTypeConfig[t].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-400 text-lg font-medium">لا توجد مستندات</p>
            <p className="text-slate-400 text-sm mt-1">أضف مستنداً بالضغط على الزر أعلاه</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d: any) => {
            const cfg = docTypeConfig[d.docType] ?? docTypeConfig.other;
            const Icon = cfg.icon;
            const caseItem = cases?.find((c: any) => c.id === d.caseId);
            const client = clients?.find((c: any) => c.id === d.clientId);
            return (
              <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${cfg.cls}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.fileUrl && (
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-primary">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      size="icon" variant="ghost"
                      className="w-8 h-8 text-slate-400 hover:text-red-500"
                      onClick={() => handleDelete(d.id, d.fileName)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-snug mb-1 truncate">{d.fileName}</p>
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 mb-2">{cfg.label}</span>
                <div className="space-y-1 text-xs text-slate-400">
                  {caseItem && <p>القضية: <span className="text-primary font-medium">{caseItem.caseNumber}</span></p>}
                  {client && <p>الموكل: {client.name}</p>}
                  {d.isOriginal && <p className="text-amber-500 font-medium">نسخة أصلية</p>}
                  {d.uploaderName && <p>رُفع بواسطة: {d.uploaderName}</p>}
                  <p>{new Date(d.createdAt).toLocaleDateString("ar-SA", { dateStyle: "medium" })}</p>
                </div>
                {d.notes && <p className="mt-2 text-xs text-slate-500 line-clamp-2 border-t border-slate-50 pt-2">{d.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>إضافة مستند جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>اسم الملف *</Label>
                <Input placeholder="مثال: عقد التوكيل - أحمد علي.pdf" value={form.fileName} onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>رابط الملف *</Label>
                <Input placeholder="https://..." value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>نوع المستند</Label>
                <Select value={form.docType} onValueChange={v => setForm(f => ({ ...f, docType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{docTypeConfig[t].label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الموكل</Label>
                <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الموكل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون</SelectItem>
                    {clients?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>القضية</Label>
                <Select value={form.caseId} onValueChange={v => setForm(f => ({ ...f, caseId: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر القضية" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون</SelectItem>
                    {cases?.filter((c: any) => !form.clientId || c.clientId === parseInt(form.clientId)).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.caseNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>ملاحظات</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isOriginal" checked={form.isOriginal} onChange={e => setForm(f => ({ ...f, isOriginal: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <Label htmlFor="isOriginal" className="cursor-pointer">نسخة أصلية</Label>
              </div>
            </div>
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
