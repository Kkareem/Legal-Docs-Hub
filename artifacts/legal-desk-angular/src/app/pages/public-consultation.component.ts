import {PhoneInputComponent} from '../shared/phone-input.component';
import {Component,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ApiService} from '../core/api.service';
import {ConsultationTracking} from '../core/models';
@Component({standalone:true,imports:[PhoneInputComponent,FormsModule,RouterLink],template:`
<main class="page-shell" style="max-width:900px">
<div class="toolbar"><h1 class="section-title">طلب استشارة قانونية</h1><span class="toolbar-spacer"></span><a routerLink="/" class="btn btn-secondary">الرئيسية</a><a routerLink="/login" class="btn btn-secondary">دخول المكتب</a></div>
<p class="section-subtitle">أرسل استشارتك بالبريد أو الهاتف، وتابع الرد بعد التحقق من وسيلة التواصل.</p>
<form class="card form-card grid" style="margin:24px 0" #form="ngForm" (ngSubmit)="submit()">
<div class="grid grid-2">
<label>الاسم<input class="input" name="name" [(ngModel)]="name" required maxlength="200"></label>
<label>البريد الإلكتروني<input class="input" type="email" name="email" [(ngModel)]="email" [required]="!phone.trim()" email maxlength="254"></label>
<label>الهاتف<app-phone-input name="phone" [(ngModel)]="phone" [required]="!email.trim()"></app-phone-input></label>
</div><p class="meta">أدخل البريد أو الهاتف على الأقل. يمكنك إدخال الاثنين.</p>
<label>تفاصيل الاستشارة<textarea class="textarea" name="summary" [(ngModel)]="summary" required minlength="10" maxlength="10000" rows="6"></textarea></label>
<button class="btn btn-primary" [disabled]="form.invalid || busy()">إرسال الاستشارة</button></form>
@if(receipt()){<div class="card panel" role="status"><h2>تم استلام طلبك</h2><p>تابع استشاراتك باستخدام بريدك أو هاتفك في النموذج التالي.</p></div>}
@if(message()){<p role="status">{{message()}}</p>}
<form class="card form-card grid" style="margin-top:24px" #tracking="ngForm" (ngSubmit)="requestCode()">
<h2>متابعة استشاراتي</h2>
<label>المتابعة بواسطة<select class="select" name="trackingChannel" [(ngModel)]="trackingChannel" (ngModelChange)="contact='';resetTracking()"><option value="email">البريد الإلكتروني</option><option value="phone">الهاتف</option></select></label>
@if(trackingChannel==='phone'){<label>الهاتف<app-phone-input name="contactPhone" [(ngModel)]="contact" (ngModelChange)="resetTracking()" required [disabled]="trackingBusy()||replyBusy()"></app-phone-input></label>}@else{<label>البريد الإلكتروني<input class="input" type="email" email name="contact" [(ngModel)]="contact" (ngModelChange)="resetTracking()" required maxlength="254" dir="ltr" [disabled]="trackingBusy()||replyBusy()"></label>}
<p class="meta">سنرسل رمز تحقق إلى وسيلة التواصل المسجلة في الاستشارة. للهاتف استخدم مفتاح الدولة.</p>
<button class="btn btn-secondary" [disabled]="tracking.invalid||trackingBusy()">إرسال رمز تحقق</button>
</form>
@if(challengeId){<form class="card panel grid" style="margin-top:20px" #verification="ngForm" (ngSubmit)="verify()">
<label>رمز التحقق<input class="input" name="code" [(ngModel)]="code" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" autocomplete="one-time-code" dir="ltr"></label>
<button class="btn btn-primary" [disabled]="verification.invalid||trackingBusy()">تحقق وعرض الاستشارات</button>
</form>}
@if(accessToken){<div class="toolbar" style="margin-top:20px"><button class="btn btn-secondary" [disabled]="trackingBusy()||replyBusy()" (click)="track()">تحديث الاستشارات</button><button class="btn btn-secondary" [disabled]="replyBusy()" (click)="resetTracking()">إنهاء المتابعة</button></div>}
@if(accessToken&&!results().length&&!trackingBusy()){<p class="empty-state">لا توجد استشارات مرتبطة بوسيلة التواصل التي تم التحقق منها.</p>}
@for(conversation of results();track conversation.id){
<section class="card panel grid" style="margin-top:20px" aria-live="polite">
<h2>محادثة الاستشارة</h2><p style="white-space:pre-wrap">{{conversation.summary}}</p>
@for(entry of conversation.messages;track entry.id){<div class="card panel"><strong>{{entry.sender_type==='staff'?(entry.sender_name || 'المكتب'):'أنت'}}</strong><p style="white-space:pre-wrap">{{entry.body}}</p></div>}
@if(conversation.canReply){<form class="grid" #replyForm="ngForm" (ngSubmit)="reply(conversation)">
<label>ردك على المكتب<textarea class="textarea" rows="4" [name]="'visitorReply'+conversation.id" [attr.name]="'visitorReply'+conversation.id" [(ngModel)]="replies[conversation.id]" required maxlength="20000"></textarea></label>
<button class="btn btn-primary" [disabled]="replyForm.invalid||replyBusy()||!(replies[conversation.id]||'').trim()">إرسال الرد</button>
</form>}@else{<p class="badge badge-neutral">بانتظار رد المكتب — يمكنك تحديث المتابعة لاحقًا.</p>}
</section>}
</main>`})
export class PublicConsultationComponent {
 private api=inject(ApiService);
 trackingChannel='email';name='';email='';phone='';summary='';contact='';code='';challengeId='';accessToken='';
 busy=signal(false);trackingBusy=signal(false);replyBusy=signal(false);message=signal('');receipt=signal<{id:number}|null>(null);
 results=signal<ConsultationTracking[]>([]);replies:Record<number,string>={};
 private verifiedContact='';
 constructor(){try{let visitor=localStorage.getItem('legaldesk-visitor');if(!visitor){visitor=crypto.randomUUID();localStorage.setItem('legaldesk-visitor',visitor);}this.api.recordVisit(visitor).subscribe({error:()=>{}});}catch{}}
 resetTracking(){this.challengeId='';this.code='';this.accessToken='';this.verifiedContact='';this.results.set([]);this.replies={};}
 submit(){if(this.busy())return;this.busy.set(true);this.message.set('');this.api.submitConsultation({name:this.name,email:this.email,phone:this.phone,summary:this.summary}).subscribe({next:r=>{this.receipt.set(r);this.trackingChannel=this.email.trim()?'email':'phone';this.contact=this.email.trim()||this.phone.trim();this.resetTracking();this.busy.set(false);this.summary='';},error:()=>{this.busy.set(false);this.message.set('تعذر إرسال الطلب. أدخل بريدًا أو هاتفًا صحيحًا وتفاصيل الاستشارة.');}});}
 requestCode(){if(this.trackingBusy()||this.replyBusy())return;this.resetTracking();this.trackingBusy.set(true);this.message.set('');this.verifiedContact=this.contact.trim();this.api.requestConsultationCode(this.verifiedContact).subscribe({next:r=>{this.challengeId=r.challengeId;this.trackingBusy.set(false);this.message.set('تم إرسال رمز التحقق. افحص البريد الوارد والرسائل غير المرغوب فيها، أو رسائل الهاتف.');},error:e=>{this.trackingBusy.set(false);this.message.set(this.verificationError(e));}});}
 verify(){if(!this.challengeId||this.trackingBusy())return;this.trackingBusy.set(true);this.api.verifyConsultationCode(this.challengeId,this.code).subscribe({next:r=>{this.accessToken=r.accessToken;this.challengeId='';this.code='';this.trackingBusy.set(false);this.message.set('تم التحقق. صلاحية المتابعة محدودة؛ اطلب رمزًا جديدًا عند انتهائها.');this.track();},error:()=>{this.trackingBusy.set(false);this.message.set('رمز التحقق غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا بعد مهلة الإرسال.');}});}
 track(){if(!this.accessToken||this.trackingBusy()||this.replyBusy())return;this.trackingBusy.set(true);this.api.trackConsultation({accessToken:this.accessToken}).subscribe({next:r=>{this.results.set(r);this.trackingBusy.set(false);},error:()=>{this.trackingBusy.set(false);this.resetTracking();this.message.set('انتهت صلاحية المتابعة. اطلب رمز تحقق جديدًا.');}});}
 reply(conversation:ConsultationTracking){const response=(this.replies[conversation.id]||'').trim();if(!conversation.canReply||this.replyBusy()||!response)return;this.replyBusy.set(true);this.api.replyAsVisitor({id:conversation.id,accessToken:this.accessToken,response}).subscribe({next:r=>{this.results.update(items=>items.map(q=>q.id===r.id?r:q));this.replies[r.id]='';this.replyBusy.set(false);this.message.set('تم إرسال ردك للمكتب.');},error:()=>{this.replyBusy.set(false);this.message.set('تعذر إرسال الرد. حدّث المتابعة وتحقق من حالة الطلب وصلاحية المتابعة.');}});}
 private verificationError(error:any){const text=error.error?.message||'';if(text.includes('Gmail'))return 'إرسال رموز التحقق ينتظر تفعيل Gmail من إعدادات المكتب.';if(text.includes('Phone verification'))return 'التحقق بالهاتف ينتظر إعداد خدمة SMS من المكتب. استخدم البريد إن كان مسجلًا، أو تواصل مع المكتب.';if(text.includes('wait'))return 'انتظر قبل طلب رمز جديد. عدد محاولات الإرسال محدود لحماية حسابك.';return 'تعذر إرسال رمز التحقق. تحقق من وسيلة التواصل أو تواصل مع المكتب.';}
}
