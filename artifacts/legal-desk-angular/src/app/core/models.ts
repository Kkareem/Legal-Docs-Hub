export interface User {
  mustChangePassword?: boolean;
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'owner' | 'lawyer' | 'client' | 'admin';
  officeId?: number | null;
  active: boolean;
  createdAt: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Client {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  nationalId?: string | null;
  address?: string | null;
  status: 'new' | 'active' | 'pending' | 'completed' | 'closed';
  serviceType?: string | null;
  notes?: string | null;
  userId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientBody {
  name: string;
  phone?: string | null;
  email?: string | null;
  nationalId?: string | null;
  address?: string | null;
  status?: Client['status'];
  serviceType?: string | null;
  notes?: string | null;
}

export interface CaseItem {
  id: number;
  caseNumber: string;
  courtCaseNumber?: string | null;
  type:
    | 'civil'
    | 'criminal'
    | 'commercial'
    | 'family'
    | 'labor'
    | 'administrative'
    | 'other';
  court?: string | null;
  division?: string | null;
  clientId: number;
  clientName?: string | null;
  leadLawyerId?: number | null;
  leadLawyerName?: string | null;
  status: 'new' | 'active' | 'upcoming_hearing' | 'verdict' | 'adjourned' | 'closed';
  opposingParty?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  filingDate?: string | null;
}

export interface CreateCaseBody {
  caseNumber: string;
  courtCaseNumber?: string | null;
  type: CaseItem['type'];
  court?: string | null;
  division?: string | null;
  clientId: number;
  leadLawyerId?: number | null;
  status?: CaseItem['status'];
  opposingParty?: string | null;
  description?: string | null;
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string | null;
  caseId?: number | null;
  caseNumber?: string | null;
  assignedTo?: number | null;
  assigneeName?: string | null;
  dueDate?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'done' | 'needs_review' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string | null;
  caseId?: number | null;
  assignedTo?: number | null;
  dueDate?: string | null;
  priority?: TaskItem['priority'];
  status?: TaskItem['status'];
}

export interface UpdateTaskBody {
  title?: string;
  description?: string | null;
  caseId?: number | null;
  assignedTo?: number | null;
  dueDate?: string | null;
  priority?: TaskItem['priority'];
  status?: TaskItem['status'];
}

export interface CountByLabel {
  label: string;
  count: number;
}

export interface ActivityItem {
  action: string;
  description?: string | null;
  entityType?: string | null;
  createdAt?: string | null;
}

export interface Hearing {
  id: number;
  caseId: number;
  caseNumber?: string | null;
  court?: string | null;
  datetime: string;
  status?: string | null;
}

export interface PaymentSummary {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  topDebtors: Array<{ clientId: number; clientName: string; amountDue: number }>;
}

export interface DashboardSummary {
  totalVisitors: number;
  activeCases: number;
  totalClients: number;
  pendingTasks: number;
  overdueTasks: number;
  todayHearings: number;
  upcomingHearings: number;
  pendingConsultations: number;
  powersOfAttorneyOut: number;
  overduePoAs: number;
  casesByStatus: CountByLabel[];
}

export interface ConsultationRequest {
 assignees: Array<{id:number;name:string;active:boolean}>;
 messages: ConsultationMessage[]; canReply: boolean;
 id: number; name: string; email: string; phone: string; summary: string;
 status: string; assigned_to: number | null; response: string | null; assignee_name: string | null;
}
export interface ConsultationMessage {
 sender_name?: string | null;
 id: number; sender_type: 'staff' | 'visitor'; body: string; created_at: string;
}
export interface ConsultationTracking {
 id: number; summary: string; status: string; response: string | null;
 messages: ConsultationMessage[]; canReply: boolean;
}
