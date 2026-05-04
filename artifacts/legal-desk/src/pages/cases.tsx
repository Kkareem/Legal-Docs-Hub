import { useState, useMemo } from "react";
import { useListCases, useCreateCase, useDeleteCase, getListCasesQueryKey, useListClients, useListUsers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Trash2, SlidersHorizontal, X, ChevronDown, ChevronUp, ArrowUpDown, Download } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; cls: string }> = {
  new:              { label: "جديد",        cls: "bg-slate-100 text-slate-600" },
  active:           { label: "نشط",         cls: "bg-blue-100 text-blue-700" },
  upcoming_hearing: { label: "جلسة قادمة",  cls: "bg-amber-100 text-amber-700" },
  verdict:          { label: "صدر حكم",     cls: "bg-purple-100 text-purple-700" },
  adjourned:        { label: "مؤجل",        cls: "bg-orange-100 text-orange-700" },
  closed:           { label: "مغلق",        cls: "bg-red-100 text-red-600" },
};

const typeConfig: Record<string, string> = {
  civil: "مدني", criminal: "جنائي", commercial: "تجاري",
  family: "أسري", labor: "عمالي", administrative: "إداري", other: "أخرى",
};

const TYPES = Object.keys(typeConfig);
const STATUSES = Object.keys(statusConfig);

type SortField = "caseNumber" | "filingDate" | "court" | "status";
type SortDir = "asc" | "desc";

interface Filters {
  search: string;
  statuses: string[];
  types: string[];
  court: string;
  lawyerId: string;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: Filters = {
  search: "", statuses: [], types: [], court: "", lawyerId: "", dateFrom: "", dateTo: "",
};

function countActiveFilters(f: Filters) {
  return (f.statuses.length > 0 ? 1 : 0) +
    (f.types.length > 0 ? 1 : 0) +
    (f.court ? 1 : 0) +
    (f.lawyerId ? 1 : 0) +
    ((f.dateFrom || f.dateTo) ? 1 : 0);
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

export default function Cases() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("caseNumber");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ caseNumber: "", courtCaseNumber: "", type: "civil", court: "", division: "", clientId: "", leadLawyerId: "", status: "new", opposingParty: "", description: "" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: allCases, isLoading } = useListCases({});
  const { data: clients } = useListClients();
  const { data: users } = useListUsers();
  const createMutation = useCreateCase();
  const deleteMutation = useDeleteCase();

  const filtered = useMemo(() => {
    let list: any[] = allCases ?? [];
    const q = filters.search.trim().toLowerCase();
    if (q) list = list.filter(c =>
      c.caseNumber?.toLowerCase().includes(q) ||
      (c.courtCaseNumber ?? "").toLowerCase().includes(q) ||
      (c.court ?? "").toLowerCase().includes(q) ||
      (c.opposingParty ?? "").toLowerCase().includes(q) ||
      (c.clientName ?? "").toLowerCase().includes(q)
    );
    if (filters.statuses.length) list = list.filter(c => filters.statuses.includes(c.status));
    if (filters.types.length) list = list.filter(c => filters.types.includes(c.type));
    if (filters.court) list = list.filter(c => (c.court ?? "").toLowerCase().includes(filters.court.toLowerCase()));
    if (filters.lawyerId) list = list.filter(c => String(c.leadLawyerId) === filters.lawyerId);
    if (filters.dateFrom) list = list.filter(c => c.filingDate && c.filingDate >= filters.dateFrom);
    if (filters.dateTo) list = list.filter(c => c.filingDate && c.filingDate <= filters.dateTo);

    list = [...list].sort((a, b) => {
      let av = a[sortField] ?? "", bv = b[sortField] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sortDir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
    return list;
  }, [allCases, filters, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const clearFilter = (key: keyof Filters) => setFilters(f => ({ ...f, [key]: DEFAULT_FILTERS[key] }));
  const resetAll = () => setFilters(DEFAULT_FILTERS);

  const activeCount = countActiveFilters(filters);
  const lawyerMap = useMemo(() => Object.fromEntries((users ?? []).map((u: any) => [String(u.id), u.name])), [users]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const cols = ["رقم القضية", "رقم المحكمة", "الموكل", "المحكمة", "النوع", "الحالة", "المحامي", "تاريخ التسجيل"];
    const rows = filtered.map((c: any) => [
      c.caseNumber ?? "", c.courtCaseNumber ?? "", c.clientName ?? "", c.court ?? "",
      typeConfig[c.type] ?? c.type, statusConfig[c.status]?.label ?? c.status,
      c.leadLawyerName ?? "", c.filingDate ?? "",
    ]);
    const csv = [cols, ...rows].map(r => r.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `القضايا_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreate = async () => {
    if (!form.caseNumber.trim() || !form.clientId) { toast({ title: "رقم القضية والموكل مطلوبان", variant: "destructive" }); return; }
    await createMutation.mutateAsync({ data: { ...form, clientId: parseInt(form.clientId), leadLawyerId: form.leadLawyerId ? parseInt(form.leadLawyerId) : undefined } as any });
    qc.invalidateQueries({ queryKey: getListCasesQueryKey() });
    setShowCreate(false);
    toast({ title: "تم إضافة القضية بنجاح" });
  };

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 group text-right w-full">
      {label}
      <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${sortField === field ? "text-primary" : "text-slate-300 group-hover:text-slate-400"}`} />
    </button>
  );

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">القضايا</h1>
          <p className="text-sm text-slate-500 mt-0.5">{isLoading ? "..." : `${filtered.length} قضية${activeCount ? ` (مفلترة من ${allCases?.length ?? 0})` : ""}`}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!filtered.length} className="gap-2">
            <Download className="w-4 h-4" /> تصدير CSV
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> إضافة قضية</Button>
        </div>
      </div>

      {/* Search + filter toggle bar */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pr-9" placeholder="بحث برقم القضية أو الموكل أو الخصم..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          className="gap-2 shrink-0"
          onClick={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          تصفية متقدمة
          {activeCount > 0 && (
            <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 ${showFilters ? "bg-white/20 text-white" : "bg-primary text-white"}`}>{activeCount}</span>
          )}
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="text-slate-500 gap-1.5" onClick={resetAll}>
            <X className="w-3.5 h-3.5" /> مسح الكل
          </Button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* Status multi-select chips */}
              <div className="space-y-2 lg:col-span-3">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">الحالة</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => {
                    const active = filters.statuses.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => setFilters(f => ({ ...f, statuses: toggle(f.statuses, s) }))}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${active ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"}`}
                      >
                        {statusConfig[s].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type multi-select chips */}
              <div className="space-y-2 lg:col-span-3">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">نوع القضية</Label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => {
                    const active = filters.types.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => setFilters(f => ({ ...f, types: toggle(f.types, t) }))}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${active ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"}`}
                      >
                        {typeConfig[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Court name */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">المحكمة</Label>
                <Input placeholder="اسم المحكمة..." value={filters.court} onChange={e => setFilters(f => ({ ...f, court: e.target.value }))} />
              </div>

              {/* Assigned lawyer */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">المحامي المسؤول</Label>
                <Select value={filters.lawyerId || "all"} onValueChange={v => setFilters(f => ({ ...f, lawyerId: v === "all" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="جميع المحامين" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المحامين</SelectItem>
                    {(users ?? []).map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">تاريخ التسجيل</Label>
                <div className="flex gap-2 items-center">
                  <Input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="text-sm" />
                  <span className="text-slate-400 text-xs shrink-0">إلى</span>
                  <Input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="text-sm" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 shrink-0">الفلاتر النشطة:</span>
          {filters.statuses.map(s => (
            <span key={s} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
              {statusConfig[s]?.label}
              <button onClick={() => setFilters(f => ({ ...f, statuses: f.statuses.filter(x => x !== s) }))} className="hover:text-primary/60"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filters.types.map(t => (
            <span key={t} className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 rounded-full px-3 py-1 font-medium">
              {typeConfig[t]}
              <button onClick={() => setFilters(f => ({ ...f, types: f.types.filter(x => x !== t) }))} className="hover:text-blue-400"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filters.court && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 rounded-full px-3 py-1 font-medium">
              المحكمة: {filters.court}
              <button onClick={() => clearFilter("court")} className="hover:text-slate-400"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.lawyerId && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 rounded-full px-3 py-1 font-medium">
              المحامي: {lawyerMap[filters.lawyerId] ?? filters.lawyerId}
              <button onClick={() => clearFilter("lawyerId")} className="hover:text-slate-400"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 rounded-full px-3 py-1 font-medium">
              التاريخ: {filters.dateFrom || "…"} → {filters.dateTo || "…"}
              <button onClick={() => setFilters(f => ({ ...f, dateFrom: "", dateTo: "" }))} className="hover:text-slate-400"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : !filtered.length ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <SlidersHorizontal className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-400 text-lg font-medium">{activeCount ? "لا توجد نتائج تطابق الفلاتر المحددة" : "لا توجد قضايا"}</p>
            {activeCount > 0 && <Button variant="link" className="mt-2 text-primary" onClick={resetAll}>مسح الفلاتر</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-right px-5 py-3 font-medium text-slate-500"><SortBtn field="caseNumber" label="رقم القضية" /></th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">الموكل</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500"><SortBtn field="court" label="المحكمة" /></th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">النوع</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500"><SortBtn field="status" label="الحالة" /></th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">المحامي</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500"><SortBtn field="filingDate" label="تاريخ التسجيل" /></th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c: any) => {
                const sc = statusConfig[c.status] ?? { label: c.status, cls: "bg-slate-100 text-slate-600" };
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{c.caseNumber}</p>
                      {c.courtCaseNumber && <p className="text-xs text-slate-400 mt-0.5">{c.courtCaseNumber}</p>}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{c.clientName ?? `#${c.clientId}`}</td>
                    <td className="px-5 py-4 text-slate-600 max-w-[140px] truncate">{c.court ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{typeConfig[c.type] ?? c.type}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-xs">{c.leadLawyerName ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{c.filingDate ? new Date(c.filingDate).toLocaleDateString("ar-SA", { dateStyle: "short" }) : "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 justify-end">
                        <Link href={`/cases/${c.id}`}><Button size="icon" variant="ghost" className="w-8 h-8"><Eye className="w-4 h-4" /></Button></Link>
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={async () => {
                          if (confirm(`حذف القضية "${c.caseNumber}"؟`)) {
                            await deleteMutation.mutateAsync({ id: c.id });
                            qc.invalidateQueries({ queryKey: getListCasesQueryKey() });
                          }
                        }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400 flex items-center justify-between">
            <span>إجمالي النتائج: <strong className="text-slate-600">{filtered.length}</strong> قضية</span>
            {activeCount > 0 && <span>{allCases?.length ?? 0} قضية في السجل الكلي</span>}
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>إضافة قضية جديدة</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>رقم القضية *</Label><Input value={form.caseNumber} onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>رقم القضية بالمحكمة</Label><Input value={form.courtCaseNumber} onChange={e => setForm(f => ({ ...f, courtCaseNumber: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2">
              <Label>الموكل *</Label>
              <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الموكل" /></SelectTrigger>
                <SelectContent>{clients?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>نوع القضية</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{typeConfig[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>المحكمة</Label><Input value={form.court} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} /></div>
            <div className="space-y-1.5 col-span-2">
              <Label>المحامي المسؤول</Label>
              <Select value={form.leadLawyerId} onValueChange={v => setForm(f => ({ ...f, leadLawyerId: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المحامي" /></SelectTrigger>
                <SelectContent>{users?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>الطرف الخصم</Label><Input value={form.opposingParty} onChange={e => setForm(f => ({ ...f, opposingParty: e.target.value }))} /></div>
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
