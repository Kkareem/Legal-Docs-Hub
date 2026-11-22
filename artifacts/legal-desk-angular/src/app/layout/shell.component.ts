import {OfficeBrandingService} from '../core/office-branding.service';
import {IconComponent} from '../shared/icon.component';
import { CommonModule } from '@angular/common';
import { Component, computed, inject,signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
 readonly branding=inject(OfficeBrandingService);
 readonly icons:Record<string,string>={'/dashboard':'grid','/clients':'users','/cases':'briefcase','/tasks':'check','/lawyers':'scale','/payment-management':'file','/consultation-requests':'message'};
 readonly menuOpen=signal(false);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly navigation = computed(() => [
    { path: '/dashboard', label: 'لوحة التحكم' },
    { path: '/clients', label: 'الموكلون' },
    { path: '/cases', label: 'القضايا' },
    { path: '/tasks', label: 'المهام' },
    ...(['admin','owner'].includes(this.user()?.role || '') ? [{path:'/lawyers',label:'إدارة المحامين'}] : []),
    ...(['admin','owner'].includes(this.user()?.role || '') ? [{path:'/payment-management',label:'التحويلات والإيصالات'}] : []),
    ...(['admin','owner','lawyer'].includes(this.user()?.role || '') ? [{path:'/consultation-requests',label:'طلبات الاستشارات'}] : []),
  ]);

  logout() {
    this.auth.logout().subscribe();
  }
}
