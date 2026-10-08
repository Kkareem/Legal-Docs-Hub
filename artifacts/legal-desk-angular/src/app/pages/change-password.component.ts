import {Component,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {ApiService} from '../core/api.service';
import {AuthService} from '../core/auth.service';
@Component({standalone:true,imports:[FormsModule],template:`
<main class="page-shell" style="max-width:600px">
<form class="card form-card grid" #form="ngForm" (ngSubmit)="submit()">
<h1>تعيين كلمة مرور خاصة</h1><p>يجب تغيير كلمة المرور المؤقتة قبل استخدام النظام.</p>
<label>كلمة المرور الحالية<input class="input" type="password" name="current" [(ngModel)]="current" required autocomplete="current-password"></label>
<label>كلمة المرور الجديدة<input class="input" type="password" name="password" [(ngModel)]="password" required minlength="10" maxlength="128" autocomplete="new-password"></label>
<label>تأكيد كلمة المرور<input class="input" type="password" name="confirm" [(ngModel)]="confirm" required autocomplete="new-password"></label>
@if(error()){<p role="alert">{{error()}}</p>}
<button class="btn btn-primary" [disabled]="form.invalid || busy()">حفظ كلمة المرور</button>
<button class="btn btn-secondary" type="button" (click)="logout()">تسجيل الخروج</button>
</form></main>`})
export class ChangePasswordComponent {
 private api=inject(ApiService);private auth=inject(AuthService);private router=inject(Router);
 current='';password='';confirm='';busy=signal(false);error=signal('');
 logout(){this.auth.logout().subscribe();}
 submit(){if(this.password!==this.confirm){this.error.set('كلمتا المرور غير متطابقتين');return;}if(this.busy())return;
 this.busy.set(true);this.error.set('');
 this.api.changePassword({currentPassword:this.current,newPassword:this.password}).subscribe({
 next:user=>{this.auth.user.set(user);this.busy.set(false);void this.router.navigateByUrl('/dashboard');},
 error:()=>{this.busy.set(false);this.error.set('تعذر التغيير. تحقق من كلمة المرور الحالية واختر كلمة جديدة مختلفة من 10 أحرف على الأقل.');}
 });}
}

