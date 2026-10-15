import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {sessionInterceptor} from './core/session.interceptor';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeArSa from '@angular/common/locales/ar-SA';

import { routes } from './app.routes';

registerLocaleData(localeArSa, 'ar-SA');

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient(withInterceptors([sessionInterceptor])), provideRouter(routes)],
};
