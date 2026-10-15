import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting,HttpTestingController} from '@angular/common/http/testing';
import {ActivatedRoute,provideRouter} from '@angular/router';
import {AuthService} from '../core/auth.service';
import {PasswordRecoveryComponent} from './password-recovery.component';

describe('Password recovery pages',()=>{
 let snapshot:{routeConfig:{path:string};fragment:string|null};let clear:ReturnType<typeof vi.fn>;
 beforeEach(()=>{snapshot={routeConfig:{path:'forgot-password'},fragment:null};clear=vi.fn();TestBed.configureTestingModule({imports:[PasswordRecoveryComponent],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting(),{provide:ActivatedRoute,useValue:{snapshot}},{provide:AuthService,useValue:{clearLocalSession:clear}}]});});
 afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('requests recovery using identity and displays the generic response',()=>{
  const f=TestBed.createComponent(PasswordRecoveryComponent);f.detectChanges();f.componentInstance.nationalId='12345678901234';f.componentInstance.submit();
  const req=TestBed.inject(HttpTestingController).expectOne('/api/auth/forgot-password');expect(req.request.body).toEqual({nationalId:'12345678901234'});req.flush({message:'إذا كان الحساب نشطًا سيصلك رابط'});f.detectChanges();
  expect(f.nativeElement.textContent).toContain('إذا كان الحساب نشطًا');expect(clear).not.toHaveBeenCalled();
 });
 it('handles a missing link and directs the user to request another',()=>{
  snapshot.routeConfig.path='reset-password';const f=TestBed.createComponent(PasswordRecoveryComponent);f.detectChanges();expect(f.nativeElement.textContent).toContain('رابط الاستعادة غير مكتمل');expect(f.nativeElement.querySelector('form')).toBeNull();
 });
 it('requires matching passwords before submitting a reset',()=>{
  snapshot.routeConfig.path='reset-password';const f=TestBed.createComponent(PasswordRecoveryComponent);f.componentInstance.token='a'.repeat(43);f.detectChanges();f.componentInstance.password='newPassword123';f.componentInstance.confirm='different';f.componentInstance.submit();TestBed.inject(HttpTestingController).expectNone('/api/auth/reset-password');
  f.componentInstance.confirm='newPassword123';f.componentInstance.submit();const req=TestBed.inject(HttpTestingController).expectOne('/api/auth/reset-password');req.flush({message:'تم تغيير كلمة المرور'});f.detectChanges();expect(clear).toHaveBeenCalled();expect(f.componentInstance.token).toBe('');expect(f.componentInstance.password).toBe('');
 });
});
