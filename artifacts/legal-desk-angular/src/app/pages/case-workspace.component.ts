import {CaseTimelineComponent} from '../shared/case-timeline.component';
import {MemberPickerComponent} from '../shared/member-picker.component';
import {IconComponent} from '../shared/icon.component';
import {RouterLink} from '@angular/router';
import {PhoneInputComponent} from '../shared/phone-input.component';
import {ApiService} from '../core/api.service';
import {Client,User} from '../core/models';
import {Opponent,CaseActivity,HearingRequestBody,PortalHearing} from '../core/portal-api.service';
import {CurrencyService} from '../core/currency.service';
import {Component,inject,signal,computed,afterNextRender,Injector,ElementRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {PortalApiService,CaseDetails,caseStatuses,paymentStatuses} from '../core/portal-api.service';
@Component({standalone:true,imports:[CaseTimelineComponent,MemberPickerComponent,IconComponent,RouterLink,PhoneInputComponent,CommonModule,FormsModule],templateUrl:'./case-workspace.component.html',styleUrl:'./case-workspace.component.scss'})
export class CaseWorkspaceComponent {
 readonly tabs=[{id:'overview',label:'نظرة عامة'},{id:'hearings',label:'الجلسات'},{id:'files',label:'المرفقات'},{id:'payments',label:'المدفوعات'},{id:'people',label:'الأطراف'},{id:'audit',label:'سجل الإجراءات'}] as const;
 activeTab=signal<string>('overview');editor=signal<string|null>(null);loading=signal(true);
 nextHearing=computed(()=>[...(this.data()?.hearings||[])].filter(h=>new Date(h.datetime).getTime()>=Date.now()&&!['cancelled','completed'].includes(h.status)).sort((a,b)=>Date.parse(a.datetime)-Date.parse(b.datetime))[0]);
 sortedUpdates=computed(()=>[...(this.data()?.updates||[])].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)));
 pendingPayments=computed(()=>(this.data()?.payments||[]).filter(p=>!['paid','cancelled'].includes(p.status)));
 selectTab(tab:string){this.closeEditor();this.activeTab.set(tab);}
 private injector=inject(Injector);private host=inject(ElementRef);
 openEditor(kind:string){this.closeEditor();this.editor.set(kind);afterNextRender(()=>{const panel=this.host.nativeElement.querySelector('.editor-panel');panel?.scrollIntoView?.({behavior:'smooth',block:'start'});},{injector:this.injector});}
 closeEditor(){if(this.editor()==='members'){this.clientIds=(this.data()?.clients||[]).map(c=>c.id);this.lawyerIds=(this.data()?.lawyers||[]).map(l=>l.id);}if(this.editor()==='opponent')this.opponent={};this.editor.set(null);}
 initials(name:string){return name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('');}
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
 reportHearingId=0;reportBody='';hearingRequests:HearingRequestBody[]=[];
 openReport(h:PortalHearing){this.openEditor('report');this.reportHearingId=h.id;this.reportBody='';this.hearingRequests=[];}
 addRequest(){if(this.hearingRequests.length<20)this.hearingRequests.push({clientId:this.clientIds.length===1?this.clientIds[0]:null,title:'',details:'',kind:'document',targetHearingId:null,dueAt:null});}
 saveReport(){if(this.busy()||!this.reportBody.trim())return;this.busy.set(true);const requests=this.hearingRequests.map(r=>({...r,dueAt:r.dueAt?new Date(r.dueAt).toISOString():null}));this.api.reportHearing(this.id,this.reportHearingId,this.reportBody,requests).subscribe({next:()=>{this.busy.set(false);this.editor.set(null);this.message.set('تم تسجيل تفاصيل الجلسة والطلبات');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر الحفظ. تأكد من تفاصيل الطلب والموكل والجلسة.');}});}
 saveMembers(){if(this.busy()||!this.clientIds.length)return;this.busy.set(true);this.api.members(this.id,this.clientIds,this.lawyerIds).subscribe({next:()=>{this.busy.set(false);this.message.set('تم تحديث المشاركين في القضية');this.editor.set(null);this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ المشاركين');}});}
 editOpponent(o:Opponent){this.openEditor('opponent');this.opponent={...o,nationalId:o.national_id,relatedClientId:o.related_client_id};}
 saveOpponent(){if(this.busy())return;this.busy.set(true);this.api.saveOpponent(this.id,this.opponent).subscribe({next:()=>{this.busy.set(false);this.opponent={};this.editor.set(null);this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ بيانات الخصم');}});}
 removeOpponent(o:Opponent){if(!o.id||this.busy())return;this.busy.set(true);this.api.deleteOpponent(this.id,o.id).subscribe({next:()=>{this.busy.set(false);this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر حذف الخصم');}});}
 hearingNumber(id:number){return this.data()?.hearings.find(h=>h.id===id)?.hearing_number||id;}
 activityDescription(a:CaseActivity){
  const changes=this.changes(a);let context:Record<string,unknown>={};try{context=JSON.parse(a.context||'{}');}catch{}
  const fields:Record<string,unknown>={...context};for(const c of changes)fields[c.field]=c.after??c.before;
  const action=a.action==='INSERT'?'تمت إضافة':a.action==='DELETE'?'تم حذف':'تم تحديث';
  const title=this.labels[a.entity]||a.entity;
  if(a.entity==='hearings'&&!fields['hearing_number']&&fields['id'])fields['hearing_number']=this.hearingNumber(Number(fields['id']));
  let heading=`${action} ${title}`;
  if(a.entity==='hearings'||a.entity==='hearing_reports')heading+=` رقم ${fields['hearing_number']||fields['hearing_id']||fields['id']||''}`;
  if(a.entity==='case_opponents'&&fields['name'])heading+=` باسم ${fields['name']}`;
  if(a.entity==='case_client_requests'&&fields['status']==='completed')heading='تم تلبية طلب الموكل: '+fields['title'];
  if(a.entity==='payments'&&fields['status']==='paid')heading='تم دفع الرسوم المطلوبة وتأكيد السداد';
  const fieldLabels:Record<string,string>={...this.labels,hearing_number:'رقم الجلسة',hearing_id:'الجلسة',target_hearing_number:'الجلسة المطلوب التقديم فيها',details:'تفاصيل الطلب',completion_notes:'تفاصيل تنفيذ الطلب',completed_at:'وقت تلبية الطلب',due_at:'موعد التسليم',kind:'نوع الطلب',attached_files:'المستندات المقدمة',request_title:'الطلب المرتبط بالمستند',reference:'مرجع التحويل',payment_id:'طلب الدفع',reviewed_by:'راجع الإيصال',sender_name:'صاحب الرد',sender_type:'نوع صاحب الرد',response:'الرد',summary:'ملخص الاستشارة',request_id:'الاستشارة',doc_type:'نوع المستند',is_original:'مستند أصلي',assigned_to:'المسؤول'};
  const hidden=new Set(['id','case_id','client_id','created_by','completed_by','uploaded_by','assigned_lawyer','report_id','target_hearing_id','hearing_id','user_id','lead_lawyer_id','lawyer_id','related_client_id','reviewed_by','assigned_to','storage_key','file_url','content','content_type','file_size']);
  const lines=[heading+'، بواسطة '+a.actor_name+'.'];
  for(const [key,value] of Object.entries(fields)){if(hidden.has(key)||!fieldLabels[key]||value===null||value===undefined||value==='')continue;
   let text=String(value);if(key==='status')text=(a.entity==='payments'?this.paymentStatuses[text]:a.entity==='cases'||a.entity==='case_updates'?this.statuses[text]:undefined)||({pending:'بانتظار التنفيذ',answered:'تم الرد',active:'قيد العمل',completed:'تم التنفيذ',scheduled:'مجدولة',submitted:'الإيصال قيد المراجعة',approved:'تم اعتماد الإيصال',rejected:'تم رفض الإيصال'} as Record<string,string>)[text]||text;
   if(key==='is_original')text=value?'نعم':'لا';
   if(key==='type')text=({civil:'مدني',criminal:'جنائي',commercial:'تجاري',family:'أسري',labor:'عمالي',administrative:'إداري',case_fee:'أتعاب القضية',other:'أخرى',session:'جلسة'} as Record<string,string>)[text]||text;
   if(key==='kind')text=text==='document'?'تقديم مستند':'إجراء آخر';
   if(['datetime','due_at','completed_at','paid_at','reviewed_at'].includes(key))text=new Date(text).toLocaleString('ar-EG');
   if(a.action==='UPDATE'&&changes.some(c=>c.field===key&&c.before!=null&&c.after!=null)) {const change=changes.find(c=>c.field===key)!;lines.push(`${fieldLabels[key]||key}: تغير من «${this.value(change.before)}» إلى «${text}».`);}else lines.push(`${fieldLabels[key]||key}: ${text}.`);
  }
  return lines.join('\n');
 }
 changes(a:CaseActivity):{field:string;before:unknown;after:unknown}[]{try{return Object.entries(JSON.parse(a.changes)).map(([field,v])=>({field,...v as {before:unknown;after:unknown}}));}catch{return [];}}
 value(v:unknown){return v===null||v===undefined?'—':typeof v==='object'?JSON.stringify(v):String(v);}
 labels:Record<string,string>={cases:'القضية',case_clients:'موكل بالقضية',case_lawyers:'محامٍ بالقضية',case_opponents:'خصم',hearing_reports:'تحديث الجلسة',case_client_requests:'طلب من الموكل',case_updates:'تقدم القضية',hearings:'جلسة',documents:'مرفق',payments:'طلب دفع',payment_receipts:'إيصال',case_reviews:'تقييم',tasks:'مهمة',consultation_requests:'استشارة',consultation_messages:'رد استشارة',powers_of_attorney:'توكيل',INSERT:'إضافة',UPDATE:'تعديل',DELETE:'حذف',status:'الحالة',name:'الاسم',phone:'الهاتف',email:'البريد',national_id:'الرقم القومي',relationship:'صلة القرابة أو العلاقة',related_client_id:'الموكل المرتبط',client_id:'رقم الموكل',user_id:'رقم المحامي',client_name:'اسم الموكل',lawyer_name:'اسم المحامي',case_number:'رقم القضية',court:'المحكمة',description:'الوصف',amount:'المبلغ',title:'العنوان',body:'التفاصيل',file_name:'اسم الملف',file_size:'حجم الملف',notes:'ملاحظات',datetime:'الموعد',type:'النوع',lead_lawyer_id:'المحامي الرئيسي',author_id:'صاحب التحديث',uploaded_by:'رفع بواسطة',id:'رقم السجل',case_id:'رقم القضية',division:'الدائرة',court_case_number:'رقم المحكمة',opposing_party:'الخصم السابق',paid_at:'تاريخ السداد',stars:'التقييم',comment:'التعليق',lawyer_id:'رقم المحامي',reference:'مرجع التحويل',review_notes:'ملاحظات المراجعة'};

 load(){this.api.details(this.id,true).subscribe({next:r=>{this.loading.set(false);this.data.set(r);this.status=r.case.status;this.clientIds=(r.clients||[]).map(x=>x.id);this.lawyerIds=(r.lawyers||[]).map(x=>x.id);if(!this.clientIds.includes(this.payerId||0))this.payerId=this.clientIds.length===1?this.clientIds[0]:null;this.api.opponents(this.id).subscribe(x=>this.opponents.set(x));this.api.activity(this.id).subscribe(x=>this.activity.set(x));},error:()=>{this.loading.set(false);this.message.set('تعذر عرض القضية أو ليست مسندة إليك');}});}
 update(){if(this.busy())return;this.busy.set(true);this.api.update(this.id,{title:this.title,body:this.body,status:this.status}).subscribe({next:()=>{this.busy.set(false);this.title='';this.body='';this.message.set('تم نشر التحديث للموكل');this.editor.set(null);this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر نشر التحديث');}});}
 hearing(){if(this.busy()||!this.datetime)return;this.busy.set(true);this.api.hearing(this.id,{datetime:new Date(this.datetime).toISOString(),court:this.court,type:this.hearingType}).subscribe({next:()=>{this.busy.set(false);this.datetime='';this.message.set('تم تسجيل الجلسة وإظهارها للموكل');this.editor.set(null);this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر إضافة الجلسة');}});}
 payment(){if(this.busy()||!this.amount)return;this.busy.set(true);this.api.requestPayment(this.id,this.amount,this.paymentNotes,this.payerId).subscribe({next:()=>{this.busy.set(false);this.amount=null;this.paymentNotes='';this.message.set('تم إرسال طلب الدفع للموكل');this.editor.set(null);this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر إنشاء طلب الدفع');}});}
 upload(input:HTMLInputElement){if(!input.files?.length||this.busy())return;this.busy.set(true);this.api.upload(this.id,Array.from(input.files),true).subscribe({next:()=>{input.value='';this.busy.set(false);this.message.set('تم رفع المرفقات ومشاركتها مع الموكل');this.editor.set(null);this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر الرفع. الحد 10 ملفات، 20 ميجابايت لكل ملف و50 ميجابايت للمجموعة.');}});}
}

