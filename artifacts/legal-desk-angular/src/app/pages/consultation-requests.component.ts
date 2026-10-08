import {Component,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../core/api.service';
import {AuthService} from '../core/auth.service';
import {User,ConsultationRequest} from '../core/models';
@Component({standalone:true,imports:[FormsModule],template:`
<section class="page-shell"><h1 class="section-title">{{admin ? 'طلبات الاستشارات' : 'الاستشارات المسندة إليّ'}}</h1>
<p class="section-subtitle">الرد المحفوظ يظهر للزائر في صفحة متابعة الطلب.</p>
<button class="btn btn-secondary" type="button" (click)="load()" [disabled]="busy() || loading()">تحديث الطلبات</button>
@if(message()){<p role="status">{{message()}}</p>}
@if(loading()){<p>جارٍ تحميل الطلبات...</p>}
@for(item of requests();track item.id){
<article class="card panel grid" style="margin-top:20px">
<div class="toolbar"><h2>طلب #{{item.id}} — {{item.name}}</h2><span class="badge badge-soft">{{item.status==='answered'?'تم الرد':'بانتظار الرد'}}</span></div>
<p>{{item.email}} · {{item.phone}}</p><p style="white-space:pre-wrap">{{item.summary}}</p>
<div class="list" aria-label="سجل المحادثة">
@for(entry of item.messages;track entry.id){
<div class="card panel"><strong>{{entry.sender_type==='staff'?(entry.sender_name || 'المكتب'):'الزائر'}}</strong><p style="white-space:pre-wrap">{{entry.body}}</p></div>
}
</div>
<div class="meta">المحامون المسند إليهم:
@for(assignee of item.assignees;track assignee.id){<span class="badge badge-soft">{{assignee.name}}</span>}@empty{<span>بدون إسناد</span>}
</div>
@if(admin){<fieldset style="border:1px solid var(--line);border-radius:14px;padding:16px">
<legend>إسناد الرد لمحامٍ أو أكثر</legend>
@for(lawyer of lawyers();track lawyer.id){
<label style="display:inline-flex;gap:8px;margin:8px 16px">
<input type="checkbox" [checked]="assignments[item.id]?.includes(lawyer.id)" (change)="toggleAssignee(item.id,lawyer.id,$event)" [disabled]="busy()">{{lawyer.name}}
</label>}
</fieldset>
<button class="btn btn-secondary" (click)="assign(item.id)" [disabled]="busy()">حفظ الإسناد</button>
}@else{<p class="meta">مسند إليك للرد</p>}
@if(item.canReply){
<label>الرد على الاستشارة<textarea class="textarea" rows="5" [(ngModel)]="replies[item.id]" maxlength="20000"></textarea></label>
<button class="btn btn-primary" (click)="reply(item.id)" [disabled]="busy() || !replies[item.id]?.trim()">إرسال الرد للزائر</button>
}@else{<p class="badge badge-neutral">تم إرسال الرد — بانتظار رد الزائر</p>}
</article>
}
@if(!loading() && !requests().length){<div class="card empty-state" style="margin-top:24px">لا توجد طلبات استشارة.</div>}
</section>`})
export class ConsultationRequestsComponent {
 private api=inject(ApiService);private auth=inject(AuthService);
 admin=['admin','owner'].includes(this.auth.user()?.role || '');
 requests=signal<ConsultationRequest[]>([]);lawyers=signal<User[]>([]);loading=signal(true);busy=signal(false);message=signal('');
 assignments:Record<number,number[]>={};replies:Record<number,string>={};
 toggleAssignee(requestId:number,lawyerId:number,event:Event){
  const selected=this.assignments[requestId] || [];
  this.assignments[requestId]=(event.target as HTMLInputElement).checked ? [...new Set([...selected,lawyerId])] : selected.filter(id=>id!==lawyerId);
 }
 constructor(){this.load();if(this.admin)this.api.listUsers().subscribe({next:u=>this.lawyers.set(u.filter(x=>x.role==='lawyer'&&x.active)),error:()=>this.message.set('تعذر تحميل المحامين')});}
 load(){this.loading.set(true);this.api.listConsultationRequests().subscribe({next:r=>{this.requests.set(r);for(const x of r){this.assignments[x.id]=(x.assignees || []).map(a=>a.id);this.replies[x.id]='';}this.loading.set(false);},error:()=>{this.loading.set(false);this.message.set('تعذر تحميل الطلبات');}});}
 assign(id:number){this.busy.set(true);this.api.assignConsultation(id,this.assignments[id]).subscribe({next:()=>{this.busy.set(false);this.message.set('تم حفظ الإسناد');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ الإسناد');}});}
 reply(id:number){if(this.busy())return;this.busy.set(true);this.api.replyConsultation(id,this.replies[id]).subscribe({next:()=>{this.busy.set(false);this.message.set('تم إرسال الرد. بانتظار رد الزائر.');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر إرسال الرد. حدّث الطلبات؛ قد يكون تم الرد بالفعل أو تغير الإسناد.');}});}
}

