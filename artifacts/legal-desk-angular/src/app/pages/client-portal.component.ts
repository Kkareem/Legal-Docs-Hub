import {CurrencyService} from '../core/currency.service';
import {Component,inject,signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../core/auth.service';
import {PortalApiService,PortalOverview,CaseDetails,caseStatuses,paymentStatuses,hearingStatuses} from '../core/portal-api.service';
@Component({standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./client-portal.component.html'})
export class ClientPortalComponent {
 readonly currency=inject(CurrencyService);
 readonly api=inject(PortalApiService);readonly auth=inject(AuthService);
 overview=signal<PortalOverview|null>(null);details=signal<CaseDetails|null>(null);
 loading=signal(true);busy=signal(false);message=signal('');tab=signal('cases');
 caseStatuses=caseStatuses;paymentStatuses=paymentStatuses;hearingStatuses=hearingStatuses;
 reviewLawyerId:number|null=null;
 stars=5;comment='';summary='';consultCaseId:number|null=null;linkId:number|null=null;linkToken='';
 replies:Record<number,string>={};references:Record<number,string>={};
 constructor(){this.load();}
 load(){this.loading.set(true);this.api.overview().subscribe({next:r=>{this.overview.set(r);this.loading.set(false);},error:()=>{this.loading.set(false);this.message.set('تعذر تحميل بياناتك. تواصل مع المكتب للتأكد من ربط الحساب.');}});}
 selectCase(id:number){this.details.set(null);this.api.details(id).subscribe({next:r=>{this.details.set(r);this.reviewLawyerId=this.unreviewedLawyers()[0]?.id||null;this.comment='';this.stars=5;},error:()=>this.message.set('تعذر عرض القضية')});}
 logout(){this.auth.logout().subscribe();}
 upload(input:HTMLInputElement){const c=this.details()?.case;if(!c||!input.files?.length||this.busy())return;
 const files=Array.from(input.files);if(files.length>10||files.some(f=>f.size>20*1024*1024)||files.reduce((s,f)=>s+f.size,0)>50*1024*1024){this.message.set('الحد 10 مرفقات، 20 ميجابايت للملف و50 ميجابايت للمجموعة.');return;}
 this.busy.set(true);this.api.upload(c.id,files).subscribe({next:()=>{input.value='';this.busy.set(false);this.message.set('تم رفع جميع المرفقات');this.selectCase(c.id);},error:()=>{this.busy.set(false);this.message.set('تعذر رفع المرفقات');}});}
 unreviewedLawyers(){const d=this.details();if(!d)return [];const lawyers=d.lawyers|| (d.case.lead_lawyer_id?[{id:d.case.lead_lawyer_id,name:d.case.lawyer_name||''}]:[]);return lawyers.filter(l=>!d.reviews.some(r=>r.lawyer_id===l.id||(!r.lawyer_id&&lawyers.length===1)));}
 review(){const c=this.details()?.case;if(!c||this.busy())return;this.busy.set(true);
 this.api.review(c.id,this.stars,this.comment,this.reviewLawyerId).subscribe({next:()=>{this.busy.set(false);this.message.set('شكرًا، تم حفظ تقييمك للمحامي');this.selectCase(c.id);},error:()=>{this.busy.set(false);this.message.set('التقييم متاح مرة واحدة فقط بعد إغلاق القضية.');}});}
 sendReceipt(id:number,input:HTMLInputElement){const file=input.files?.[0];if(!file||!this.references[id]?.trim()||this.busy())return;
 if(file.size>20*1024*1024 || file.size===0){this.message.set('الإيصال يجب ألا يكون فارغًا، وبحد أقصى 20 ميجابايت.');return;}this.busy.set(true);
 this.api.receipt(id,this.references[id],file).subscribe({next:()=>{input.value='';this.busy.set(false);this.message.set('تم إرسال الإيصال للمراجعة. سيؤكد المكتب السداد بعد التحقق.');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر إرسال الإيصال. تحقق من الحجم وحالة طلب الدفع.');}});}
 newConsultation(){if(this.busy()||this.summary.trim().length<10)return;this.busy.set(true);
 this.api.consultation(this.summary,this.consultCaseId).subscribe({next:()=>{this.busy.set(false);this.summary='';this.message.set('تم إرسال الاستشارة للمكتب');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر إرسال الاستشارة');}});}
 link(){if(!this.linkId||!this.linkToken.trim()||this.busy())return;this.busy.set(true);
 this.api.link(this.linkId,this.linkToken.trim()).subscribe({next:()=>{this.busy.set(false);this.linkToken='';this.message.set('تم ربط الاستشارة بحسابك');this.load();},error:()=>{this.busy.set(false);this.message.set('تحقق من رقم الطلب والرمز السري.');}});}
 reply(id:number){if(this.busy()||!this.replies[id]?.trim())return;this.busy.set(true);
 this.api.reply(id,this.replies[id]).subscribe({next:()=>{this.busy.set(false);this.replies[id]='';this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر إرسال الرد. حدّث الصفحة وتحقق من حالة المحادثة.');}});}
}

