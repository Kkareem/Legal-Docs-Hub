import {CurrencyService} from '../core/currency.service';
import {Component,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PortalApiService,PendingReceipt} from '../core/portal-api.service';
import {ApiService} from '../core/api.service';
import {Client} from '../core/models';
@Component({standalone:true,imports:[FormsModule],template:`
<section class="page-shell"><h1 class="section-title">التحويلات البنكية والإيصالات</h1>
@if(message()){<p role="status">{{message()}}</p>}
<form class="card panel grid" style="margin-top:24px" #requestForm="ngForm" (ngSubmit)="requestPayment()"><h2>طلب دفع عام من موكل</h2><label>الموكل<select class="select" name="client" [(ngModel)]="selectedClient" required><option [ngValue]="null">اختر الموكل</option>@for(c of clients();track c.id){<option [ngValue]="c.id">{{c.name}}</option>}</select></label><label>المبلغ ({{currency.code()}})<input class="input" name="amount" type="number" step="0.01" min="0.01" max="99999999.99" [(ngModel)]="amount" required></label><label>سبب طلب الدفع<textarea class="textarea" name="paymentNotes" [(ngModel)]="paymentNotes" required maxlength="2000"></textarea></label><button class="btn btn-primary" [disabled]="requestForm.invalid||busy()">إرسال طلب الدفع</button></form>
<form class="card panel grid" style="margin:24px 0" #bankForm="ngForm" (ngSubmit)="save()"><h2>حساب المكتب البنكي</h2><label>اسم البنك<input class="input" name="bankName" [(ngModel)]="bankName" required maxlength="200"></label><label>اسم المستفيد<input class="input" name="beneficiary" [(ngModel)]="beneficiary" required maxlength="200"></label><label>رقم IBAN<input class="input" dir="ltr" name="iban" [(ngModel)]="iban" required pattern="[A-Z]{2}[A-Z0-9]{13,32}"></label><label>تعليمات التحويل<textarea class="textarea" name="instructions" [(ngModel)]="instructions" maxlength="2000"></textarea></label><button class="btn btn-primary" [disabled]="bankForm.invalid||busy()">حفظ بيانات التحويل للموكلين</button></form>
<div class="toolbar"><h2>إيصالات تنتظر المراجعة</h2><button class="btn btn-secondary" (click)="load()">تحديث</button></div>
@for(r of receipts();track r.id){<article class="card panel grid" style="margin-top:20px"><h3>{{r.client_name}} — {{currency.format(r.amount)}}</h3><p>{{r.case_number || 'دفعة عامة'}} · طلب دفع #{{r.payment_id}}</p><p>مرجع التحويل: {{r.reference}}</p><a class="btn btn-secondary" [href]="api.fileUrl(r.file_id,true)" download>تنزيل الإيصال ومراجعته</a><label>ملاحظات المراجعة<textarea class="textarea" [(ngModel)]="notes[r.id]" maxlength="2000"></textarea></label><div class="toolbar"><button class="btn btn-primary" [disabled]="busy()" (click)="review(r.id,true)">اعتماد السداد</button><button class="btn btn-danger" [disabled]="busy()" (click)="review(r.id,false)">رفض الإيصال وإعادة طلب السداد</button></div></article>}@empty{<div class="card empty-state">لا توجد إيصالات معلقة.</div>}
</section>`})
export class PaymentManagementComponent {
 readonly currency=inject(CurrencyService);
 private officeApi=inject(ApiService);clients=signal<Client[]>([]);selectedClient:number|null=null;amount:number|null=null;paymentNotes='';
 readonly api=inject(PortalApiService);receipts=signal<PendingReceipt[]>([]);busy=signal(false);message=signal('');
 bankName='';beneficiary='';iban='';instructions='';notes:Record<number,string>={};
 constructor(){this.load();this.officeApi.listClients().subscribe({next:c=>this.clients.set(c),error:()=>this.message.set('تعذر تحميل الموكلين')});this.api.bank().subscribe({next:b=>{this.bankName=b.bank_name||'';this.beneficiary=b.beneficiary||'';this.iban=b.iban||'';this.instructions=b.instructions||'';},error:()=>this.message.set('تعذر تحميل بيانات البنك')});}
 requestPayment(){if(!this.selectedClient||!this.amount||this.busy())return;this.busy.set(true);this.api.generalPayment(this.selectedClient,this.amount,this.paymentNotes).subscribe({next:()=>{this.busy.set(false);this.amount=null;this.paymentNotes='';this.message.set('تم إرسال طلب الدفع إلى بوابة الموكل');},error:()=>{this.busy.set(false);this.message.set('تعذر إنشاء طلب الدفع');}});}
 load(){this.api.receipts().subscribe({next:r=>this.receipts.set(r),error:()=>this.message.set('تعذر تحميل الإيصالات')});}
 save(){this.busy.set(true);this.api.saveBank({bankName:this.bankName,beneficiary:this.beneficiary,iban:this.iban.trim().toUpperCase(),instructions:this.instructions}).subscribe({next:()=>{this.busy.set(false);this.message.set('تم حفظ بيانات البنك');},error:()=>{this.busy.set(false);this.message.set('تعذر حفظ بيانات البنك');}});}
 review(id:number,approve:boolean){if(this.busy())return;this.busy.set(true);this.api.reviewReceipt(id,approve,this.notes[id]||'').subscribe({next:()=>{this.busy.set(false);this.message.set(approve?'تم اعتماد السداد':'تم رفض الإيصال وإعادة طلب السداد');this.load();},error:()=>{this.busy.set(false);this.message.set('تعذر المراجعة. قد يكون الإيصال تمت مراجعته بالفعل.');}});}
}

