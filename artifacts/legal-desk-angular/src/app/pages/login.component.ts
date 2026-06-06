import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('admin@legaldesk.sa');
  readonly password = signal('password123');
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  constructor() {
    this.auth.ensureSessionLoaded().subscribe((user) => {
      if (user) {
        void this.router.navigateByUrl('/dashboard');
      }
    });
  }

  submit() {
    this.error.set(null);
    this.busy.set(true);
    this.auth.login({ email: this.email(), password: this.password() }).subscribe({
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message ?? err?.message ?? 'فشل تسجيل الدخول');
      },
      complete: () => this.busy.set(false),
    });
  }
}
