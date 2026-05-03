import { Link } from "wouter";
import { useGetCase, useListHearings, useListTasks, useListDocuments, getGetCaseQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, CheckSquare, FileText, User, Scale } from "lucide-react";

const statusCls: Record<string, string> = {
  new: "bg-slate-100 text-slate-600", active: "bg-blue-100 text-blue-700", upcoming_hearing: "bg-amber-100 text-amber-700",
  verdict: "bg-purple-100 text-purple-700", adjourned: "bg-orange-100 text-orange-700", closed: "bg-red-100 text-red-600",
};
const statusLabel: Record<string, string> = { new: "جديد", active: "نشط", upcoming_hearing: "جلسة قادمة", verdict: "حكم", adjourned: "مؤجل", closed: "مغلق" };
const taskPriorityCls: Record<string, string> = { low: "text-slate-400", medium: "text-blue-500", high: "text-amber-500", urgent: "text-red-600" };

interface Props { id: string }

export default function CaseDetail({ id }: Props) {
  const caseId = parseInt(id);
  const { data: caseItem, isLoading } = useGetCase(caseId);
  const { data: hearings } = useListHearings({ caseId });
  const { data: tasks } = useListTasks({ caseId });
  const { data: docs } = useListDocuments({ caseId });

  if (isLoading) return <div className="p-6 flex items-center justify-center min-h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!caseItem) return <div className="p-6"><p className="text-slate-500">القضية غير موجودة</p></div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/cases"><Button size="icon" variant="ghost"><ArrowRight className="w-4 h-4" /></Button></Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy">{caseItem.caseNumber}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusCls[caseItem.status] ?? "bg-slate-100"}`}>{statusLabel[caseItem.status] ?? caseItem.status}</span>
          </div>
          {caseItem.courtCaseNumber && <p className="text-sm text-slate-500 mt-0.5">رقم المحكمة: {caseItem.courtCaseNumber}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex gap-2 text-sm"><User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /><div><p className="text-xs text-slate-400">الموكل</p><p className="font-medium text-slate-800">{caseItem.clientName ?? `#${caseItem.clientId}`}</p></div></div>
            <div className="flex gap-2 text-sm"><Scale className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /><div><p className="text-xs text-slate-400">المحكمة</p><p className="font-medium text-slate-800">{caseItem.court ?? "—"}</p></div></div>
            {caseItem.leadLawyerName && <div className="flex gap-2 text-sm"><User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /><div><p className="text-xs text-slate-400">المحامي المسؤول</p><p className="font-medium text-slate-800">{caseItem.leadLawyerName}</p></div></div>}
            {caseItem.opposingParty && <div className="flex gap-2 text-sm"><User className="w-4 h-4 text-red-300 shrink-0 mt-0.5" /><div><p className="text-xs text-slate-400">الطرف الخصم</p><p className="font-medium text-slate-800">{caseItem.opposingParty}</p></div></div>}
            {caseItem.description && <div className="pt-3 border-t border-slate-100"><p className="text-sm text-slate-600 leading-relaxed">{caseItem.description}</p></div>}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />الجلسات</CardTitle></CardHeader>
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
        <CardHeader className="pb-3 border-b border-slate-100"><CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="w-4 h-4 text-primary" />المهام المرتبطة</CardTitle></CardHeader>
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
                    <span className={`text-xs font-medium ${taskPriorityCls[t.priority]}`}>{t.priority === "urgent" ? "عاجلة" : t.priority === "high" ? "عالية" : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {docs && docs.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />المستندات</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {docs.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700">{d.fileName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
