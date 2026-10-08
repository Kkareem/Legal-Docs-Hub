import {Component,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {NotificationService,NoticePreferences} from '../core/notification.service';
import {AuthService} from '../core/auth.service';
import {CurrencyService} from '../core/currency.service';
@Component({standalone:true,imports:[FormsModule,RouterLink],template:`
<main class="page-shell"><div class="toolbar"><h1 class="section-title">الإعدادات</h1><a class="btn btn-secondary" [routerLink]="auth.user()?.role==='client'?'/my-account':'/dashboard'">العودة لحسابي</a></div>
@if(message()){<p class="card panel" role="status">{{message()}}</p>}
<section class="card panel grid" style="margin-top:24px"><h2>قنوات إشعاراتي</h2><p>إعدادات مستقلة لحسابك، تسري على جميع أجهزتك.</p>
@if(loaded()){
<label class="check-row"><input type="checkbox" [(ngModel)]="prefs.site_enabled">إشعارات داخل الموقع والعداد</label>
<label class="check-row"><input type="checkbox" [(ngModel)]="prefs.email_enabled">البريد الإلكتروني</label>
@if(!notices.config()?.emailReady){<p class="meta">إرسال البريد ينتظر تفعيل Gmail الخاص بالمكتب.</p>}
<label class="check-row"><input type="checkbox" [(ngModel)]="prefs.browser_enabled" (ngModelChange)="browserChanged($event)">إشعارات المتصفح</label>
<p class="meta">تفعيل المتصفح يحتاج إذنك على كل جهاز. على iPhone أضف التطبيق للشاشة الرئيسية وافتحه منها. إيقاف القناة يلغي اشتراكات جميع أجهزتك.</p>
@if(prefs.browser_enabled){<button class="btn btn-secondary" [disabled]="busy()" (click)="enableDevice()">السماح بالإشعارات على هذا الجهاز</button>}
<button class="btn btn-primary" [disabled]="busy()" (click)="save()">حفظ تفضيلاتي</button>
}@else{<p>جارٍ تحميل الإعدادات...</p>}
</section>
@if(admin()){
<form class="card panel grid" style="margin-top:24px" #mailForm="ngForm" (ngSubmit)="saveGmail()"><h2>بريد المكتب عبر Gmail</h2><p>يمكن استخدام حساب Gmail عادي. لا تحتاج دومين أو سيرفر بريد خاص.</p>
<label class="check-row"><input name="mailEnabled" type="checkbox" [(ngModel)]="mailEnabled">تفعيل إرسال إشعارات المكتب عبر Gmail</label>
<label>عنوان Gmail<input class="input" type="email" dir="ltr" name="email" [(ngModel)]="email" [required]="mailEnabled" email autocomplete="username"></label>
<label>كلمة مرور تطبيق Google<input class="input" type="password" dir="ltr" name="password" [(ngModel)]="password" autocomplete="new-password" maxlength="500" [required]="mailEnabled&&!passwordConfigured"></label>
<p class="meta">{{passwordConfigured?'كلمة مرور التطبيق محفوظة؛ اترك الحقل فارغًا للاحتفاظ بها.':'فعّل التحقق بخطوتين بحساب Google ثم أنشئ كلمة مرور تطبيق.'}} لا تستخدم كلمة مرور حساب Gmail العادية.</p>
<a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">إنشاء كلمة مرور تطبيق في Google</a>
<button class="btn btn-primary" [disabled]="busy()||!mailLoaded()||mailForm.invalid">حفظ بريد المكتب</button>
<div class="toolbar">@for(d of delivery;track d.status){<span class="badge badge-neutral">{{deliveryLabels[d.status]||d.status}}: {{d.count}}</span>}<button type="button" class="btn btn-secondary" (click)="loadEmail()">تحديث حالة الإرسال</button></div>
<p class="meta">لو ظهر فشل في الإرسال، راجع عنوان Gmail وكلمة مرور التطبيق واتصال السيرفر بالإنترنت.</p></form>
<section class="card panel" style="margin-top:24px"><h2>عملة نسخة المكتب</h2><p>العملة الحالية: <strong>{{currency.code()}}</strong></p><p class="meta">تُضبط عند تجهيز نسخة المكتب قبل تسجيل العمليات المالية. تغيير الرمز لا يحوّل الأرصدة بين العملات.</p></section>
}
</main>`})
export class SettingsComponent {
 readonly notices=inject(NotificationService);readonly auth=inject(AuthService);readonly currency=inject(CurrencyService);private http=inject(HttpClient);
 prefs:NoticePreferences={site_enabled:true,email_enabled:true,browser_enabled:false};loaded=signal(false);mailLoaded=signal(false);busy=signal(false);message=signal('');
 mailEnabled=false;email='';password='';passwordConfigured=false;delivery:Array<{status:string;count:number}>=[];deliveryLabels:Record<string,string>={pending:'في الانتظار',sending:'جاري الإرسال',sent:'مرسلة',failed:'تعذر إرسالها',skipped:'ملغاة'};
 admin(){return ['admin','owner'].includes(this.auth.user()?.role||'');}
 constructor(){this.notices.refresh().subscribe({next:r=>{this.prefs={...r.prefs};this.loaded.set(true);},error:()=>this.message.set('تعذر تحميل الإعدادات. أعد تحميل الصفحة.')});if(this.admin())this.loadEmail();}
 loadEmail(){this.http.get<any>('/api/settings/email',this.notices.options).subscribe({next:r=>{this.mailEnabled=r.enabled;this.email=r.email;this.passwordConfigured=r.password_configured;this.delivery=r.delivery||[];this.mailLoaded.set(true);},error:()=>this.message.set('تعذر تحميل بريد المكتب')});}
 async browserChanged(enabled:boolean){if(enabled)await this.enableDevice();}
 async enableDevice(){this.busy.set(true);try{await this.notices.enableBrowser();this.message.set('تم السماح لهذا الجهاز. اضغط حفظ تفضيلاتي لتفعيل القناة.');}catch(e){this.prefs.browser_enabled=false;this.message.set(e instanceof Error?e.message:'تعذر تفعيل إشعارات المتصفح.');}finally{this.busy.set(false);}}
 save(){if(this.busy())return;this.busy.set(true);this.notices.savePreferences(this.prefs).subscribe({next:p=>{this.notices.preferences.set(p);if(!p.site_enabled)this.notices.items.set([]);this.busy.set(false);this.message.set('تم حفظ تفضيلات الإشعارات');},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ التفضيلات');}});}
 saveGmail(){this.busy.set(true);this.http.put('/api/settings/email',{enabled:this.mailEnabled,email:this.email,password:this.password||null},this.notices.options).subscribe({next:()=>{this.passwordConfigured=this.passwordConfigured||!!this.password;this.password='';this.busy.set(false);this.notices.config.update(c=>c?{...c,emailReady:this.mailEnabled}:c);this.message.set('تم حفظ إعدادات Gmail. ستُرسل الإشعارات الجديدة بعد تفعيل البريد.');},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ Gmail. تحقق من العنوان وكلمة مرور التطبيق.');}});}
}
