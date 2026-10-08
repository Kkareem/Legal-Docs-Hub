import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureSessionLoaded().pipe(
    map((user) => !user ? router.createUrlTree(['/login']) : user.mustChangePassword ? router.createUrlTree(['/change-password']) : true),
  );
};

export const passwordGuard: CanActivateFn = () => {
 const auth=inject(AuthService);const router=inject(Router);
 return auth.ensureSessionLoaded().pipe(map(user=>user ? true : router.createUrlTree(['/login'])));
};
export const adminGuard: CanActivateFn = () => {
 const auth=inject(AuthService);const router=inject(Router);
 return auth.ensureSessionLoaded().pipe(map(user=>user && ['admin','owner'].includes(user.role) ? true : router.createUrlTree(['/dashboard'])));
};
export const staffGuard: CanActivateFn = () => {
 const auth=inject(AuthService);const router=inject(Router);
 return auth.ensureSessionLoaded().pipe(map(user=>user && ['admin','owner','lawyer'].includes(user.role) ? true : router.createUrlTree(['/dashboard'])));
};
