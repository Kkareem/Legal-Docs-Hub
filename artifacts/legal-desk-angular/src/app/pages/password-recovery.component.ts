import {AuthService} from '../core/auth.service';
import {Component,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {IconComponent} from '../shared/icon.component';

@Component({standalone:true,imports:[FormsModule,RouterLink,IconComponent],template:`
 <main class="recovery-page" dir="rtl"><section class="card panel recovery-card">
  <a routerLink="/login" class="back">العودة لتسجيل الدخول ←</a><app-icon name="scale" />
  <h1>{{reset?'إعادة ضبط كلمة المرور':'نسيت كلمة المرور؟'}}</h1>
  @if(success()){<p class="notice" role="status">{{message()}}</p><a class="btn btn-primary" routerLink="/login">تسجيل الدخول</a>}
  @else if(reset&&!token){<p role="alert">رابط الاستعادة غير مكتمل. افتح الرابط المرسل إلى بريدك أو اطلب رابطًا جديدًا.</p><a class="btn btn-primary" routerLink="/forgot-password">طلب رابط جديد</a>}
  @else{
   <p class="meta">{{reset?'اختر كلمة مرور جديدة لحسابك. سيتم إنهاء جلسات الدخول السابقة.':'أدخل رقم الهوية المكون من 14 رقمًا. سنرسل رابط الاستعادة إلى البريد المسجل بحسابك.'}}</p>
   <form class="grid" #form="ngForm" (ngSubmit)="submit()">
    @if(!reset){<label>رقم الهوية<input class="input" name="identity" [(ngModel)]="nationalId" inputmode="numeric" dir="ltr" autocomplete="username" pattern="[0-9]{14}" minlength="14" required></label>@if(nationalId&&!validIdentity()){<p role="alert">رقم الهوية يجب أن يتكون من 14 رقمًا بالضبط.</p>}}
    @else{<label>كلمة المرور الجديدة<input class="input" type="password" name="password" [(ngModel)]="password" autocomplete="new-password" minlength="10" maxlength="128" required></label><label>تأكيد كلمة المرور<input class="input" type="password" name="confirm" [(ngModel)]="confirm" autocomplete="new-password" required></label><p class="meta">10 أحرف على الأقل. استخدم كلمة مرور مختلفة عن السابقة.</p>@if(confirm&&confirm!==password){<p role="alert">كلمتا المرور غير متطابقتين.</p>}}
    @if(message()){<p role="alert">{{message()}}</p>}
    <button class="btn btn-primary" [disabled]="busy()||form.invalid||(reset&&password!==confirm)">{{busy()?'جارٍ تنفيذ الطلب...':reset?'حفظ كلمة المرور الجديدة':'إرسال رابط الاستعادة'}}</button>
   </form>
   @if(!reset){<p class="meta">إذا كان حسابك مسجلًا برقم هاتف فقط أو لم يصلك البريد، تواصل مع إدارة المكتب لاستعادة الدخول.</p>}
   @else{<a class="back" routerLink="/forgot-password">انتهت صلاحية الرابط؟ اطلب رابطًا جديدًا</a>}
  }
 </section></main>`,styles:[`
 :host{display:block}.recovery-page{min-height:100dvh;display:grid;place-items:center;padding:24px 16px;background:var(--bg)}
 .recovery-card{width:100%;max-width:480px;padding:32px;min-width:0}.back{display:block;color:var(--primary);margin-bottom:24px}
 app-icon{display:block;width:36px;height:36px;color:var(--primary)}h1{font-size:26px;margin:18px 0}.meta{color:var(--muted);line-height:1.8}
 label{display:grid;gap:8px}.notice{white-space:pre-wrap;line-height:1.8}.btn{width:100%}p[role=alert]{color:var(--danger);overflow-wrap:anywhere}
 @media(max-width:480px){.recovery-card{padding:24px 18px}}
 `]})
export class PasswordRecoveryComponent {
 private auth=inject(AuthService);private http=inject(HttpClient);private route=inject(ActivatedRoute);private router=inject(Router);
 readonly reset=this.route.snapshot.routeConfig?.path==='reset-password';
 token=new URLSearchParams(this.route.snapshot.fragment||'').get('token')||'';
 validIdentity(){return /^[0-9]{14}$/.test(this.nationalId);}
 nationalId='';password='';confirm='';busy=signal(false);success=signal(false);message=signal('');
 constructor(){if(this.reset&&this.token)void this.router.navigate([], {relativeTo:this.route,fragment:undefined,replaceUrl:true});}
 submit(){if(this.busy()||this.reset&&(!this.token||this.password.length<10||this.password!==this.confirm)||!this.reset&&!/^[0-9]{14}$/.test(this.nationalId))return;this.busy.set(true);this.message.set('');
  this.http.post<{message:string}>('/api/auth/'+(this.reset?'reset-password':'forgot-password'),this.reset?{token:this.token,newPassword:this.password}:{nationalId:this.nationalId},{withCredentials:true}).subscribe({next:r=>{this.busy.set(false);this.success.set(true);if(this.reset)this.auth.clearLocalSession();this.message.set(r.message);this.password='';this.confirm='';this.token='';},error:e=>{this.busy.set(false);this.message.set(e.error?.message||'تعذر تنفيذ الطلب. حاول مرة أخرى أو تواصل مع المكتب.');}});
 }
}
