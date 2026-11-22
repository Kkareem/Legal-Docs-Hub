import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ActivityItem,
  CaseItem,
  Client,
  CreateCaseBody,
  CreateClientBody,
  CreateTaskBody,
  DashboardSummary,
  Hearing,
  LoginBody,
  LoginResponse,
  PaymentSummary,
  TaskItem,
  UpdateTaskBody,
  User,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  removePushSubscription(endpoint:string){return this.http.delete<void>('/api/notifications/subscriptions',{...this.options(),body:{endpoint}});}

  createLawyer(body: {address?:string;name:string;nationalId:string;email:string;phone:string;password:string;role:string}) {
    return this.http.post<User>('/api/users',body,this.options());
  }
  lawyerDetails(id:number){return this.http.get<LawyerDetails>('/api/lawyers/'+id,this.options());}
  lawyerCases(id:number){return this.http.get<LawyerCase[]>('/api/lawyers/'+id+'/cases',this.options());}
  reassignLawyerCase(id:number,caseId:number,lawyerId:number|null){return this.http.post<void>('/api/lawyers/'+id+'/cases/'+caseId+'/reassign',{lawyerId},this.options());}
  deleteLawyer(id:number){return this.http.delete<void>('/api/users/'+id,this.options());}
  updateUser(id:number,body:{nationalId?:string;email?:string;phone?:string}){return this.http.patch<User>('/api/users/'+id,body,this.options());}
  changePassword(body: {currentPassword:string;newPassword:string}) {
    return this.http.post<User>('/api/auth/change-password',body,this.options());
  }
  recordVisit(visitorId:string) { return this.http.post<void>('/api/public/visits',{visitorId}); }
  submitConsultation(body: {name:string;email:string;phone:string;summary:string}) {
    return this.http.post<{id:number}>('/api/public/consultations',body);
  }
  requestConsultationCode(contact:string){return this.http.post<{challengeId:string;resendAfterSeconds:number}>('/api/public/consultations/verification/request',{contact});}
  verifyConsultationCode(challengeId:string,code:string){return this.http.post<{accessToken:string;expiresAt:string}>('/api/public/consultations/verification/verify',{challengeId,code});}
  trackConsultation(body: {accessToken:string}) {
    return this.http.post<import('./models').ConsultationTracking[]>('/api/public/consultations/track',body);
  }
  replyAsVisitor(body: {id:number;accessToken:string;response:string}) {
    return this.http.post<import('./models').ConsultationTracking>('/api/public/consultations/reply',body);
  }
  listConsultationRequests() {
    return this.http.get<import('./models').ConsultationRequest[]>('/api/consultation-requests',this.options());
  }
  assignConsultation(id:number,assigneeIds:number[]) {
    return this.http.patch<void>('/api/consultation-requests/'+id+'/assign',{assigneeIds},this.options());
  }
  replyConsultation(id:number,response:string) {
    return this.http.post<void>('/api/consultation-requests/'+id+'/reply',{response},this.options());
  }
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api';

  private options() {
    return { withCredentials: true };
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiBase}/auth/me`, this.options());
  }

  login(body: LoginBody): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBase}/auth/login`, body, this.options());
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/auth/logout`, {}, this.options());
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiBase}/dashboard/summary`, this.options());
  }

  getUpcomingHearings(): Observable<Hearing[]> {
    return this.http.get<Hearing[]>(`${this.apiBase}/dashboard/upcoming-hearings`, this.options());
  }

  getOverdueTasks(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(`${this.apiBase}/dashboard/overdue-tasks`, this.options());
  }

  getPaymentSummary(): Observable<PaymentSummary> {
    return this.http.get<PaymentSummary>(`${this.apiBase}/dashboard/payment-summary`, this.options());
  }

  getRecentActivity(): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`${this.apiBase}/dashboard/recent-activity`, this.options());
  }

  listUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiBase}/users`, this.options());
  }

  listClients(params?: { search?: string; status?: string }): Observable<Client[]> {
    let query = new HttpParams();
    if (params?.search) query = query.set('search', params.search);
    if (params?.status) query = query.set('status', params.status);
    return this.http.get<Client[]>(`${this.apiBase}/clients`, { ...this.options(), params: query });
  }

  createClient(body: CreateClientBody): Observable<Client> {
    return this.http.post<Client>(`${this.apiBase}/clients`, body, this.options());
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/clients/${id}`, this.options());
  }

  listCases(): Observable<CaseItem[]> {
    return this.http.get<CaseItem[]>(`${this.apiBase}/cases`, this.options());
  }

  createCase(body: CreateCaseBody): Observable<CaseItem> {
    return this.http.post<CaseItem>(`${this.apiBase}/cases`, body, this.options());
  }

  deleteCase(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/cases/${id}`, this.options());
  }

  listTasks(params?: { status?: string; priority?: string }): Observable<TaskItem[]> {
    let query = new HttpParams();
    if (params?.status) query = query.set('status', params.status);
    if (params?.priority) query = query.set('priority', params.priority);
    return this.http.get<TaskItem[]>(`${this.apiBase}/tasks`, { ...this.options(), params: query });
  }

  createTask(body: CreateTaskBody): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${this.apiBase}/tasks`, body, this.options());
  }

  updateTask(id: number, body: UpdateTaskBody): Observable<TaskItem> {
    return this.http.patch<TaskItem>(`${this.apiBase}/tasks/${id}`, body, this.options());
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/tasks/${id}`, this.options());
  }
}

export interface LawyerCase {id:number;title:string;case_number:string;type:string;court?:string;other_lawyers:{id:number;name:string}[];}
export interface LawyerDetails {lawyer:{id:number;name:string;phone?:string;email?:string;address?:string;national_id?:string;active:boolean};cases:LawyerCase[];}
