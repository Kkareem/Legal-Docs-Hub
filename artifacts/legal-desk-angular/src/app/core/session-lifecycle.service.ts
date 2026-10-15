import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
@Injectable({providedIn:'root'})
export class SessionLifecycleService {
 readonly expired=new Subject<void>();private timer:ReturnType<typeof setTimeout>|undefined;
 arm(expiresAt:string){this.clear();const remaining=Date.parse(expiresAt)-Date.now();if(Number.isFinite(remaining))this.timer=setTimeout(()=>this.expired.next(),Math.max(0,remaining));}
 clear(){if(this.timer!==undefined)clearTimeout(this.timer);this.timer=undefined;}
 expire(){this.clear();this.expired.next();}
}
