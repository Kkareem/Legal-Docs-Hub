import {ApiService} from '../core/api.service';
import {Client,User} from '../core/models';
import {Opponent,CaseActivity} from '../core/portal-api.service';
import {CurrencyService} from '../core/currency.service';
import {Component,inject,signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {PortalApiService,CaseDetails,caseStatuses,paymentStatuses} from '../core/portal-api.service';
@Component({standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./case-workspace.component.html'})
export class CaseWorkspaceComponent {
 readonly currency=inject(CurrencyService);
 readonly api=inject(PortalApiService);private route=inject(ActivatedRoute);
 id=Number(this.route.snapshot.paramMap.get('id'));data=signal<CaseDetails|null>(null);busy=signal(false);message=signal('');
 statuses=caseStatuses;paymentStatuses=paymentStatuses;
 title='';body='';status='active';datetime='';court='';hearingType='جلسة';amount:number|null=null;paymentNotes='';
 readonly office=inject(ApiService);clients=signal<Client[]>([]);lawyers=signal<User[]>([]);
 clientIds:number[]=[];lawyerIds:number[]=[];payerId:number|null=null;
 opponents=signal<Opponent[]>([]);activity=signal<CaseActivity[]>([]);opponent:Opponent={};
 constructor(){this.office.listClients().subscribe(r=>this.clients.set(r));this.office.listUsers().subscribe(r=>this.lawyers.set(r.filter(u=>['lawyer','admin','owner'].includes(u.role))));this.load();}
 toggle(kind:'clientIds'|'lawyerIds',id:number){this[kind]=this[kind].includes(id)?this[kind].filter(x=>x!==id):[...this[kind],id];}
 saveMembers(){if(this.busy()||!this.clientIds.length)return;this.busy.set(true);this.api.members(this.id,this.clientIds,this.lawyerIds).subscribe({next:()=>{this.busy.set(false);this.message.set('تم تحديث المشاركين في القضية');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ المشاركين');}});}
 editOpponent(o:Opponent){this.opponent={...o,nationalId:o.national_id,relatedClientId:o.related_client_id};}
 saveOpponent(){if(this.busy())return;this.busy.set(true);this.api.saveOpponent(this.id,this.opponent).subscribe({next:()=>{this.busy.set(false);this.opponent={};this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ بيانات الخصم');}});}
 removeOpponent(o:Opponent){if(!o.id||this.busy())return;this.busy.set(true);this.api.deleteOpponent(this.id,o.id).subscribe({next:()=>{this.busy.set(false);this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر حذف الخصم');}});}
 changes(a:CaseActivity):{field:string;before:unknown;after:unknown}[]{try{return Object.entries(JSON.parse(a.changes)).map(([field,v])=>({field,...v as {before:unknown;after:unknown}}));}catch{return [];}}
 value(v:unknown){return v===null||v===undefined?'—':typeof v==='object'?JSON.stringify(v):String(v);}
 labels:Record<string,string>={cases:'القضية',case_clients:'موكل بالقضية',case_lawyers:'محامٍ بالقضية',case_opponents:'خصم',case_updates:'تقدم القضية',hearings:'جلسة',documents:'مرفق',payments:'طلب دفع',payment_receipts:'إيصال',case_reviews:'تقييم',tasks:'مهمة',consultation_requests:'استشارة',consultation_messages:'رد استشارة',powers_of_attorney:'توكيل',INSERT:'إضافة',UPDATE:'تعديل',DELETE:'حذف',status:'الحالة',name:'الاسم',phone:'الهاتف',email:'البريد',national_id:'الرقم القومي',relationship:'صلة القرابة أو العلاقة',related_client_id:'الموكل المرتبط',client_id:'رقم الموكل',user_id:'رقم المحامي',client_name:'اسم الموكل',lawyer_name:'اسم المحامي',case_number:'رقم القضية',court:'المحكمة',description:'الوصف',amount:'المبلغ',title:'العنوان',body:'التفاصيل',file_name:'اسم الملف',file_size:'حجم الملف',notes:'ملاحظات',datetime:'الموعد',type:'النوع',lead_lawyer_id:'المحامي الرئيسي',author_id:'صاحب التحديث',uploaded_by:'رفع بواسطة',id:'رقم السجل',case_id:'رقم القضية',division:'الدائرة',court_case_number:'رقم المحكمة',opposing_party:'الخصم السابق',paid_at:'تاريخ السداد',stars:'التقييم',comment:'التعليق',lawyer_id:'رقم المحامي',reference:'مرجع التحويل',review_notes:'ملاحظات المراجعة'};

 load(){this.api.details(this.id,true).subscribe({next:r=>{this.data.set(r);this.status=r.case.status;this.clientIds=(r.clients||[]).map(x=>x.id);this.lawyerIds=(r.lawyers||[]).map(x=>x.id);if(!this.clientIds.includes(this.payerId||0))this.payerId=this.clientIds.length===1?this.clientIds[0]:null;this.api.opponents(this.id).subscribe(x=>this.opponents.set(x));this.api.activity(this.id).subscribe(x=>this.activity.set(x));},error:()=>this.message.set('تعذر عرض القضية أو ليست مسندة إليك')});}
 update(){if(this.busy())return;this.busy.set(true);this.api.update(this.id,{title:this.title,body:this.body,status:this.status}).subscribe({next:()=>{this.busy.set(false);this.title='';this.body='';this.message.set('تم نشر التحديث للموكل');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر نشر التحديث');}});}
 hearing(){if(this.busy()||!this.datetime)return;this.busy.set(true);this.api.hearing(this.id,{datetime:new Date(this.datetime).toISOString(),court:this.court,type:this.hearingType}).subscribe({next:()=>{this.busy.set(false);this.datetime='';this.message.set('تم تسجيل الجلسة وإظهارها للموكل');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر إضافة الجلسة');}});}
 payment(){if(this.busy()||!this.amount)return;this.busy.set(true);this.api.requestPayment(this.id,this.amount,this.paymentNotes,this.payerId).subscribe({next:()=>{this.busy.set(false);this.amount=null;this.paymentNotes='';this.message.set('تم إرسال طلب الدفع للموكل');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر إنشاء طلب الدفع');}});}
 upload(input:HTMLInputElement){if(!input.files?.length||this.busy())return;this.busy.set(true);this.api.upload(this.id,Array.from(input.files),true).subscribe({next:()=>{input.value='';this.busy.set(false);this.message.set('تم رفع المرفقات ومشاركتها مع الموكل');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر الرفع. الحد 10 ملفات، 20 ميجابايت لكل ملف و50 ميجابايت للمجموعة.');}});}
}

