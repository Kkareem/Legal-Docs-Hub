import { useState } from "react";
import { useListClients, useCreateClient, useDeleteClient, getListClientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Phone, Mail, Trash2, Eye } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; variant: any }> = {
  new: { label: "جديد", variant: "secondary" },
  active: { label: "نشط", variant: "default" },
  pending: { label: "معلق", variant: "outline" },
  completed: { label: "مكتمل", variant: "secondary" },
  closed: { label: "مغلق", variant: "destructive" },
};

const STATUS_OPTIONS = ["new", "active", "pending", "completed", "closed"];

export default function Clients() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", nationalId: "", serviceType: "", status: "new" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: clients, isLoading } = useListClients({ status: statusFilter === "all" ? undefined : statusFilter, search: search || undefined });
  const createMutation = useCreateClient();
  const deleteMutation = useDeleteClient();

  const handleCreate = async () => {
    if (!form.name.trim()) { toast({ title: "اسم الموكل مطلوب", variant: "destructive" }); return; }
    await createMutation.mutateAsync({ data: form as any });
    qc.invalidateQueries({ queryKey: getListClientsQueryKey() });
    setShowCreate(false);
    setForm({ name: "", phone: "", email: "", nationalId: "", serviceType: "", status: "new" });
    toast({ title: "تم إضافة الموكل بنجاح" });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الموكل "${name}"؟`)) return;
    await deleteMutation.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListClientsQueryKey() });
    toast({ title: "تم حذف الموكل" });
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">الموكلون</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clients?.length ?? 0} موكل مسجل</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة موكل
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pr-9" placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{statusConfig[s]?.label ?? s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
        </div>
      ) : !clients?.length ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400 text-lg font-medium">لا يوجد موكلون</p>
            <p className="text-slate-400 text-sm mt-1">أضف موكلك الأول للبدء</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-right px-5 py-3 font-medium text-slate-500">الاسم</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">الهاتف</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">نوع الخدمة</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">الحالة</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients.map((client: any) => {
                const sc = statusConfig[client.status] ?? { label: client.status, variant: "secondary" };
                return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{client.name}</p>
                      {client.email && <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</p>}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {client.phone ? <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{client.phone}</span> : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{client.serviceType ?? "—"}</td>
                    <td className="px-5 py-4"><Badge variant={sc.variant}>{sc.label}</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link href={`/clients/${client.id}`}>
                          <Button size="icon" variant="ghost" className="w-8 h-8"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(client.id, client.name)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة موكل جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>الاسم *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>رقم الهاتف</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>رقم الهوية</Label><Input value={form.nationalId} onChange={e => setForm(f => ({ ...f, nationalId: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>نوع الخدمة</Label><Input value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{statusConfig[s]?.label}</SelectItem>)}</SelectContent>
              </Select>
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
