import {Component,inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {NotificationService,UserNotice} from '../core/notification.service';
import {AuthService} from '../core/auth.service';
@Component({standalone:true,imports:[CommonModule,RouterLink],template:`
<main class="page-shell"><div class="toolbar"><h1 class="section-title">إشعاراتي</h1><a class="btn btn-secondary" [routerLink]="auth.user()?.role==='client'?'/my-account':'/dashboard'">العودة لحسابي</a><a class="btn btn-secondary" routerLink="/settings">إعدادات الإشعارات</a><button class="btn btn-secondary" (click)="notices.markAll()" [disabled]="!notices.unread()">تحديد الكل كمقروء</button></div>
@if(notices.preferences()?.site_enabled===false){<p class="card panel">إشعارات الموقع متوقفة. يمكنك تفعيلها من الإعدادات.</p>}
<div class="grid" style="margin-top:24px">@for(n of notices.items();track n.id){<article class="card panel" [class.notice-unread]="!n.read"><div class="toolbar"><h2>{{n.title}}</h2>@if(!n.read){<span class="badge badge-warning">جديد</span>}</div><p>{{n.body}}</p><p class="meta">{{n.createdAt|date:'short'}}</p><div class="toolbar"><a class="btn btn-primary" [routerLink]="link(n)" (click)="notices.markRead(n.id)">عرض التفاصيل</a>@if(!n.read){<button class="btn btn-secondary" (click)="notices.markRead(n.id)">تحديد كمقروء</button>}</div></article>}@empty{<p class="card empty-state">لا توجد إشعارات لعرضها.</p>}</div></main>`})
export class NotificationsComponent {
 readonly notices=inject(NotificationService);readonly auth=inject(AuthService);
 link(n:UserNotice){if(this.auth.user()?.role==='client')return '/my-account';if(n.refType==='case')return '/case-workspace/'+n.refId;if(n.refType==='consultation')return '/consultation-requests';if(n.refType==='payment')return ['admin','owner'].includes(this.auth.user()?.role||'')?'/payment-management':'/cases';if(n.refType==='task')return '/tasks';return '/dashboard';}
}
