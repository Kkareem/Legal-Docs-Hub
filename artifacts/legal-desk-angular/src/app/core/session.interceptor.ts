import {HttpInterceptorFn,HttpResponse} from '@angular/common/http';
import {inject} from '@angular/core';
import {tap} from 'rxjs';
import {SessionLifecycleService} from './session-lifecycle.service';
export const sessionInterceptor:HttpInterceptorFn=(request,next)=>{
 const session=inject(SessionLifecycleService);
 return next(request).pipe(tap({next:event=>{if(event instanceof HttpResponse){const expires=event.headers.get('X-Session-Expires-At');if(expires)session.arm(expires);}},error:error=>{if(error.status===401&&request.url.startsWith('/api/')&&!request.url.startsWith('/api/public/')&&!request.url.endsWith('/auth/login'))session.expire();}}));
};
