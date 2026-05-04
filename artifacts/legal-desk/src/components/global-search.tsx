import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, Users, Briefcase, CheckSquare, Calendar, X, ArrowLeft, Loader2 } from "lucide-react";

const statusLabel: Record<string, string> = {
  new: "جديد", active: "نشط", upcoming_hearing: "جلسة قادمة", verdict: "حكم",
  adjourned: "مؤجل", closed: "مغلق", in_progress: "قيد التنفيذ", done: "مكتمل",
  scheduled: "مجدولة", completed: "منعقدت", cancelled: "ملغى", overdue: "متأخر",
  pending: "معلق",
};

interface SearchResults {
  clients: Array<{ id: number; name: string; phone?: string | null; email?: string | null }>;
  cases: Array<{ id: number; caseNumber: string; status: string; court?: string | null; type: string }>;
  tasks: Array<{ id: number; title: string; status: string; priority: string; dueDate?: string | null }>;
  hearings: Array<{ id: number; court?: string | null; datetime: string; status: string; caseId: number }>;
}

const empty: SearchResults = { clients: [], cases: [], tasks: [], hearings: [] };

function hasResults(r: SearchResults) {
  return r.clients.length + r.cases.length + r.tasks.length + r.hearings.length > 0;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(empty);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSearch = useCallback(() => {
    setOpen(true);
    setQuery("");
    setResults(empty);
    setSelected(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(empty);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open ? closeSearch() : openSearch();
      }
      if (e.key === "Escape" && open) closeSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, openSearch, closeSearch]);

  useEffect(() => {
    if (!query || query.length < 2) { setResults(empty); setLoading(false); return; }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { credentials: "include" });
        if (res.ok) setResults(await res.json());
      } catch {
        setResults(empty);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const allItems = [
    ...results.clients.map(c => ({ type: "client" as const, id: c.id, label: c.name, sub: c.phone ?? c.email ?? "", href: `/clients/${c.id}` })),
    ...results.cases.map(c => ({ type: "case" as const, id: c.id, label: c.caseNumber, sub: `${c.court ?? ""} · ${statusLabel[c.status] ?? c.status}`, href: `/cases/${c.id}` })),
    ...results.tasks.map(t => ({ type: "task" as const, id: t.id, label: t.title, sub: statusLabel[t.status] ?? t.status, href: `/tasks` })),
    ...results.hearings.map(h => ({ type: "hearing" as const, id: h.id, label: h.court ?? `جلسة #${h.id}`, sub: new Date(h.datetime).toLocaleDateString("ar-SA", { dateStyle: "medium" }), href: `/hearings` })),
  ];

  useEffect(() => { setSelected(0); }, [results]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && allItems[selected]) {
        setLocation(allItems[selected].href);
        closeSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, allItems, selected, setLocation, closeSearch]);

  const navigate = (href: string) => { setLocation(href); closeSearch(); };

  const icons: Record<string, any> = { client: Users, case: Briefcase, task: CheckSquare, hearing: Calendar };
  const colors: Record<string, string> = {
    client: "text-blue-500 bg-blue-50",
    case: "text-primary bg-primary/10",
    task: "text-amber-500 bg-amber-50",
    hearing: "text-purple-500 bg-purple-50",
  };
  const typeLabels: Record<string, string> = { client: "موكل", case: "قضية", task: "مهمة", hearing: "جلسة" };

  return (
    <>
      {/* Trigger button in header */}
      <button
        onClick={openSearch}
        className="flex items-center gap-2 px-3 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm hover:border-slate-300 hover:bg-white transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">بحث...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" dir="rtl">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeSearch} />

          {/* Panel */}
          <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="ابحث في الموكلين، القضايا، المهام، الجلسات..."
                className="flex-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none"
              />
              {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
              {query && !loading && (
                <button onClick={() => { setQuery(""); setResults(empty); inputRef.current?.focus(); }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!query || query.length < 2 ? (
                <div className="px-5 py-10 text-center">
                  <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">اكتب حرفين على الأقل للبحث</p>
                  <p className="text-xs text-slate-300 mt-1">الموكلون · القضايا · المهام · الجلسات</p>
                </div>
              ) : !loading && !hasResults(results) ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-slate-400">لا توجد نتائج لـ "<span className="font-medium text-slate-600">{query}</span>"</p>
                </div>
              ) : (
                <div className="py-2">
                  {allItems.map((item, i) => {
                    const Icon = icons[item.type];
                    const colorCls = colors[item.type];
                    const isSelected = i === selected;
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setSelected(i)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${isSelected ? "bg-slate-50" : "hover:bg-slate-50"}`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${colorCls}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.label}</p>
                          {item.sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{item.sub}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{typeLabels[item.type]}</span>
                          {isSelected && <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            {hasResults(results) && (
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
                <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1 font-mono">↑↓</kbd> للتنقل</span>
                <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1 font-mono">↵</kbd> للفتح</span>
                <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1 font-mono">Esc</kbd> للإغلاق</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
