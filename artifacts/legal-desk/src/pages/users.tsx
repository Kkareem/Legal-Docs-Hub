import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const roleConfig: Record<string, { label: string; cls: string }> = {
  owner:  { label: "مالك المكتب", cls: "bg-amber-100 text-amber-800" },
  lawyer: { label: "محامي",        cls: "bg-blue-100 text-blue-700" },
  admin:  { label: "مشرف",         cls: "bg-purple-100 text-purple-700" },
  client: { label: "موكل",          cls: "bg-slate-100 text-slate-600" },
};

export default function Users() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "lawyer" });
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user: me } = useAuth();

  const { data: users, isLoading } = useListUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) { toast({ title: "الاسم والبريد وكلمة المرور مطلوبة", variant: "destructive" }); return; }
    await createMutation.mutateAsync({ data: form as any });
    qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
    setShowCreate(false);
    setForm({ name: "", email: "", password: "", phone: "", role: "lawyer" });
    toast({ title: "تم إضافة عضو الفريق" });
  };

  const toggleActive = async (id: number, active: boolean) => {
    await updateMutation.mutateAsync({ id, data: { active: !active } });
    qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">فريق العمل</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users?.length ?? 0} عضو</p>
        </div>
        {me?.role === "owner" && (
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> إضافة عضو</Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !users?.length ? (
        <Card className="border-dashed"><CardContent className="flex items-center justify-center py-16"><p className="text-slate-400 text-lg">لا يوجد أعضاء</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u: any) => {
            const rc = roleConfig[u.role] ?? { label: u.role, cls: "bg-slate-100 text-slate-600" };
            return (
              <div key={u.id} className={`p-5 rounded-xl border bg-white shadow-sm transition-opacity ${!u.active ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                    {u.name.charAt(0)}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${rc.cls}`}>{rc.label}</span>
                </div>
                <h3 className="font-semibold text-slate-800 text-lg">{u.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                {u.phone && <p className="text-xs text-slate-400 mt-0.5">{u.phone}</p>}
                {me?.role === "owner" && u.id !== me.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Button size="sm" variant={u.active ? "outline" : "default"} className={`w-full gap-2 text-xs h-8 ${u.active ? "text-red-500 border-red-200 hover:bg-red-50" : ""}`} onClick={() => toggleActive(u.id, u.active)}>
                      {u.active ? <><UserX className="w-3.5 h-3.5" /> تعطيل الحساب</> : <><UserCheck className="w-3.5 h-3.5" /> تفعيل الحساب</>}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة عضو جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>الاسم الكامل *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>البريد الإلكتروني *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>كلمة المرور *</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>رقم الهاتف</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>الدور</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">مالك المكتب</SelectItem>
                  <SelectItem value="lawyer">محامي</SelectItem>
                  <SelectItem value="admin">مشرف</SelectItem>
                </SelectContent>
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
