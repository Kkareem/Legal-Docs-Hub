import {TestBed} from '@angular/core/testing';
import {signal,computed} from '@angular/core';
import {provideRouter} from '@angular/router';
import {NotificationMenuComponent} from './notification-menu.component';
import {NotificationService,UserNotice} from '../core/notification.service';
import {AuthService} from '../core/auth.service';
import {registerLocaleData} from '@angular/common';
import locale from '@angular/common/locales/ar-SA';
registerLocaleData(locale,'ar-SA');

describe('Notification dropdown',()=>{
 let notices:any;
 beforeEach(()=>{
  const items=signal<UserNotice[]>([{id:1,title:'طلب مستند',body:'يرجى تقديم أصل العقد',read:false,createdAt:'2026-10-15T09:00:00Z',refType:'case',refId:10},{id:2,title:'موعد جلسة',body:'جلسة جديدة',read:false,createdAt:'2026-10-14T09:00:00Z',refType:'case',refId:10}]);
  notices={items,error:signal(''),preferences:()=>({site_enabled:true}),unread:computed(()=>items().filter(n=>!n.read).length),markRead:vi.fn((id:number)=>items.update(rows=>rows.map(n=>n.id===id?{...n,read:true}:n))),markAll:vi.fn(()=>items.update(rows=>rows.map(n=>({...n,read:true}))))};
  TestBed.configureTestingModule({imports:[NotificationMenuComponent],providers:[provideRouter([]),{provide:NotificationService,useValue:notices},{provide:AuthService,useValue:{user:()=>({role:'client'})}}]});
 });
 it('marks an individual notification without opening its details, then dims all on read-all',()=>{
  const f=TestBed.createComponent(NotificationMenuComponent);f.detectChanges();f.componentInstance.toggle();f.detectChanges();
  f.nativeElement.querySelector('.read-button').click();f.detectChanges();
  expect(notices.markRead).toHaveBeenCalledWith(1);expect(f.nativeElement.querySelectorAll('.is-read').length).toBe(1);expect(f.nativeElement.querySelector('dialog')).toBeNull();
  f.nativeElement.querySelector('.text-action').click();f.detectChanges();expect(notices.markAll).toHaveBeenCalled();expect(f.nativeElement.querySelectorAll('.is-read').length).toBe(2);expect(notices.unread()).toBe(0);
 });
 it('opens the full text in a modal and records the notification as read',()=>{
  const f=TestBed.createComponent(NotificationMenuComponent);f.detectChanges();f.componentInstance.toggle();f.detectChanges();f.nativeElement.querySelector('.notice-content').click();f.detectChanges();
  expect(f.nativeElement.querySelector('.notice-panel')).toBeNull();expect(f.nativeElement.querySelector('dialog').textContent).toContain('يرجى تقديم أصل العقد');expect(notices.markRead).toHaveBeenCalledWith(1);expect(f.nativeElement.querySelector('dialog a').getAttribute('href')).toBe('/my-account');
  f.nativeElement.querySelector('dialog button').click();f.detectChanges();expect(f.nativeElement.querySelector('dialog')).toBeNull();
 });
});
