import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {ClientPortalComponent} from './client-portal.component';
import {PortalApiService} from '../core/portal-api.service';
import {AuthService} from '../core/auth.service';

describe('Client portal',()=>{
 let api:any;
 const ownedCase={id:10,case_number:'OWN-CASE',status:'active',lead_lawyer_id:3,lawyer_name:'محامي الموكل',created_at:'2026-10-08T10:00:00Z'};
 const details={case:{...ownedCase},updates:[{id:1,title:'تحديث القضية',body:'تم تقديم المستندات',status:'active',created_at:'2026-10-08T10:00:00Z'}],hearings:[],files:[],documents:[],reviews:[],payments:[]};
 beforeEach(async()=>{
  api={
   overview:()=>of({client:{id:1,name:'موكل الاختبار'},cases:[ownedCase],hearings:[],payments:[{id:5,amount:100,status:'under_review',notes:'أتعاب',receipts:[]}],consultations:[],requests:[],bank:{}}),
   details:()=>of({...details,case:{...ownedCase}}),
   upload:vi.fn(()=>of([])),review:vi.fn(()=>of(undefined)),fileUrl:()=>'/safe-file',
  };
  await TestBed.configureTestingModule({imports:[ClientPortalComponent],providers:[
   {provide:PortalApiService,useValue:api},{provide:AuthService,useValue:{user:()=>({role:'client'}),logout:()=>of(undefined)}},
  ]}).compileComponents();
 });
 it('shows the client case list without office navigation',()=>{
  const f=TestBed.createComponent(ClientPortalComponent);f.detectChanges();
  expect(f.nativeElement.textContent).toContain('OWN-CASE');
  expect(f.nativeElement.querySelector('a[href="/clients"]')).toBeNull();
  expect(f.nativeElement.textContent).toContain('بوابة الموكل');
 });
 it('shows progress and accepts multiple attachments',()=>{
  const f=TestBed.createComponent(ClientPortalComponent);f.componentInstance.selectCase(10);f.detectChanges();
  expect(f.nativeElement.textContent).toContain('تم تقديم المستندات');
  expect(f.nativeElement.querySelector('input[type=file]').multiple).toBe(true);
  const first=new File(['text'],'evidence.txt',{type:'text/plain'});
  const second=new File([new Uint8Array([0,255])],'evidence.bin');
  f.componentInstance.upload({files:[first,second],value:'selected'} as unknown as HTMLInputElement);
  expect(api.upload).toHaveBeenCalledWith(10,[first,second]);
 });
 it('shows the rating form only for a closed case without a previous review',()=>{
  const f=TestBed.createComponent(ClientPortalComponent);f.componentInstance.selectCase(10);f.detectChanges();
  expect(f.nativeElement.textContent).not.toContain('إرسال التقييم');
  f.componentInstance.details.update(d=>d?{...d,case:{...d.case,status:'closed'}}:null);f.detectChanges();
  expect(f.nativeElement.textContent).toContain('إرسال التقييم');
  f.componentInstance.details.update(d=>d?{...d,reviews:[{stars:5,comment:'تقييم سابق',lawyer_name:'محامي الموكل'}]}:null);f.detectChanges();
  expect(f.nativeElement.textContent).not.toContain('إرسال التقييم');
  expect(f.nativeElement.textContent).toContain('تقييم سابق');
 });
 it('does not present a payment under review as paid or allow another receipt',()=>{
  const f=TestBed.createComponent(ClientPortalComponent);f.componentInstance.tab.set('payments');f.detectChanges();
  expect(f.nativeElement.textContent).toContain('الإيصال قيد المراجعة');
  expect(f.nativeElement.querySelector('input[type=file]')).toBeNull();
  expect(f.nativeElement.textContent).not.toContain('تم السداد');
 });
 it('allows rating another assigned lawyer after one has been reviewed',()=>{
  const f=TestBed.createComponent(ClientPortalComponent);f.componentInstance.selectCase(10);
  f.componentInstance.details.update(d=>d?{...d,case:{...d.case,status:'closed'},lawyers:[{id:3,name:'الأول'},{id:4,name:'الثاني'}],reviews:[{lawyer_id:3,stars:5,comment:'سابق',lawyer_name:'الأول'}]}:null);
  f.detectChanges();expect(f.nativeElement.textContent).toContain('إرسال التقييم');
  const options=f.nativeElement.querySelectorAll('select[name=reviewLawyer] option');expect(options.length).toBe(1);expect(options[0].textContent).toContain('الثاني');
  f.componentInstance.reviewLawyerId=4;f.componentInstance.review();
  expect(api.review).toHaveBeenCalledWith(10,5,'',4);
 });
});
