import {Component, input, computed, inject} from '@angular/core';
import {CurrencyService} from '../core/currency.service';
import {CommonModule,registerLocaleData} from '@angular/common';
import localeArSa from '@angular/common/locales/ar-SA';
registerLocaleData(localeArSa,'ar-SA');
import {CaseDetails,ClientRequest} from '../core/portal-api.service';

@Component({selector:'app-case-timeline',standalone:true,imports:[CommonModule],template:`
  <ol class="timeline">
    @for(event of events();track event.key){
      <li><details><summary><strong>{{event.title}}</strong><time>{{event.date | date:'d MMMM y، h:mm a':undefined:'ar-SA'}}</time></summary>
        <p class="written-details">{{event.body}}</p>
        @for(request of event.requests || [];track request.id){
          <section class="request"><strong>المطلوب من {{request.client_name}}: {{request.title}}</strong><p class="written-details">{{request.details}}</p>
          @if(request.target_hearing_number){<p>للتقديم في الجلسة رقم {{request.target_hearing_number}} — {{request.target_hearing_datetime | date:'d MMMM y، h:mm a':undefined:'ar-SA'}}</p>}
          @if(request.due_at){<p>موعد التسليم: {{request.due_at | date:'d MMMM y، h:mm a':undefined:'ar-SA'}}</p>}
          <p>{{request.status==='completed'?'تم تلبية الطلب':'بانتظار تنفيذ الموكل'}}</p></section>
        }
        @for(file of event.files || [];track file.id){<a class="btn btn-secondary" [href]="'/api/'+(staff()?'office':'client')+'-portal/documents/'+file.id+'/content'" download>{{file.file_name}}</a>}
      </details></li>
    }
  </ol>`,styles:[`
    .timeline{list-style:none;padding:0;margin:0;border-inline-start:2px solid var(--line)}
    li{padding:0 18px 20px;position:relative}li:before{content:'';position:absolute;inset-inline-start:-6px;top:9px;width:10px;height:10px;border-radius:50%;background:var(--primary)}
    details{padding:16px;background:var(--surface);border:1px solid var(--line);border-radius:12px}
    summary{cursor:pointer}time{display:block;color:var(--muted);font-size:12px;margin-top:6px}
    .written-details{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.9}.request{border-inline-start:3px solid var(--primary);padding:8px 14px;margin-top:12px}
  `]})
export class CaseTimelineComponent {
  readonly currency=inject(CurrencyService);
  details=input.required<CaseDetails>();staff=input(false);
  events=computed(()=>{
    const d=this.details();
    const events:Array<{key:string;title:string;date:string;body:string;requests?:ClientRequest[];files?:{id:number;file_name:string}[]}>=[];
    events.push({key:'opened',title:'فتح القضية '+d.case.case_number,date:d.case.created_at,body:d.case.description||'تم فتح ملف القضية.'});
    for(const h of d.hearings)events.push({key:'h'+h.id,title:'إضافة الجلسة رقم '+(h.hearing_number||h.id),date:h.created_at||h.datetime,body:`تم تحديد الجلسة رقم ${h.hearing_number||h.id} في ${h.court}، نوع الجلسة: ${h.type}.\nموعد الجلسة: ${this.date(h.datetime)}.`});
    for(const u of d.updates)events.push({key:'u'+u.id,title:u.title,date:u.created_at,body:u.body+'\nسجّله: '+u.author_name});
    for(const r of d.reports||[])events.push({key:'r'+r.id,title:'ما حدث في الجلسة رقم '+r.hearing_number,date:r.created_at,body:`الجلسة رقم ${r.hearing_number} — ${r.court}\nموعد الجلسة: ${this.date(r.hearing_datetime)}\n${r.body}\nسجّله: ${r.author_name}`,requests:(d.clientRequests||[]).filter(q=>q.report_id===r.id)});
    for(const r of d.clientRequests||[])if(r.completed_at)events.push({key:'q'+r.id,title:'تم تلبية الطلب: '+r.title,date:r.completed_at,body:`طلب الجلسة رقم ${r.hearing_number}\nنفّذه: ${r.completed_by_name||r.client_name}\n${r.completion_notes||''}`,files:r.files});
    for(const f of d.files)if(!f.client_request_id)events.push({key:'f'+f.id,title:'إضافة مستند: '+f.file_name,date:f.created_at,body:'تم رفع المستند إلى ملف القضية: '+f.file_name,files:[f]});
    for(const p of d.payments){if(p.created_at)events.push({key:'p'+p.id,title:'طلب دفع: '+p.notes,date:p.created_at,body:`تم طلب مبلغ ${this.currency.format(p.amount)} من ${p.client_name||'الموكل'}، السبب: ${p.notes}.`});if(p.paid_at)events.push({key:'paid'+p.id,title:'تم دفع الرسوم المطلوبة',date:p.paid_at,body:`تم تأكيد سداد مبلغ ${this.currency.format(p.amount)} للطلب: ${p.notes}.`});}
    return events.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  });
  date(value:string){return new Date(value).toLocaleString('ar-EG');}
}
