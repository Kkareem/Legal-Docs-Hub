import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { User } from '../core/models';
@Component({standalone:true, imports:[FormsModule], template: `
<section class="page-shell">
<h1 class="section-title">إدارة المحامين</h1><p class="section-subtitle">أضف المحامي وسلمه كلمة مرور مؤقتة. سيختار كلمة مرور خاصة عند أول دخول.</p>
<form class="card form-card grid" style="margin:24px 0" #form="ngForm" (ngSubmit)="create()">
<div class="grid grid-2">
<label>اسم المحامي<input class="input" name="name" [(ngModel)]="name" required maxlength="200"></label>
<label>البريد الإلكتروني<input class="input" name="email" [(ngModel)]="email" type="email" required email></label>
<label>الهاتف<input class="input" name="phone" [(ngModel)]="phone" type="tel"></label>
<label>كلمة المرور المؤقتة<input class="input" name="password" [(ngModel)]="password" type="password" required minlength="10" maxlength="128" autocomplete="new-password"></label>
</div><p class="meta">كلمة المرور 10 أحرف على الأقل. شاركها مع المحامي بطريقة خاصة.</p>
<button class="btn btn-primary" [disabled]="form.invalid || busy()">إضافة محامٍ</button>
</form>
@if(message()){<p role="status">{{message()}}</p>}
<div class="card table-wrap"><table class="data-table"><thead><tr><th>الاسم</th><th>البريد</th><th>الهاتف</th><th>الحالة</th></tr></thead><tbody>
@for(user of lawyers();track user.id){<tr><td>{{user.name}}</td><td>{{user.email}}</td><td>{{user.phone || '—'}}</td><td>{{user.active ? 'نشط' : 'معطل'}}</td></tr>}
</tbody></table>@if(!lawyers().length){<p class="empty-state">لا يوجد محامون بعد.</p>}</div>
</section>`})
export class LawyersComponent {
 private api=inject(ApiService);
 lawyers=signal<User[]>([]);busy=signal(false);message=signal('');
 name='';email='';phone='';password='';
 constructor(){this.load();}
 load(){this.api.listUsers().subscribe({next: u=>this.lawyers.set(u.filter(x=>x.role==='lawyer')),error:()=>this.message.set('تعذر تحميل المحامين')});}
 create(){if(this.busy())return;this.busy.set(true);this.message.set('');
 this.api.createLawyer({name:this.name,email:this.email,phone:this.phone,password:this.password,role:'lawyer'}).subscribe({
 next:()=>{this.busy.set(false);this.message.set('تم إنشاء الحساب. سلم المحامي بيانات الدخول المؤقتة.');this.name='';this.email='';this.phone='';this.password='';this.load();},
 error:e=>{this.busy.set(false);this.message.set(e.error?.message==='Email already exists'?'البريد الإلكتروني مستخدم بالفعل':'تعذر إنشاء الحساب. راجع البيانات وحاول مجددًا.');}
 });}
}

