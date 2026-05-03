import { db } from "@workspace/db";
import {
  usersTable, clientsTable, casesTable, tasksTable, hearingsTable,
  consultationsTable, paymentsTable, powersOfAttorneyTable, notificationsTable
} from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const hash = await bcrypt.hash("password123", 10);

  const [owner] = await db.insert(usersTable).values({
    name: "أحمد المحامي",
    email: "admin@legaldesk.sa",
    passwordHash: hash,
    phone: "+966500000001",
    role: "owner",
    active: true,
  }).onConflictDoNothing().returning();

  const [lawyer1] = await db.insert(usersTable).values({
    name: "فاطمة الزهراني",
    email: "fatima@legaldesk.sa",
    passwordHash: hash,
    phone: "+966500000002",
    role: "lawyer",
    active: true,
  }).onConflictDoNothing().returning();

  const [lawyer2] = await db.insert(usersTable).values({
    name: "محمد العتيبي",
    email: "mohammed@legaldesk.sa",
    passwordHash: hash,
    phone: "+966500000003",
    role: "lawyer",
    active: true,
  }).onConflictDoNothing().returning();

  if (!owner || !lawyer1 || !lawyer2) {
    console.log("Users already seeded, skipping.");
    return;
  }

  const clients = await db.insert(clientsTable).values([
    { name: "شركة النور للتجارة", phone: "+966501234567", email: "info@alnoor.sa", nationalId: "1234567890", status: "active", serviceType: "تجاري", notes: "عميل منذ 2022" },
    { name: "عبدالله بن سالم", phone: "+966502345678", email: "abdullah@email.com", nationalId: "2345678901", status: "active", serviceType: "مدني" },
    { name: "شركة البناء الحديث", phone: "+966503456789", email: "info@albena.sa", nationalId: "3456789012", status: "pending", serviceType: "عمالي" },
    { name: "نورة الشمري", phone: "+966504567890", email: "noura@email.com", nationalId: "4567890123", status: "new", serviceType: "أسري" },
    { name: "مجموعة الخليج الاستثمارية", phone: "+966505678901", email: "info@gulf.sa", nationalId: "5678901234", status: "active", serviceType: "تجاري" },
  ]).returning();

  const cases = await db.insert(casesTable).values([
    { caseNumber: "Q-2024-001", courtCaseNumber: "CRT-2024-5521", type: "civil", court: "المحكمة التجارية", division: "الدائرة الأولى", clientId: clients[0].id, leadLawyerId: owner.id, status: "active", opposingParty: "شركة المستقبل", description: "نزاع تجاري على عقد توريد" },
    { caseNumber: "Q-2024-002", courtCaseNumber: "CRT-2024-5522", type: "criminal", court: "المحكمة الجزائية", division: "الدائرة الثانية", clientId: clients[1].id, leadLawyerId: lawyer1.id, status: "upcoming_hearing", description: "قضية احتيال تجاري" },
    { caseNumber: "Q-2024-003", courtCaseNumber: "CRT-2024-5523", type: "labor", court: "المحكمة العمالية", clientId: clients[2].id, leadLawyerId: lawyer2.id, status: "active", opposingParty: "موظف سابق", description: "نزاع عمالي بشأن مكافأة نهاية الخدمة" },
    { caseNumber: "Q-2024-004", type: "family", court: "محكمة الأحوال الشخصية", clientId: clients[3].id, leadLawyerId: lawyer1.id, status: "new", description: "قضية حضانة أطفال" },
    { caseNumber: "Q-2024-005", courtCaseNumber: "CRT-2024-5525", type: "commercial", court: "المحكمة التجارية", clientId: clients[4].id, leadLawyerId: owner.id, status: "verdict", opposingParty: "مصرف الرياض", description: "نزاع على تمويل تجاري" },
  ]).returning();

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const yesterday = new Date(now.getTime() - 86400000);

  await db.insert(hearingsTable).values([
    { caseId: cases[0].id, datetime: tomorrow, court: "المحكمة التجارية", type: "session", assignedLawyer: owner.id, status: "scheduled", notes: "جلسة المرافعة الأولى" },
    { caseId: cases[1].id, datetime: nextWeek, court: "المحكمة الجزائية", type: "session", assignedLawyer: lawyer1.id, status: "scheduled" },
    { caseId: cases[2].id, datetime: yesterday, court: "المحكمة العمالية", type: "session", assignedLawyer: lawyer2.id, status: "completed", notes: "تم الاستماع لشهود الدفاع" },
    { caseId: cases[4].id, datetime: new Date(now.getTime() + 3 * 86400000), court: "المحكمة التجارية", type: "deadline", assignedLawyer: owner.id, status: "scheduled" },
  ]);

  const dueYesterday = new Date(now.getTime() - 86400000);
  const dueTomorrow = new Date(now.getTime() + 86400000);
  await db.insert(tasksTable).values([
    { title: "إعداد مذكرة الدفاع", caseId: cases[0].id, assignedTo: owner.id, dueDate: dueTomorrow, priority: "high", status: "in_progress", description: "مذكرة شاملة لجلسة المرافعة القادمة" },
    { title: "مراجعة العقود", caseId: cases[4].id, assignedTo: lawyer1.id, dueDate: dueYesterday, priority: "urgent", status: "overdue", description: "مراجعة عقود التمويل" },
    { title: "التواصل مع الشاهد", caseId: cases[1].id, assignedTo: lawyer2.id, dueDate: nextWeek, priority: "medium", status: "new" },
    { title: "تقديم المستندات للمحكمة", caseId: cases[2].id, assignedTo: lawyer2.id, dueDate: new Date(now.getTime() + 2 * 86400000), priority: "high", status: "new" },
    { title: "إعداد تقرير القضية", caseId: cases[3].id, assignedTo: lawyer1.id, dueDate: dueYesterday, priority: "medium", status: "overdue" },
  ]);

  await db.insert(consultationsTable).values([
    { clientId: clients[3].id, summary: "استفسار حول إجراءات الطلاق وحضانة الأطفال وفق الشريعة الإسلامية", paymentStatus: "paid", fee: "500.00", status: "responded", assignedTo: lawyer1.id, response: "يتطلب رفع دعوى أمام محكمة الأحوال الشخصية..." },
    { clientId: clients[0].id, summary: "استشارة حول قانونية بنود العقد المبرم مع الموردين", paymentStatus: "pending", fee: "800.00", status: "pending", assignedTo: owner.id },
    { clientId: clients[1].id, summary: "استفسار عن كيفية الطعن في حكم محكمة الدرجة الأولى", paymentStatus: "waived", status: "responded", assignedTo: lawyer2.id, response: "يجوز الاستئناف خلال 30 يوماً من تاريخ صدور الحكم..." },
  ]);

  await db.insert(paymentsTable).values([
    { clientId: clients[0].id, caseId: cases[0].id, amount: "15000.00", type: "case_fee", status: "paid", paidAt: new Date(now.getTime() - 30 * 86400000) },
    { clientId: clients[0].id, caseId: cases[0].id, amount: "5000.00", type: "retainer", status: "pending" },
    { clientId: clients[1].id, caseId: cases[1].id, amount: "8000.00", type: "case_fee", status: "paid", paidAt: new Date(now.getTime() - 15 * 86400000) },
    { clientId: clients[2].id, caseId: cases[2].id, amount: "6000.00", type: "case_fee", status: "overdue" },
    { clientId: clients[4].id, caseId: cases[4].id, amount: "25000.00", type: "case_fee", status: "partial" },
    { clientId: clients[3].id, amount: "500.00", type: "consultation_fee", status: "paid", paidAt: yesterday },
  ]);

  await db.insert(powersOfAttorneyTable).values([
    { clientId: clients[0].id, caseId: cases[0].id, receivedBy: owner.id, handedBy: "أحمد النور", receivedAt: new Date(now.getTime() - 10 * 86400000), returnBy: nextWeek, status: "in_office" },
    { clientId: clients[1].id, caseId: cases[1].id, receivedBy: lawyer1.id, handedBy: "عبدالله", receivedAt: new Date(now.getTime() - 5 * 86400000), returnBy: yesterday, status: "overdue" },
    { clientId: clients[4].id, caseId: cases[4].id, receivedBy: lawyer2.id, handedBy: "المجموعة", receivedAt: new Date(now.getTime() - 2 * 86400000), status: "with_lawyer" },
  ]);

  await db.insert(notificationsTable).values([
    { userId: owner.id, type: "hearing", title: "جلسة قادمة غداً", body: "لديك جلسة في القضية Q-2024-001 غداً في المحكمة التجارية", read: false, refId: cases[0].id, refType: "case" },
    { userId: owner.id, type: "task", title: "مهمة متأخرة", body: "المهمة 'مراجعة العقود' متأخرة عن موعدها", read: false },
    { userId: owner.id, type: "payment", title: "دفعة متأخرة", body: "شركة البناء الحديث لديها دفعة متأخرة بقيمة 6,000 ريال", read: true },
  ]);

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch(console.error);
