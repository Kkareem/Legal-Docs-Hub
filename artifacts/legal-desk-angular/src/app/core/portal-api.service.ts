export interface Participant {id:number;name:string;}
export interface Opponent {id?:number;name?:string;phone?:string;email?:string;nationalId?:string;national_id?:string;relationship?:string;relatedClientId?:number|null;related_client_id?:number|null;related_client_name?:string;}
export interface CaseActivity {id:number;actor_name:string;entity:string;action:string;changes:string;created_at:string;}
import {Injectable,inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
export interface PortalCase {lawyers?:Participant[];id:number;case_number:string;court_case_number?:string;type:string;court?:string;division?:string;status:string;description?:string;lawyer_name?:string;lead_lawyer_id?:number;created_at:string;updated_at:string;}
export interface PortalHearing {id:number;case_id?:number;case_number?:string;datetime:string;court:string;type:string;status:string;}
export interface PortalFile {id:number;file_name:string;file_size?:number;created_at:string;}
export interface Receipt {id:number;file_id:number;reference:string;status:string;review_notes?:string;created_at:string;}
export interface PortalPayment {client_id?:number;client_name?:string;id:number;case_id?:number;case_number?:string;amount:number;status:string;notes:string;paid_at?:string;receipts:Receipt[];}
export interface BankDetails {bank_name?:string;beneficiary?:string;iban?:string;instructions?:string;}
export interface PortalRequest {id:number;case_id?:number;summary:string;status:string;response?:string;canReply:boolean;messages:import('./models').ConsultationMessage[];}
export interface PortalOverview {client:{id:number;name:string;email:string;phone:string};cases:PortalCase[];hearings:PortalHearing[];payments:PortalPayment[];consultations:Array<{id:number;summary:string;response?:string;status:string}>;requests:PortalRequest[];bank:BankDetails;}
export interface CaseDetails {clients?:Participant[];lawyers?:Participant[];case:PortalCase;updates:Array<{id:number;title:string;body:string;status:string;created_at:string;author_name:string}>;hearings:PortalHearing[];files:PortalFile[];documents:PortalFile[];reviews:Array<{lawyer_id?:number;client_name?:string;stars:number;comment:string;lawyer_name:string}>;payments:PortalPayment[];}
export interface PendingReceipt {id:number;payment_id:number;file_id:number;reference:string;amount:number;client_name:string;case_number?:string;}
@Injectable({providedIn:'root'})
export class PortalApiService {
 private http=inject(HttpClient);private options={withCredentials:true};
 members(id:number,clientIds:number[],lawyerIds:number[]){return this.http.patch('/api/cases/'+id,{clientIds,lawyerIds},this.options);}
 opponents(id:number){return this.http.get<Opponent[]>('/api/cases/'+id+'/opponents',this.options);}
 saveOpponent(id:number,o:Opponent){return o.id?this.http.put('/api/cases/'+id+'/opponents/'+o.id,o,this.options):this.http.post('/api/cases/'+id+'/opponents',o,this.options);}
 deleteOpponent(id:number,opponent:number){return this.http.delete('/api/cases/'+id+'/opponents/'+opponent,this.options);}
 activity(id:number){return this.http.get<CaseActivity[]>('/api/cases/'+id+'/activity',this.options);}
 overview(){return this.http.get<PortalOverview>('/api/client-portal/overview',this.options);}
 details(id:number,staff=false){return this.http.get<CaseDetails>('/api/'+(staff?'office':'client')+'-portal/cases/'+id,this.options);}
 createAccount(id:number,email:string,password:string){return this.http.post('/api/office-portal/clients/'+id+'/account',{email,password},this.options);}
 upload(id:number,files:File[],staff=false){const form=new FormData();files.forEach(file=>form.append('files',file));return this.http.post('/api/'+(staff?'office':'client')+'-portal/cases/'+id+'/files',form,this.options);}
 fileUrl(id:number,staff=false){return '/api/'+(staff?'office':'client')+'-portal/documents/'+id+'/content';}
 review(id:number,stars:number,comment:string,lawyerId?:number|null){return this.http.post('/api/client-portal/cases/'+id+'/review',{stars,comment,lawyerId},this.options);}
 update(id:number,body:{title:string;body:string;status:string}){return this.http.post('/api/office-portal/cases/'+id+'/updates',body,this.options);}
 hearing(id:number,body:{datetime:string;court:string;type:string}){return this.http.post('/api/office-portal/cases/'+id+'/hearings',body,this.options);}
 requestPayment(id:number,amount:number,notes:string,clientId?:number|null){return this.http.post('/api/office-portal/cases/'+id+'/payments',{amount,notes,clientId},this.options);}
 generalPayment(id:number,amount:number,notes:string){return this.http.post('/api/office-portal/clients/'+id+'/payments',{amount,notes},this.options);}
 receipt(id:number,reference:string,file:File){const form=new FormData();form.append('reference',reference);form.append('file',file);return this.http.post('/api/client-portal/payments/'+id+'/receipt',form,this.options);}
 bank(){return this.http.get<BankDetails>('/api/office-portal/bank',this.options);}
 saveBank(body:{bankName:string;beneficiary:string;iban:string;instructions:string}){return this.http.put('/api/office-portal/bank',body,this.options);}
 receipts(){return this.http.get<PendingReceipt[]>('/api/office-portal/receipts',this.options);}
 reviewReceipt(id:number,approve:boolean,notes:string){return this.http.post('/api/office-portal/receipts/'+id+'/review',{approve,notes},this.options);}
 consultation(summary:string,caseId:number|null){return this.http.post('/api/client-portal/consultations',{summary,caseId},this.options);}
 link(id:number,token:string){return this.http.post('/api/client-portal/consultations/link',{id,token},this.options);}
 reply(id:number,response:string){return this.http.post('/api/client-portal/consultations/'+id+'/reply',{response},this.options);}
}
export const caseStatuses:Record<string,string>={new:'فتح القضية',active:'قيد العمل',upcoming_hearing:'جلسة قادمة',adjourned:'مؤجلة',verdict:'صدر حكم',closed:'مغلقة'};
export const paymentStatuses:Record<string,string>={pending:'مطلوب السداد',overdue:'متأخر',under_review:'الإيصال قيد المراجعة',paid:'تم السداد',cancelled:'ملغي'};
export const hearingStatuses:Record<string,string>={scheduled:'مجدولة',completed:'منتهية',done:'منتهية',postponed:'مؤجلة',adjourned:'مؤجلة',cancelled:'ملغاة'};

