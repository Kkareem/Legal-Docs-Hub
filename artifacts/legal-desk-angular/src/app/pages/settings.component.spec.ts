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
 beforeEach(async()=>{
  notices={options:{withCredentials:true},preferences:angularSignal(null),items:angularSignal([]),config:angularSignal({emailReady:false}),refresh:()=>of({items:[],prefs:{site_enabled:true,email_enabled:true,browser_enabled:false}}),savePreferences:vi.fn(p=>of(p)),enableBrowser:vi.fn(()=>Promise.reject(new Error('المتصفح لا يدعم الإشعارات')))};
  await TestBed.configureTestingModule({imports:[SettingsComponent],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting(),{provide:NotificationService,useValue:notices},{provide:AuthService,useValue:{user:()=>({role:'client'})}}]}).compileComponents();
  http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 it('lets a client independently save channel preferences without office email settings',()=>{
  const f=TestBed.createComponent(SettingsComponent);f.detectChanges();
  expect(f.nativeElement.textContent).not.toContain('بريد المكتب عبر Gmail');
  f.componentInstance.prefs.email_enabled=false;f.componentInstance.save();
  expect(notices.savePreferences).toHaveBeenCalledWith({site_enabled:true,email_enabled:false,browser_enabled:false});
  expect(f.componentInstance.message()).toContain('تم حفظ');
 });
 it('keeps browser notifications off and explains unsupported browsers',async()=>{
  const f=TestBed.createComponent(SettingsComponent);f.componentInstance.prefs.browser_enabled=true;
  await f.componentInstance.enableDevice();
  expect(f.componentInstance.prefs.browser_enabled).toBe(false);expect(f.componentInstance.message()).toContain('لا يدعم');
 });
});
