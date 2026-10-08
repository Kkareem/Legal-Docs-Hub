import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {CaseWorkspaceComponent} from './case-workspace.component';
import {PortalApiService} from '../core/portal-api.service';
import {ApiService} from '../core/api.service';
import {CurrencyService} from '../core/currency.service';

describe('Case workspace participants and history',()=>{
 let api:any;
 beforeEach(async()=>{
  api={details:()=>of({case:{id:10,case_number:'TEST',status:'active'},clients:[{id:1,name:'الموكل الأول'},{id:2,name:'الموكل الثاني'}],lawyers:[{id:3,name:'المحامي الأول'},{id:4,name:'المحامي الثاني'}],reviews:[],updates:[],hearings:[],payments:[],files:[]}),
   opponents:()=>of([]),activity:()=>of([{id:1,actor_name:'المحامي الثاني',entity:'case_opponents',action:'UPDATE',created_at:'2026-10-08T10:00:00Z',changes:JSON.stringify({name:{before:'اسم قديم',after:'اسم جديد'}})}]),
   members:vi.fn(()=>of({})),requestPayment:vi.fn(()=>of({})),saveOpponent:vi.fn(()=>of({}))};
  await TestBed.configureTestingModule({imports:[CaseWorkspaceComponent],providers:[
   {provide:PortalApiService,useValue:api},{provide:ApiService,useValue:{listClients:()=>of([{id:1,name:'الأول'},{id:2,name:'الثاني'}]),listUsers:()=>of([{id:3,name:'محام',role:'lawyer'},{id:4,name:'محام آخر',role:'lawyer'}])}},
   {provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=> '10'}}}},
   {provide:CurrencyService,useValue:{code:()=> 'SAR',format:(n:number)=>String(n)}}
  ]}).compileComponents();
 });
 it('preserves all selected participants when saving membership',()=>{
  const f=TestBed.createComponent(CaseWorkspaceComponent);f.detectChanges();
  f.componentInstance.saveMembers();expect(api.members).toHaveBeenCalledWith(10,[1,2],[3,4]);
 });
 it('sends the selected payer for multi-client payment requests',()=>{
  const f=TestBed.createComponent(CaseWorkspaceComponent);f.detectChanges();
  expect(f.componentInstance.payerId).toBeNull();f.componentInstance.payerId=2;f.componentInstance.amount=50;f.componentInstance.paymentNotes='دفعة';f.componentInstance.payment();
  expect(api.requestPayment).toHaveBeenCalledWith(10,50,'دفعة',2);
 });
 it('shows the actor and exact changes and accepts an optional opponent',()=>{
  const f=TestBed.createComponent(CaseWorkspaceComponent);f.detectChanges();
  expect(f.nativeElement.textContent).toContain('المحامي الثاني — تعديل خصم');
  expect(f.nativeElement.textContent).toContain('اسم قديم');expect(f.nativeElement.textContent).toContain('اسم جديد');
  f.componentInstance.saveOpponent();expect(api.saveOpponent).toHaveBeenCalledWith(10,{});
 });
});
