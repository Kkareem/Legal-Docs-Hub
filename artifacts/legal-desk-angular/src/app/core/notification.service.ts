import {Injectable,inject,signal,effect,computed} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {forkJoin,timer,switchMap,catchError,of} from 'rxjs';
import {AuthService} from './auth.service';
import {CurrencyService} from './currency.service';
export interface UserNotice {id:number;title:string;body:string;read:boolean;createdAt:string;refId:number;refType:string;}
export interface NoticePreferences {site_enabled:boolean;email_enabled:boolean;browser_enabled:boolean;}
export interface ApplicationSettings {currency:string;emailReady:boolean;pushPublicKey:string;publicUrl:string;}
@Injectable({providedIn:'root'})
export class NotificationService {
 private http=inject(HttpClient);private auth=inject(AuthService);private currency=inject(CurrencyService);
 readonly items=signal<UserNotice[]>([]);readonly preferences=signal<NoticePreferences|null>(null);
 readonly config=signal<ApplicationSettings|null>(null);readonly unread=computed(()=>this.preferences()?.site_enabled?this.items().filter(n=>!n.read).length:0);
 readonly options={withCredentials:true};
 constructor(){effect(onCleanup=>{
  const user=this.auth.user();this.items.set([]);this.preferences.set(null);
  if(!user||user.mustChangePassword)return;
  const setup=this.http.get<ApplicationSettings>('/api/settings/application',this.options).subscribe({next:c=>{this.config.set(c);this.currency.code.set(c.currency);},error:()=>this.config.set(null)});
  const poll=timer(0,20000).pipe(switchMap(()=>forkJoin({items:this.http.get<UserNotice[]>('/api/notifications',this.options),prefs:this.http.get<NoticePreferences>('/api/notifications/preferences',this.options)}).pipe(catchError(()=>of(null))))).subscribe(result=>{if(result){this.preferences.set(result.prefs);this.items.set(result.prefs.site_enabled?[...result.items].reverse():[]);}});
  onCleanup(()=>{setup.unsubscribe();poll.unsubscribe();});
 });}
 refresh(){return forkJoin({items:this.http.get<UserNotice[]>('/api/notifications',this.options),prefs:this.http.get<NoticePreferences>('/api/notifications/preferences',this.options)});}
 markRead(id:number){this.http.patch('/api/notifications/'+id+'/read',{},this.options).subscribe({next:()=>this.items.update(rows=>rows.map(n=>n.id===id?{...n,read:true}:n))});}
 markAll(){this.http.patch('/api/notifications/read-all',{},this.options).subscribe({next:()=>this.items.update(rows=>rows.map(n=>({...n,read:true})))});}
 savePreferences(p:NoticePreferences){return this.http.put<NoticePreferences>('/api/notifications/preferences',{siteEnabled:p.site_enabled,emailEnabled:p.email_enabled,browserEnabled:p.browser_enabled},this.options);}
 supported(){return typeof window!=='undefined'&&window.isSecureContext&&'Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window;}
 async enableBrowser(){
  if(!this.supported())throw new Error('هذا المتصفح لا يدعم الإشعارات هنا. استخدم HTTPS، وعلى iPhone أضف التطبيق للشاشة الرئيسية ثم افتحه منها.');
  // Request permission directly from the user's click, as required by Safari.
  const permission=await Notification.requestPermission();
  if(permission!=='granted')throw new Error('لم يتم السماح بالإشعارات. يمكنك تغيير الإذن من إعدادات المتصفح.');
  const key=this.config()?.pushPublicKey;if(!key)throw new Error('تعذر تحميل إعدادات الإشعارات. أعد تحميل الصفحة.');
  const registration=await navigator.serviceWorker.register('/notifications-sw.js');await navigator.serviceWorker.ready;
  let subscription=await registration.pushManager.getSubscription();
  if(!subscription){const bytes=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});}
  const data=subscription.toJSON();
  await new Promise<void>((resolve,reject)=>this.http.post('/api/notifications/subscriptions',{endpoint:data.endpoint,p256dh:data.keys?.['p256dh'],auth:data.keys?.['auth']},this.options).subscribe({next:()=>resolve(),error:reject}));
 }
 async removeThisBrowser(){
  if(!('serviceWorker' in navigator))return;
  const registration=await navigator.serviceWorker.getRegistration('/notifications-sw.js');const sub=await registration?.pushManager.getSubscription();
  if(!sub)return;
  try{await new Promise<void>((resolve,reject)=>this.http.delete('/api/notifications/subscriptions',{...this.options,body:{endpoint:sub.endpoint}}).subscribe({next:()=>resolve(),error:reject}));}finally{await sub.unsubscribe();}
 }
}
