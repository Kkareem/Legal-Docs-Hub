import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LoginBody, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly ready = signal(false);
  readonly loading = signal(false);
  readonly isAuthenticated = computed(() => !!this.user());

  loadCurrentUser(): Observable<User | null> {
    this.loading.set(true);
    return this.api.getMe().pipe(
      tap((user) => {
        this.user.set(user);
        this.ready.set(true);
        this.loading.set(false);
      }),
      map((user) => user ?? null),
      catchError(() => {
        this.user.set(null);
        this.ready.set(true);
        this.loading.set(false);
        return of(null);
      }),
    );
  }

  ensureSessionLoaded(): Observable<User | null> {
    if (this.ready()) return of(this.user());
    return this.loadCurrentUser();
  }

  login(body: LoginBody): Observable<User> {
    this.loading.set(true);
    return this.api.login(body).pipe(
      map((response) => response.user),
      tap((user) => {
        this.user.set(user);
        this.ready.set(true);
        this.loading.set(false);
        void this.router.navigateByUrl('/dashboard');
      }),
    );
  }

  logout(): Observable<void> {
    return this.api.logout().pipe(
      tap(() => {
        this.user.set(null);
        this.ready.set(true);
        void this.router.navigateByUrl('/login');
      }),
      catchError(() => {
        this.user.set(null);
        this.ready.set(true);
        void this.router.navigateByUrl('/login');
        return of(void 0);
      }),
    );
  }
}
