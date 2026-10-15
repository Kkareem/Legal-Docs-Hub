import {PhoneInputComponent} from '../shared/phone-input.component';
import {Component,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {NotificationService,NoticePreferences} from '../core/notification.service';
import {AuthService} from '../core/auth.service';
import {CurrencyService} from '../core/currency.service';
import {ApiService} from '../core/api.service';
import {User} from '../core/models';
@Component({standalone:true,imports:[PhoneInputComponent,FormsModule,RouterLink],template:`
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
<form class="card panel grid" style="margin-top:24px" #bankForm="ngForm" (ngSubmit)="saveBank()"><h2>الحساب البنكي للمكتب</h2>
<div class="grid grid-2"><label>اسم البنك<input class="input" name="bankName" [(ngModel)]="bank.bankName" required maxlength="200"></label><label>اسم المستفيد<input class="input" name="beneficiary" [(ngModel)]="bank.beneficiary" required maxlength="200"></label></div>
<label>IBAN<input class="input" name="iban" [(ngModel)]="bank.iban" dir="ltr" required pattern="[A-Z]{2}[A-Z0-9]{13,32}" maxlength="34"></label><label>تعليمات التحويل<textarea class="textarea" name="instructions" [(ngModel)]="bank.instructions" maxlength="2000"></textarea></label>
<button class="btn btn-primary" [disabled]="busy()||!bankLoaded()||bankForm.invalid">حفظ الحساب البنكي</button></form>
<form class="card panel grid" style="margin-top:24px" #sessionForm="ngForm" (ngSubmit)="saveSession()"><h2>الدخول ورموز التحقق</h2><p class="meta">الدخول باستخدام JWT محفوظ في ملف ارتباط محمي. مدة الدخول ثابتة من لحظة الدخول، وتغييرها يسري على مرات الدخول الجديدة.</p>
<div class="grid grid-2"><label>مدة الدخول بالدقائق<input class="input" type="number" name="durationMinutes" [(ngModel)]="session.durationMinutes" required min="5" max="1440"></label><label>صلاحية رابط استعادة كلمة المرور بالدقائق<input class="input" type="number" name="passwordResetMinutes" [(ngModel)]="session.passwordResetMinutes" required min="5" max="60"></label><label>صلاحية رمز التحقق بالدقائق<input class="input" type="number" name="codeMinutes" [(ngModel)]="session.codeMinutes" required min="2" max="15"></label><label>صلاحية متابعة الزائر بالدقائق<input class="input" type="number" name="accessMinutes" [(ngModel)]="session.accessMinutes" required min="5" max="60"></label><label>محاولات إدخال الرمز<input class="input" type="number" name="maxAttempts" [(ngModel)]="session.maxAttempts" required min="3" max="10"></label><label>مهلة إعادة الإرسال بالثواني<input class="input" type="number" name="resendSeconds" [(ngModel)]="session.resendSeconds" required min="30" max="300"></label></div>
<button class="btn btn-primary" [disabled]="busy()||!officeLoaded()||sessionForm.invalid">حفظ إعدادات الدخول</button></form>
<form class="card panel grid" style="margin-top:24px" #smsForm="ngForm" (ngSubmit)="saveSms()"><h2>رموز التحقق للهاتف — SMS</h2><p class="meta">الربط المتاح: Twilio. يحتاج حسابًا ومرسلًا ورصيدًا لدى المزود، ويظل الإرسال متوقفًا حتى تفعيله هنا.</p>
<label class="check-row"><input type="checkbox" name="smsEnabled" [(ngModel)]="sms.enabled">تفعيل إرسال رموز التحقق للهاتف</label>
<label>Account SID<input class="input" name="sid" [(ngModel)]="sms.accountSid" dir="ltr" [required]="sms.enabled" maxlength="100"></label><label>رقم أو اسم المرسل<input class="input" name="sender" [(ngModel)]="sms.sender" dir="ltr" [required]="sms.enabled" maxlength="100"></label><label>Auth Token<input class="input" type="password" name="smsToken" [(ngModel)]="sms.authToken" dir="ltr" [required]="sms.enabled&&!sms.tokenConfigured" autocomplete="new-password" maxlength="500"></label>
<p class="meta">{{sms.tokenConfigured?'بيانات الدخول محفوظة ومشفرة؛ اترك الحقل فارغًا للاحتفاظ بها.':'أدخل بيانات الحساب من لوحة المزود.'}}</p>
<button class="btn btn-primary" [disabled]="busy()||!smsLoaded()||smsForm.invalid">حفظ إعدادات SMS</button></form>
<form class="card panel grid" style="margin-top:24px" #currencyForm="ngForm" (ngSubmit)="saveCurrency()"><h2>عملة نسخة المكتب</h2><label>رمز العملة<input class="input" name="currency" [(ngModel)]="currencyCode" dir="ltr" required pattern="[A-Z]{3}" maxlength="3" placeholder="EGP / SAR / USD"></label><p class="meta">تغيير الرمز لا يحوّل الأرصدة بين العملات.</p><button class="btn btn-primary" [disabled]="busy()||!officeLoaded()||currencyForm.invalid">حفظ العملة</button></form>
<section class="card panel grid" style="margin-top:24px"><h2>هويات ووسائل تواصل الحسابات</h2><p class="meta">الحسابات القديمة تحتاج تسجيل رقم هوية صحيح من 14 رقمًا قبل الدخول. لا يتم توليد أرقام هوية للموكلين أو المحامين تلقائيًا.</p>
<div class="table-wrap"><table class="data-table"><thead><tr><th>الاسم</th><th>رقم الهوية</th><th>الدور</th><th></th></tr></thead><tbody>@for(user of accounts();track user.id){<tr><td>{{user.name}}</td><td>{{user.nationalId||'غير مسجل'}}</td><td>{{roleLabels[user.role]}}</td><td><button type="button" class="btn btn-secondary" (click)="editAccount(user)">تعديل بيانات الدخول</button></td></tr>}</tbody></table></div>
@if(account){<form class="grid" #accountForm="ngForm" (ngSubmit)="saveAccount()"><h3>{{account.name}}</h3><label>رقم الهوية<input class="input" name="userIdentity" [(ngModel)]="identity" required pattern="[0-9]{14}" maxlength="14" inputmode="numeric" dir="ltr"></label><label>البريد<input class="input" name="userEmail" [(ngModel)]="accountEmail" type="email" email [required]="account.role!=='client'&&!accountPhone.trim()"></label><label>الهاتف<app-phone-input name="userPhone" [(ngModel)]="accountPhone" [required]="account.role!=='client'&&!accountEmail.trim()"></app-phone-input></label><p class="meta">تعديل بيانات الدخول ينهي الجلسات السابقة لهذا الحساب.</p><div class="toolbar"><button class="btn btn-primary" [disabled]="busy()||accountForm.invalid">حفظ بيانات الحساب</button><button class="btn btn-secondary" type="button" (click)="account=null">إلغاء</button></div></form>}
</section>
}
</main>`})
export class SettingsComponent {
 readonly notices=inject(NotificationService);readonly auth=inject(AuthService);readonly currency=inject(CurrencyService);private http=inject(HttpClient);private api=inject(ApiService);
 prefs:NoticePreferences={site_enabled:true,email_enabled:true,browser_enabled:false};loaded=signal(false);mailLoaded=signal(false);busy=signal(false);message=signal('');
 mailEnabled=false;email='';password='';passwordConfigured=false;delivery:Array<{status:string;count:number}>=[];deliveryLabels:Record<string,string>={pending:'في الانتظار',sending:'جاري الإرسال',sent:'مرسلة',failed:'تعذر إرسالها',skipped:'ملغاة'};
 admin(){return ['admin','owner'].includes(this.auth.user()?.role||'');}
 constructor(){this.notices.refresh().subscribe({next:r=>{this.prefs={...r.prefs};this.loaded.set(true);},error:()=>this.message.set('تعذر تحميل الإعدادات. أعد تحميل الصفحة.')});if(this.admin()){this.loadEmail();this.loadOffice();this.loadAccounts();}}
 loadEmail(){this.http.get<any>('/api/settings/email',this.notices.options).subscribe({next:r=>{this.mailEnabled=r.enabled;this.email=r.email;this.passwordConfigured=r.password_configured;this.delivery=r.delivery||[];this.mailLoaded.set(true);},error:()=>this.message.set('تعذر تحميل بريد المكتب')});}
 async browserChanged(enabled:boolean){if(enabled)await this.enableDevice();}
 async enableDevice(){this.busy.set(true);try{await this.notices.enableBrowser();this.message.set('تم السماح لهذا الجهاز. اضغط حفظ تفضيلاتي لتفعيل القناة.');}catch(e){this.prefs.browser_enabled=false;this.message.set(e instanceof Error?e.message:'تعذر تفعيل إشعارات المتصفح.');}finally{this.busy.set(false);}}
 save(){if(this.busy())return;this.busy.set(true);this.notices.savePreferences(this.prefs).subscribe({next:p=>{this.notices.preferences.set(p);if(!p.site_enabled)this.notices.items.set([]);this.busy.set(false);this.message.set('تم حفظ تفضيلات الإشعارات');},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ التفضيلات');}});}
 saveGmail(){this.busy.set(true);this.http.put('/api/settings/email',{enabled:this.mailEnabled,email:this.email,password:this.password||null},this.notices.options).subscribe({next:()=>{this.passwordConfigured=this.passwordConfigured||!!this.password;this.password='';this.busy.set(false);this.notices.config.update(c=>c?{...c,emailReady:this.mailEnabled}:c);this.message.set('تم حفظ إعدادات Gmail. ستُرسل الإشعارات الجديدة بعد تفعيل البريد.');},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ Gmail. تحقق من العنوان وكلمة مرور التطبيق.');}});}
 officeLoaded=signal(false);bankLoaded=signal(false);smsLoaded=signal(false);accounts=signal<User[]>([]);account:User|null=null;identity='';accountEmail='';accountPhone='';roleLabels:Record<string,string>={client:'موكل',lawyer:'محامٍ',admin:'أدمن',owner:'مالك المكتب'};
 currencyCode='';session={passwordResetMinutes:15,durationMinutes:60,codeMinutes:5,accessMinutes:15,maxAttempts:5,resendSeconds:60};bank={bankName:'',beneficiary:'',iban:'',instructions:''};sms={enabled:false,accountSid:'',sender:'',authToken:'',tokenConfigured:false};
 loadOffice(){this.http.get<any>('/api/settings/office',this.notices.options).subscribe({next:r=>{this.session=r.auth;this.currencyCode=r.application.currency;this.officeLoaded.set(true);},error:()=>this.message.set('تعذر تحميل إعدادات المكتب')});this.http.get<any>('/api/office-portal/bank',this.notices.options).subscribe({next:r=>{this.bank={bankName:r.bank_name||'',beneficiary:r.beneficiary||'',iban:r.iban||'',instructions:r.instructions||''};this.bankLoaded.set(true);},error:()=>this.message.set('تعذر تحميل الحساب البنكي')});this.http.get<any>('/api/settings/office/sms',this.notices.options).subscribe({next:r=>{this.sms={...r,authToken:''};this.smsLoaded.set(true);},error:()=>this.message.set('تعذر تحميل إعدادات SMS')});}
 private saveOffice(url:string,body:unknown,success:string,after?:()=>void){if(this.busy())return;this.busy.set(true);this.http.put(url,body,this.notices.options).subscribe({next:()=>{this.busy.set(false);this.message.set(success);after?.();},error:()=>{this.busy.set(false);this.message.set('تعذر الحفظ. تحقق من البيانات والصلاحية.');}});}
 saveBank(){this.bank.iban=this.bank.iban.trim().toUpperCase();this.saveOffice('/api/office-portal/bank',this.bank,'تم حفظ الحساب البنكي');}
 saveSession(){this.saveOffice('/api/settings/office/session',this.session,'تم حفظ مدة الدخول وإعدادات التحقق');}
 saveSms(){this.saveOffice('/api/settings/office/sms',{...this.sms,authToken:this.sms.authToken||null},'تم حفظ إعدادات SMS',()=>{this.sms.tokenConfigured=this.sms.tokenConfigured||!!this.sms.authToken;this.sms.authToken='';});}
 saveCurrency(){this.saveOffice('/api/settings/office/application',{currency:this.currencyCode},'تم حفظ العملة',()=>this.currency.code.set(this.currencyCode));}
 loadAccounts(){this.api.listUsers().subscribe({next:r=>this.accounts.set(r),error:()=>this.message.set('تعذر تحميل الحسابات')});}
 editAccount(user:User){this.account=user;this.identity=user.nationalId||'';this.accountEmail=user.email||'';this.accountPhone=user.phone||'';}
 saveAccount(){if(!this.account||this.busy())return;const id=this.account.id;this.busy.set(true);this.api.updateUser(id,{nationalId:this.identity,email:this.accountEmail,phone:this.accountPhone}).subscribe({next:()=>{this.busy.set(false);this.account=null;this.message.set('تم حفظ بيانات الحساب');if(id===this.auth.user()?.id)this.auth.logout().subscribe();else this.loadAccounts();},error:()=>{this.busy.set(false);this.message.set('تعذر الحفظ. تحقق من رقم الهوية ووسيلة التواصل؛ لا يمكن تكرار رقم الهوية أو البريد.');}});}

}
