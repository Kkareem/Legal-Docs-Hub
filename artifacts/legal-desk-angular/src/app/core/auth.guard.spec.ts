import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { adminGuard, authGuard, passwordGuard, staffGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { User } from './models';

describe('Onboarding and staff route guards', () => {
  let user: User | null;
  beforeEach(() => {
    user = { id: 1, name: 'Test', email: 'test@example.com', role: 'lawyer', active: true, createdAt: '', mustChangePassword: false };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { ensureSessionLoaded: () => of(user) } }],
    });
  });
  async function run(guard: CanActivateFn) {
    const result = TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    const resolved = await firstValueFrom(result as Observable<boolean | UrlTree>);
    return resolved instanceof UrlTree ? TestBed.inject(Router).serializeUrl(resolved) : resolved;
  }
  it('redirects unauthenticated users to login', async () => {
    user = null;
    expect(await run(authGuard)).toBe('/login');
    expect(await run(passwordGuard)).toBe('/login');
  });
  it('requires password change before protected pages', async () => {
    user!.mustChangePassword = true;
    expect(await run(authGuard)).toBe('/change-password');
    expect(await run(passwordGuard)).toBe(true);
  });
  it('allows the normal dashboard after onboarding', async () => {
    expect(await run(authGuard)).toBe(true);
  });
  it('denies lawyers access to account administration but allows assigned requests', async () => {
    expect(await run(adminGuard)).toBe('/dashboard');
    expect(await run(staffGuard)).toBe(true);
  });
  it('allows admins and owners to manage lawyers', async () => {
    user!.role = 'admin';
    expect(await run(adminGuard)).toBe(true);
    user!.role = 'owner';
    expect(await run(adminGuard)).toBe(true);
  });
  it('denies clients access to staff consultation requests', async () => {
    user!.role = 'client';
    expect(await run(staffGuard)).toBe('/dashboard');
  });
});
