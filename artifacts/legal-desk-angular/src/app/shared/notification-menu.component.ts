import {Component,HostListener,inject,signal,ElementRef,viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {NotificationService,UserNotice} from '../core/notification.service';
import {AuthService} from '../core/auth.service';
import {IconComponent} from './icon.component';
import {ModalComponent} from './modal.component';

@Component({selector:'app-notification-menu',standalone:true,imports:[CommonModule,RouterLink,IconComponent,ModalComponent],template:`
 <div class="notification-anchor" dir="rtl">
  @if(open()){<button class="menu-backdrop" type="button" tabindex="-1" aria-label="إغلاق قائمة الإشعارات" (click)="open.set(false)"></button>}
  <button #bell class="btn btn-secondary bell-button" type="button" aria-label="الإشعارات" [attr.aria-expanded]="open()" aria-controls="notification-panel" (click)="toggle()"><app-icon name="bell"/><span class="badge badge-warning" aria-live="polite">{{notices.unread()}}</span></button>
  @if(open()){
   <section id="notification-panel" class="notice-panel" [style.top.px]="position().top" [style.left.px]="position().left" [style.width.px]="position().width" [style.max-height]="'calc(100dvh - '+position().top+'px - 16px)'" aria-label="قائمة الإشعارات">
    <header><h2>الإشعارات</h2><button class="text-action" type="button" [disabled]="!notices.unread()" (click)="notices.markAll()">قراءة الكل</button></header>
    @if(notices.error()){<p class="menu-error" role="alert">{{notices.error()}}</p>}
    @if(notices.preferences()?.site_enabled===false){<p class="empty">إشعارات الموقع متوقفة من الإعدادات.</p>}
    <div class="notice-list">
     @for(n of notices.items();track n.id){<article class="notice-row" [class.is-read]="n.read">
      <button type="button" class="notice-content" (click)="show(n)"><span class="notice-title">@if(!n.read){<span class="unread-dot" aria-label="غير مقروء"></span>}{{n.title}}</span><span class="preview">{{n.body}}</span><time>{{n.createdAt | date:'d MMMM، h:mm a':undefined:'ar-SA'}}</time></button>
      <button type="button" class="read-button" [disabled]="n.read" (click)="notices.markRead(n.id)">{{n.read?'مقروء ✓':'مقروء'}}</button>
     </article>}@empty{<p class="empty">لا توجد إشعارات.</p>}
    </div>
    <footer><a routerLink="/notifications" (click)="open.set(false)">عرض كل الإشعارات</a><a routerLink="/account" [queryParams]="{tab:'notifications'}" (click)="open.set(false)">الإعدادات</a></footer>
   </section>
  }
 </div>
 @if(selected();as n){<app-modal [title]="n.title" (closed)="closeDetails()"><p class="notice-body">{{n.body}}</p><p class="meta">{{n.createdAt | date:'d MMMM y، h:mm a':undefined:'ar-SA'}}</p>@if(notices.error()){<p role="alert">{{notices.error()}}</p>}<a class="btn btn-primary" [routerLink]="link(n)" (click)="selected.set(null)">فتح الصفحة المرتبطة</a></app-modal>}
 `,styles:[`
 :host{display:block}.notification-anchor{position:relative}.bell-button{position:relative;z-index:81;gap:8px;min-height:36px;padding:6px 12px;font-size:13px}
 .menu-backdrop{position:fixed;inset:0;z-index:80;border:0;background:transparent;cursor:default}.notice-panel{position:fixed;display:flex;flex-direction:column;z-index:82;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 16px 48px #0007;overflow:hidden}
 header,footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;flex-shrink:0}header{border-bottom:1px solid var(--line)}h2{font-size:19px;margin:0}footer{border-top:1px solid var(--line);font-size:13px;color:var(--primary)}
 .notice-list{min-height:0;max-height:min(430px,60dvh);overflow-y:auto}.notice-row{display:flex;align-items:center;gap:8px;padding:14px 12px;background:color-mix(in srgb,var(--primary) 10%,var(--surface));border-bottom:1px solid var(--line)}.notice-row:last-child{border-bottom:0}
 .notice-content{flex:1;min-width:0;border:0;background:none;color:var(--text);font:inherit;text-align:start;cursor:pointer;padding:0;display:grid;gap:5px}.notice-title{font-weight:600}.unread-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--primary);margin-inline-end:7px}.preview{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;overflow-wrap:anywhere}time{font-size:11px;color:var(--muted)}
 .read-button,.text-action{border:0;background:none;color:var(--primary);cursor:pointer;font:inherit;font-size:12px;padding:8px 4px;flex-shrink:0}.read-button:disabled,.text-action:disabled{color:var(--muted);cursor:default}.is-read{background:var(--surface)}.is-read .notice-content{color:var(--muted);opacity:.7}.is-read .notice-title{font-weight:400}.empty{padding:24px 16px;text-align:center;color:var(--muted)}.menu-error{padding:8px 16px;color:var(--danger)}.notice-body{white-space:pre-wrap;line-height:1.9;overflow-wrap:anywhere}

 `]})
export class NotificationMenuComponent {
 readonly notices=inject(NotificationService);private auth=inject(AuthService);open=signal(false);selected=signal<UserNotice|null>(null);
 bell=viewChild.required<ElementRef<HTMLButtonElement>>('bell');
 closeDetails(){this.selected.set(null);this.bell().nativeElement.focus();}
 position=signal({top:64,left:16,width:355});
 toggle(){if(this.open()){this.open.set(false);return;}const rect=this.bell().nativeElement.getBoundingClientRect();const viewport=document.documentElement.clientWidth||window.innerWidth;const width=Math.min(400,viewport-32);this.position.set({top:rect.bottom+10,left:Math.max(16,Math.min(rect.left,viewport-width-16)),width});this.open.set(true);}
 @HostListener('window:resize') resize(){this.open.set(false);}
 @HostListener('window:scroll') scroll(){this.open.set(false);}
 show(n:UserNotice){this.open.set(false);this.selected.set(n);if(!n.read)this.notices.markRead(n.id);}
 @HostListener('document:keydown.escape') escape(){this.open.set(false);}
 link(n:UserNotice){if(n.refType==='account')return '/account';if(this.auth.user()?.role==='client')return '/my-account';if(n.refType==='case')return '/case-workspace/'+n.refId;if(n.refType==='consultation')return '/consultation-requests';if(n.refType==='payment')return ['admin','owner'].includes(this.auth.user()?.role||'')?'/payment-management':'/cases';if(n.refType==='task')return '/tasks';return '/dashboard';}
}
