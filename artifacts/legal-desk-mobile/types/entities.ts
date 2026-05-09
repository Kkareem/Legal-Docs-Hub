export interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  address: string | null;
  status: string;
  serviceType: string | null;
  notes: string | null;
  userId: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CaseItem {
  id: number;
  caseNumber: string;
  courtCaseNumber: string | null;
  type: string;
  court: string | null;
  division: string | null;
  clientId: number;
  clientName: string | null;
  leadLawyerId: number | null;
  leadLawyerName: string | null;
  status: string;
  opposingParty: string | null;
  description: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TaskItem {
  id: number;
  title: string;
  description: string | null;
  caseId: number | null;
  caseNumber: string | null;
  assignedTo: number | null;
  assigneeName: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
}

export interface Hearing {
  id: number;
  caseId: number | null;
  caseNumber: string | null;
  datetime: string | null;
  court: string | null;
  type: string | null;
  assignedLawyer: number | null;
  assignedLawyerName: string | null;
  status: string;
  notes: string | null;
}

export interface Consultation {
  id: number;
  clientId: number | null;
  clientName: string | null;
  summary: string;
  paymentStatus: string | null;
  fee: number | null;
  status: string;
  assignedTo: number | null;
  assigneeName: string | null;
  response: string | null;
}

export interface Payment {
  id: number;
  clientId: number | null;
  clientName: string | null;
  caseId: number | null;
  caseNumber: string | null;
  consultationId: number | null;
  amount: number;
  type: string | null;
  status: string;
  paidAt: string | null;
  notes: string | null;
}

export interface DocumentItem {
  id: number;
  caseId: number | null;
  clientId: number | null;
  fileUrl: string | null;
  fileName: string | null;
  docType: string | null;
  isOriginal: boolean;
  uploadedBy: number | null;
  uploaderName: string | null;
  notes: string | null;
  createdAt?: string | null;
}

export interface PowerOfAttorney {
  id: number;
  clientId: number | null;
  clientName: string | null;
  caseId: number | null;
  caseNumber: string | null;
  receivedBy: number | null;
  receivedByName: string | null;
  handedBy: string | null;
  receivedAt: string | null;
  returnBy: string | null;
  returnedAt: string | null;
  status: string;
  notes: string | null;
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
}

export interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  refId: number | null;
  refType: string | null;
  createdAt: string | null;
}

export interface DashboardSummary {
  activeCases: number;
  totalClients: number;
  pendingTasks: number;
  overdueTasks: number;
  todayHearings: number;
  upcomingHearings: number;
  totalPendingPayments: number;
}
