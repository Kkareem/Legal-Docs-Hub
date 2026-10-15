import {SessionLifecycleService} from './session-lifecycle.service';
describe('Fixed JWT session expiry',()=>{
 afterEach(()=>vi.useRealTimers());
 it('ends a session at its expiry without extending it for activity',()=>{vi.useFakeTimers();const service=new SessionLifecycleService();const expired=vi.fn();service.expired.subscribe(expired);service.arm(new Date(Date.now()+3600000).toISOString());vi.advanceTimersByTime(3599999);expect(expired).not.toHaveBeenCalled();vi.advanceTimersByTime(1);expect(expired).toHaveBeenCalledTimes(1);});
 it('replaces the expiry after a password change and clears it on sign-out',()=>{vi.useFakeTimers();const service=new SessionLifecycleService();const expired=vi.fn();service.expired.subscribe(expired);service.arm(new Date(Date.now()+1000).toISOString());service.arm(new Date(Date.now()+2000).toISOString());vi.advanceTimersByTime(1000);expect(expired).not.toHaveBeenCalled();service.clear();vi.advanceTimersByTime(2000);expect(expired).not.toHaveBeenCalled();});
});
