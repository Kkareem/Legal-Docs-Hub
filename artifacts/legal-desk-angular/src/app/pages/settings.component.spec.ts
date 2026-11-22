import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting,HttpTestingController} from '@angular/common/http/testing';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {signal as angularSignal} from '@angular/core';
import {SettingsComponent} from './settings.component';
import {NotificationService} from '../core/notification.service';
import {AuthService} from '../core/auth.service';
describe('Notification settings',()=>{
 let notices:any;let http:HttpTestingController;
 const profile={id:22,name:'موكل الاختبار',nationalId:'12345678901234',email:'client@example.test',phone:'+201000000001',role:'client',avatarUrl:null};
 beforeEach(async()=>{
  notices={options:{withCredentials:true},preferences:angularSignal(null),items:angularSignal([]),config:angularSignal({emailReady:false}),refresh:()=>of({items:[],prefs:{site_enabled:true,email_enabled:true,browser_enabled:false}}),savePreferences:vi.fn(p=>of(p)),enableBrowser:vi.fn(()=>Promise.reject(new Error('المتصفح لا يدعم الإشعارات')))};
  await TestBed.configureTestingModule({imports:[SettingsComponent],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting(),{provide:NotificationService,useValue:notices},{provide:AuthService,useValue:{user:angularSignal({role:'client',id:22,email:'client@example.test'})}}]}).compileComponents();
  http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 it('lets a client independently save channel preferences without office email settings',()=>{
  const f=TestBed.createComponent(SettingsComponent);http.expectOne('/api/account').flush(profile);f.componentInstance.activeTab.set('notifications');f.detectChanges();
  expect(f.nativeElement.textContent).not.toContain('بريد المكتب عبر Gmail');
  f.componentInstance.prefs.email_enabled=false;f.componentInstance.save();
  expect(notices.savePreferences).toHaveBeenCalledWith({site_enabled:true,email_enabled:false,browser_enabled:false});
  expect(f.componentInstance.message()).toContain('تم حفظ');
 });
 it('keeps browser notifications off and explains unsupported browsers',async()=>{
  const f=TestBed.createComponent(SettingsComponent);http.expectOne('/api/account').flush(profile);f.componentInstance.prefs.browser_enabled=true;
  await f.componentInstance.enableDevice();
  expect(f.componentInstance.prefs.browser_enabled).toBe(false);expect(f.componentInstance.message()).toContain('لا يدعم');
 });

 it('shows read-only identity and a password tab for a client without administration',()=>{
  const f=TestBed.createComponent(SettingsComponent);http.expectOne('/api/account').flush(profile);f.detectChanges();expect(f.nativeElement.querySelectorAll('input[readonly]').length).toBe(2);expect(f.nativeElement.textContent).toContain('صورة البروفايل');expect(f.nativeElement.textContent).not.toContain('إعدادات الإدارة');
  f.componentInstance.activeTab.set('password');f.detectChanges();expect(f.nativeElement.querySelectorAll('input[type=password]').length).toBe(3);expect(f.nativeElement.querySelector('input[type=email]')).toBeNull();
 });
 it('sends only contact changes with confirmation and refreshes the displayed account',()=>{
  const f=TestBed.createComponent(SettingsComponent);http.expectOne('/api/account').flush(profile);f.detectChanges();f.componentInstance.personalEmail='new@example.test';f.componentInstance.contactPassword='password123';f.componentInstance.saveProfile();const req=http.expectOne('/api/account');expect(req.request.method).toBe('PATCH');expect(req.request.body).toEqual({email:'new@example.test',phone:profile.phone,currentPassword:'password123'});req.flush({...profile,email:'new@example.test'});expect(f.componentInstance.contactPassword).toBe('');expect(f.componentInstance.profile()?.email).toBe('new@example.test');
 });
});
