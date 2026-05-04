import { useState, useEffect } from "react";
import { useUpdateUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Save, Shield } from "lucide-react";

const roleLabels: Record<string, string> = {
  owner: "مالك المكتب",
  lawyer: "محامي",
  paralegal: "مساعد قانوني",
  assistant: "مساعد إداري",
};

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const updateMutation = useUpdateUser();

  const [info, setInfo] = useState({ name: "", phone: "" });
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) setInfo({ name: user.name ?? "", phone: user.phone ?? "" });
  }, [user]);

  const handleSaveInfo = async () => {
    if (!info.name.trim()) { toast({ title: "الاسم مطلوب", variant: "destructive" }); return; }
    setSavingInfo(true);
    try {
      await updateMutation.mutateAsync({ id: user!.id, data: { name: info.name, phone: info.phone || undefined } as any });
      toast({ title: "تم تحديث البيانات بنجاح" });
    } catch {
      toast({ title: "حدث خطأ أثناء التحديث", variant: "destructive" });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePw = async () => {
    if (!pw.newPw || pw.newPw.length < 6) { toast({ title: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" }); return; }
    if (pw.newPw !== pw.confirm) { toast({ title: "كلمتا المرور غير متطابقتين", variant: "destructive" }); return; }
    setSavingPw(true);
    try {
      await updateMutation.mutateAsync({ id: user!.id, data: { password: pw.newPw } as any });
      setPw({ current: "", newPw: "", confirm: "" });
      toast({ title: "تم تغيير كلمة المرور بنجاح" });
    } catch {
      toast({ title: "حدث خطأ أثناء تغيير كلمة المرور", variant: "destructive" });
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">الملف الشخصي</h1>
        <p className="text-sm text-slate-500 mt-0.5">إدارة بياناتك الشخصية وإعدادات الأمان</p>
      </div>

      <div className="flex items-center gap-5 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
          {user.name?.charAt(0) ?? "U"}
        </div>
        <div>
          <p className="text-xl font-bold text-navy">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            <Shield className="w-3 h-3" />
            {roleLabels[user.role] ?? user.role}
          </span>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-navy">
            <User className="w-4 h-4 text-primary" /> البيانات الشخصية
          </CardTitle>
          <CardDescription>تحديث اسمك ورقم هاتفك</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <Label>الاسم الكامل *</Label>
            <Input value={info.name} onChange={e => setInfo(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>البريد الإلكتروني</Label>
            <Input value={user.email} disabled className="bg-slate-50 text-slate-400 cursor-not-allowed" />
            <p className="text-xs text-slate-400">لا يمكن تغيير البريد الإلكتروني</p>
          </div>
          <div className="space-y-1.5">
            <Label>رقم الهاتف</Label>
            <Input value={info.phone} onChange={e => setInfo(f => ({ ...f, phone: e.target.value }))} placeholder="+966XXXXXXXXX" />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveInfo} disabled={savingInfo} className="gap-2">
              <Save className="w-4 h-4" />
              {savingInfo ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-navy">
            <Lock className="w-4 h-4 text-primary" /> تغيير كلمة المرور
          </CardTitle>
          <CardDescription>يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <Label>كلمة المرور الجديدة</Label>
            <Input type="password" value={pw.newPw} onChange={e => setPw(f => ({ ...f, newPw: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>تأكيد كلمة المرور الجديدة</Label>
            <Input type="password" value={pw.confirm} onChange={e => setPw(f => ({ ...f, confirm: e.target.value }))} />
            {pw.confirm && pw.newPw !== pw.confirm && (
              <p className="text-xs text-red-500">كلمتا المرور غير متطابقتين</p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleChangePw} disabled={savingPw || !pw.newPw} className="gap-2">
              <Lock className="w-4 h-4" />
              {savingPw ? "جاري التحديث..." : "تغيير كلمة المرور"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
