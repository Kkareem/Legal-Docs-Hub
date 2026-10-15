import {TestBed} from '@angular/core/testing';
import {CaseTimelineComponent} from './case-timeline.component';
import {CurrencyService} from '../core/currency.service';

describe('Case timeline',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[{provide:CurrencyService,useValue:{format:(n:number)=>String(n)}}]}));
 it('links written hearing details, court requests and timestamped fulfillment',()=>{
  const f=TestBed.createComponent(CaseTimelineComponent);
  f.componentRef.setInput('details',{
   case:{case_number:'LD-1',created_at:'2026-10-01T09:00:00Z'},updates:[],files:[],payments:[],
   hearings:[{id:50,hearing_number:1,court:'محكمة القاهرة',type:'مرافعة',datetime:'2026-10-10T09:00:00Z',created_at:'2026-10-02T09:00:00Z'}],
   reports:[{id:10,hearing_id:50,hearing_number:1,court:'محكمة القاهرة',hearing_datetime:'2026-10-10T09:00:00Z',body:'قدمنا المرافعة وطلب القاضي أصل العقد',author_name:'المحامي الأول',created_at:'2026-10-10T10:00:00Z'}],
   clientRequests:[{id:20,report_id:10,hearing_number:1,title:'أصل العقد',details:'ارفع نسخة العقد',client_name:'الموكل الأول',target_hearing_number:2,target_hearing_datetime:'2026-11-01T09:00:00Z',status:'completed',completed_at:'2026-10-11T11:30:00Z',completion_notes:'أرفقت العقد الموقع',files:[{id:90,file_name:'العقد.pdf'}]}],
  });f.detectChanges();
  const text=f.nativeElement.textContent;
  expect(text).toContain('ما حدث في الجلسة رقم 1');expect(text).toContain('قدمنا المرافعة');
  expect(text).toContain('للتقديم في الجلسة رقم 2');expect(text).toContain('تم تلبية الطلب: أصل العقد');expect(text).toContain('أرفقت العقد الموقع');
  expect(f.componentInstance.events()[0].key).toBe('q20');
  expect(f.nativeElement.querySelector('a').getAttribute('href')).toBe('/api/client-portal/documents/90/content');
 });
 it('records actual payment confirmation separately from payment creation',()=>{
  const f=TestBed.createComponent(CaseTimelineComponent);
  f.componentRef.setInput('details',{case:{case_number:'LD-2',created_at:'2026-10-01T00:00:00Z'},updates:[],files:[],hearings:[],payments:[{id:8,notes:'رسوم المحكمة',amount:100,created_at:'2026-10-02T09:00:00Z',paid_at:'2026-10-04T12:00:00Z'}]});f.detectChanges();
  expect(f.componentInstance.events().map(e=>e.key)).toEqual(['paid8','p8','opened']);
  expect(f.nativeElement.textContent).toContain('تم تأكيد سداد مبلغ 100');
 });
});
