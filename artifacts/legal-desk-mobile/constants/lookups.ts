export const clientStatusOptions = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "vip", label: "VIP" },
  { value: "blacklisted", label: "محظور" },
] as const;

export const serviceTypeOptions = [
  { value: "litigation", label: "تقاضي" },
  { value: "consultation", label: "استشارة" },
  { value: "contracts", label: "عقود" },
  { value: "collections", label: "تحصيل" },
  { value: "other", label: "أخرى" },
] as const;

export const caseStatusOptions = [
  { value: "new", label: "جديد" },
  { value: "active", label: "نشط" },
  { value: "upcoming_hearing", label: "جلسة قادمة" },
  { value: "verdict", label: "حكم" },
  { value: "adjourned", label: "مؤجل" },
  { value: "closed", label: "مغلق" },
] as const;

export const caseTypeOptions = [
  { value: "civil", label: "مدني" },
  { value: "criminal", label: "جنائي" },
  { value: "commercial", label: "تجاري" },
  { value: "family", label: "أسري" },
  { value: "labor", label: "عمالي" },
  { value: "administrative", label: "إداري" },
  { value: "other", label: "أخرى" },
] as const;

export const taskStatusOptions = [
  { value: "new", label: "جديد" },
  { value: "in_progress", label: "جاري" },
  { value: "done", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
] as const;

export const taskPriorityOptions = [
  { value: "urgent", label: "عاجل" },
  { value: "high", label: "مرتفع" },
  { value: "normal", label: "عادي" },
  { value: "low", label: "منخفض" },
] as const;

export const hearingTypeOptions = [
  { value: "hearing", label: "جلسة" },
  { value: "mention", label: "مراجعة" },
  { value: "session", label: "جلسة عامة" },
] as const;

export const hearingStatusOptions = [
  { value: "scheduled", label: "مجدولة" },
  { value: "completed", label: "منعقدة" },
  { value: "adjourned", label: "مؤجلة" },
  { value: "cancelled", label: "ملغاة" },
] as const;

export const consultationStatusOptions = [
  { value: "new", label: "جديدة" },
  { value: "in_progress", label: "قيد المعالجة" },
  { value: "responded", label: "تم الرد" },
  { value: "closed", label: "مغلقة" },
] as const;

export const paymentStatusOptions = [
  { value: "pending", label: "معلقة" },
  { value: "paid", label: "مدفوعة" },
  { value: "partial", label: "جزئية" },
] as const;

export const paymentTypeOptions = [
  { value: "case_fee", label: "أتعاب قضية" },
  { value: "consultation_fee", label: "أتعاب استشارة" },
  { value: "retainer", label: "عقد سنوي" },
  { value: "other", label: "أخرى" },
] as const;

export const documentTypeOptions = [
  { value: "contract", label: "عقد" },
  { value: "pleading", label: "مذكرة" },
  { value: "identity", label: "هوية" },
  { value: "evidence", label: "مرفق" },
  { value: "other", label: "أخرى" },
] as const;

export const poaStatusOptions = [
  { value: "received", label: "مستلمة" },
  { value: "returned", label: "معادة" },
  { value: "pending_return", label: "بانتظار الإعادة" },
] as const;

export const userRoleOptions = [
  { value: "owner", label: "مالك" },
  { value: "admin", label: "مدير" },
  { value: "lawyer", label: "محام" },
  { value: "assistant", label: "مساعد" },
] as const;
