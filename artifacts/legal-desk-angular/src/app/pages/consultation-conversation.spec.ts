import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ConsultationRequestsComponent } from './consultation-requests.component';
import { PublicConsultationComponent } from './public-consultation.component';

describe('Consultation conversation', () => {
  const staffMessage = {id:1,sender_type:'staff' as const,sender_name:'المحامي أحمد',body:'Office response',created_at:''};
  it('hides the staff reply form after a response and reopens it for a visitor follow-up', async () => {
    const request = {id:1,name:'Test visitor',summary:'Question',status:'answered',canReply:false,messages:[staffMessage],assigned_to:2};
    const api = {listConsultationRequests:()=>of([request])};
    await TestBed.configureTestingModule({
      imports:[ConsultationRequestsComponent],
      providers:[{provide:ApiService,useValue:api},{provide:AuthService,useValue:{user:()=>({role:'lawyer'})}}],
    }).compileComponents();
    const fixture=TestBed.createComponent(ConsultationRequestsComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Office response');
    expect(fixture.nativeElement.textContent).toContain('المحامي أحمد');
    expect(fixture.nativeElement.textContent).toContain('بانتظار رد الزائر');
    request.canReply=true;
    request.status='pending';
    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea')).not.toBeNull();
    expect(fixture.componentInstance.replies[1]).toBe('');
  });

  it('lets the visitor reply, then hides the form and preserves both messages', async () => {
    const tracked={id:1,summary:'Question',status:'answered',response:'Office response',canReply:true,messages:[staffMessage]};
    const visitorMessage={id:2,sender_type:'visitor' as const,body:'Visitor follow-up',created_at:''};
    const reply=vi.fn(()=>of({...tracked,status:'pending',canReply:false,messages:[staffMessage,visitorMessage]}));
    await TestBed.configureTestingModule({
      imports:[PublicConsultationComponent],
      providers:[provideRouter([]),{provide:ApiService,useValue:{
        recordVisit:()=>of(undefined),trackConsultation:()=>of(tracked),replyAsVisitor:reply,
      }}],
    }).compileComponents();
    const fixture=TestBed.createComponent(PublicConsultationComponent);
    fixture.componentInstance.id=1;
    fixture.componentInstance.token='secret-token';
    fixture.componentInstance.track();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea[name="visitorReply"]')).not.toBeNull();
    fixture.componentInstance.visitorReply='Visitor follow-up';
    fixture.componentInstance.reply();
    fixture.detectChanges();
    expect(reply).toHaveBeenCalledWith({id:1,token:'secret-token',response:'Visitor follow-up'});
    expect(fixture.nativeElement.querySelector('textarea[name="visitorReply"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Office response');
    expect(fixture.nativeElement.textContent).toContain('Visitor follow-up');
    expect(fixture.nativeElement.textContent).toContain('المحامي أحمد');
    expect(fixture.nativeElement.textContent).toContain('بانتظار رد المكتب');
  });

  it('lets admins select several assignees and keeps their names visible', async () => {
    const assign=vi.fn(()=>of(undefined));
    const request={id:1,name:'Visitor',summary:'Question',status:'pending',canReply:true,messages:[],assignees:[{id:2,name:'أحمد',active:true},{id:3,name:'سارة',active:true}]};
    await TestBed.configureTestingModule({
      imports:[ConsultationRequestsComponent],
      providers:[{provide:ApiService,useValue:{
        listConsultationRequests:()=>of([request]),assignConsultation:assign,
        listUsers:()=>of([{id:2,name:'أحمد',role:'lawyer',active:true},{id:3,name:'سارة',role:'lawyer',active:true}]),
      }},{provide:AuthService,useValue:{user:()=>({role:'admin'})}}],
    }).compileComponents();
    const fixture=TestBed.createComponent(ConsultationRequestsComponent);
    fixture.detectChanges();
    const checkboxes=fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(true);
    fixture.componentInstance.assign(1);
    expect(assign).toHaveBeenCalledWith(1,[2,3]);
    expect(fixture.nativeElement.textContent).toContain('أحمد');
    expect(fixture.nativeElement.textContent).toContain('سارة');
  });
});
