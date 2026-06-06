import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly navigation = computed(() => [
    { path: '/dashboard', label: 'لوحة التحكم' },
    { path: '/clients', label: 'الموكلون' },
    { path: '/cases', label: 'القضايا' },
    { path: '/tasks', label: 'المهام' },
  ]);

  logout() {
    this.auth.logout().subscribe();
  }
}
