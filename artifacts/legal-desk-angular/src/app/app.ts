import {AuthService} from './core/auth.service';
import {NotificationService} from './core/notification.service';
import { Component,inject } from '@angular/core';
import { RouterOutlet,RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
 readonly auth=inject(AuthService);readonly notices=inject(NotificationService);
 async logout(){try{await this.notices.removeThisBrowser();}catch{}this.auth.logout().subscribe();}
}
