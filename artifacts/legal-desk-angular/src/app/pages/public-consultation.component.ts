import {Component,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {ConsultationTracking} from '../core/models';
@Component({standalone:true,imports:[FormsModule,RouterLink],template:`
<main class="page-shell" style="max-width:900px">
<div class="toolbar"><h1 class="section-title">طلب استشارة قانونية</h1><span class="toolbar-spacer"></span><a routerLink="/login" class="btn btn-secondary">دخول المكتب</a></div>
<p class="section-subtitle">أرسل طلبك للمكتب وتابع رد الإدارة أو المحامي المختص باستخدام بيانات المتابعة السرية.</p>
<form class="card form-card grid" style="margin:24px 0" #form="ngForm" (ngSubmit)="submit()">
<div class="grid grid-2">
<label>الاسم<input class="input" name="name" [(ngModel)]="name" required maxlength="200"></label>
<label>البريد الإلكتروني<input class="input" type="email" name="email" [(ngModel)]="email" required email maxlength="254"></label>
<label>الهاتف<input class="input" name="phone" type="tel" [(ngModel)]="phone" required maxlength="40"></label>
</div><label>تفاصيل الاستشارة<textarea class="textarea" name="summary" [(ngModel)]="summary" required minlength="10" maxlength="10000" rows="6"></textarea></label>
<button class="btn btn-primary" [disabled]="form.invalid || busy()">إرسال الاستشارة</button></form>
@if(receipt()){<div class="card panel" role="status"><h2>تم استلام طلبك</h2><p>احفظ هذه البيانات؛ لن تتمكن من متابعة الرد دون الرمز السري.</p>
<p>رقم الطلب: <strong>{{receipt()?.id}}</strong></p><p style="overflow-wrap:anywhere">الرمز السري: <strong dir="ltr">{{receipt()?.token}}</strong></p></div>}
@if(message()){<p role="status">{{message()}}</p>}
<form class="card form-card grid" style="margin-top:24px" #tracking="ngForm" (ngSubmit)="track()">
<h2>متابعة الاستشارة</h2>
<label>رقم الطلب<input class="input" name="id" type="number" min="1" [(ngModel)]="id" (ngModelChange)="result.set(null)" required [disabled]="replyBusy() || trackingBusy()"></label>
<label>الرمز السري<input class="input" name="token" [(ngModel)]="token" (ngModelChange)="result.set(null)" required dir="ltr" [disabled]="replyBusy() || trackingBusy()"></label>
<button class="btn btn-secondary" [disabled]="tracking.invalid || trackingBusy()">عرض الرد</button>
</form>
@if(result();as conversation){
<section class="card panel grid" style="margin-top:20px" aria-live="polite">
<h2>محادثة الاستشارة #{{conversation.id}}</h2>
<p style="white-space:pre-wrap">{{conversation.summary}}</p>
@for(entry of conversation.messages;track entry.id){
<div class="card panel"><strong>{{entry.sender_type==='staff'?(entry.sender_name || 'المكتب'):'أنت'}}</strong><p style="white-space:pre-wrap">{{entry.body}}</p></div>
}
@if(conversation.canReply){
<form class="grid" #replyForm="ngForm" (ngSubmit)="reply()">
<label>ردك على المكتب<textarea class="textarea" rows="4" name="visitorReply" [(ngModel)]="visitorReply" required maxlength="20000"></textarea></label>
<button class="btn btn-primary" [disabled]="replyForm.invalid || replyBusy() || !visitorReply.trim()">إرسال الرد</button>
</form>
}@else{<p class="badge badge-neutral">بانتظار رد المكتب — يمكنك تحديث المتابعة لاحقًا.</p>}
</section>
}
</main>`})
export class PublicConsultationComponent {
 private api=inject(ApiService);
 name='';email='';phone='';summary='';id:number|null=null;token='';
 busy=signal(false);trackingBusy=signal(false);message=signal('');receipt=signal<{id:number;token:string}|null>(null);
 result=signal<ConsultationTracking|null>(null);
 visitorReply='';replyBusy=signal(false);
 private trackedToken='';
 constructor(){try{let visitor=localStorage.getItem('legaldesk-visitor');if(!visitor){visitor=crypto.randomUUID();localStorage.setItem('legaldesk-visitor',visitor);}this.api.recordVisit(visitor).subscribe({error:()=>{}});}catch{}}
 submit(){if(this.busy())return;this.busy.set(true);this.message.set('');
 this.api.submitConsultation({name:this.name,email:this.email,phone:this.phone,summary:this.summary}).subscribe({
 next:r=>{this.receipt.set(r);this.id=r.id;this.token=r.token;this.busy.set(false);this.summary='';},
 error:()=>{this.busy.set(false);this.message.set('تعذر إرسال الطلب. تحقق من البيانات وحاول مجددًا.');}
 });}
 track(){if(this.trackingBusy() || this.replyBusy())return;this.trackingBusy.set(true);this.result.set(null);this.message.set('');
 const trackingToken=this.token.trim();
 this.api.trackConsultation({id:this.id,token:trackingToken}).subscribe({
 next:r=>{this.trackedToken=trackingToken;this.visitorReply='';this.result.set(r);this.trackingBusy.set(false);},
 error:()=>{this.trackingBusy.set(false);this.message.set('تعذر العثور على الطلب. تحقق من الرقم والرمز السري.');}
 });}
 reply(){const conversation=this.result();if(!conversation?.canReply || this.replyBusy() || !this.visitorReply.trim())return;
 this.replyBusy.set(true);this.message.set('');
 this.api.replyAsVisitor({id:conversation.id,token:this.trackedToken,response:this.visitorReply}).subscribe({
 next:r=>{this.result.set(r);this.visitorReply='';this.replyBusy.set(false);this.message.set('تم إرسال ردك للمكتب.');},
 error:()=>{this.replyBusy.set(false);this.message.set('تعذر إرسال الرد. حدّث المتابعة وتحقق من حالة الطلب.');}
 });}
}

