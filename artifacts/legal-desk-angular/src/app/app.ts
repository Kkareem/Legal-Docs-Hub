import {NotificationMenuComponent} from './shared/notification-menu.component';
import {AuthService} from './core/auth.service';
import {NotificationService} from './core/notification.service';
import { Component,inject,effect,signal,HostListener } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { RouterOutlet,RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RouterLink,NotificationMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
 readonly auth=inject(AuthService);readonly notices=inject(NotificationService);
 private http=inject(HttpClient);profileOpen=signal(false);avatarFailed=signal(false);
 constructor(){effect(onCleanup=>{const user=this.auth.user();this.profileOpen.set(false);this.auth.avatarUrl.set(null);this.avatarFailed.set(false);if(!user||user.mustChangePassword)return;const subscription=this.http.get<{avatarUrl:string|null}>('/api/account',{withCredentials:true}).subscribe({next:p=>{if(this.auth.user()?.id===user.id)this.auth.avatarUrl.set(p.avatarUrl);},error:()=>{}});onCleanup(()=>subscription.unsubscribe());});effect(()=>{this.auth.avatarUrl();this.avatarFailed.set(false);});}
 @HostListener('document:keydown.escape') closeProfile(){this.profileOpen.set(false);}
 @HostListener('window:resize') resize(){this.profileOpen.set(false);}
 async logout(){this.profileOpen.set(false);try{await this.notices.removeThisBrowser();}catch{}this.auth.logout().subscribe();}
}
