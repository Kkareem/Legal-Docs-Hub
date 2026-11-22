import {TestBed} from '@angular/core/testing';
import {provideRouter,ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {LawyersComponent} from './lawyers.component';
import {LawyerDetailsComponent} from './lawyer-details.component';
import {ApiService} from '../core/api.service';

describe('Lawyer management',()=>{
 const lawyer={id:3,name:'المحامي الأول',role:'lawyer',active:true,email:'lawyer@example.test'};
 const linked={id:10,title:'قضية عقد',case_number:'LD-10',type:'civil',other_lawyers:[{id:4,name:'المحامي الثاني'}]};
 let api:any;
 beforeEach(()=>{
  api={listUsers:()=>of([lawyer,{id:4,name:'المحامي الثاني',role:'lawyer',active:true}]),createLawyer:vi.fn(()=>of({id:5,name:'محامٍ جديد',role:'lawyer',active:true})),lawyerCases:()=>of([linked]),deleteLawyer:vi.fn(()=>of(undefined)),lawyerDetails:()=>of({lawyer,cases:[linked]}),reassignLawyerCase:vi.fn(()=>of(undefined))};
  TestBed.configureTestingModule({imports:[LawyersComponent,LawyerDetailsComponent],providers:[provideRouter([]),{provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=> '3'}}}},{provide:ApiService,useValue:api}]});
 });
 it('keeps the list visible and inserts the created lawyer immediately after modal submission',()=>{
  const f=TestBed.createComponent(LawyersComponent);f.detectChanges();expect(f.nativeElement.querySelector('form')).toBeNull();f.componentInstance.showCreate.set(true);f.detectChanges();expect(f.nativeElement.querySelector('dialog form')).not.toBeNull();f.componentInstance.name='محامٍ جديد';f.componentInstance.create();f.detectChanges();expect(f.nativeElement.querySelector('dialog')).toBeNull();expect(f.componentInstance.lawyers()[0].id).toBe(5);expect(f.nativeElement.textContent).toContain('محامٍ جديد');
 });
 it('shows blocking cases and co-lawyers instead of a delete confirmation action',()=>{
  const f=TestBed.createComponent(LawyersComponent);f.detectChanges();f.componentInstance.openDelete(lawyer as any);f.detectChanges();const dialog=f.nativeElement.querySelector('dialog');expect(dialog.textContent).toContain('قضية عقد');expect(dialog.textContent).toContain('المحامي الثاني');expect(dialog.textContent).toContain('لا يمكن حذفه');expect(dialog.textContent).not.toContain('نعم، حذف المحامي');f.componentInstance.remove();expect(api.deleteLawyer).not.toHaveBeenCalled();
 });
 it('starts reassignment with no assignment and removes only the reassigned row after saving',()=>{
  const f=TestBed.createComponent(LawyerDetailsComponent);f.detectChanges();f.componentInstance.openReassign(linked);f.detectChanges();expect(f.nativeElement.querySelector('dialog select option').textContent).toContain('عدم تعيين');expect(f.componentInstance.replacement).toBeNull();f.componentInstance.replacement=4;f.componentInstance.save();f.detectChanges();expect(api.reassignLawyerCase).toHaveBeenCalledWith(3,10,4);expect(f.componentInstance.data()?.cases).toEqual([]);expect(f.nativeElement.querySelector('dialog')).toBeNull();
 });
});
