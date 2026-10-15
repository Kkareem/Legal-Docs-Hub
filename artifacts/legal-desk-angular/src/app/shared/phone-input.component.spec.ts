import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormsModule, NgForm} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {PhoneInputComponent} from './phone-input.component';
import {joinPhone, splitPhone} from './phone-number';
@Component({standalone:true, imports:[FormsModule,PhoneInputComponent],template:`<form><app-phone-input name="phone" [(ngModel)]="phone" [required]="required" /></form>`})
class Host {phone='';required=false;}
describe('split telephone input',()=>{
  it('normalizes Egyptian and Saudi domestic prefixes and preserves other country numbers',()=>{
    expect(joinPhone('+20','01018681448')).toBe('+201018681448');
    expect(joinPhone('+2','01018681448')).toBe('+201018681448');
    expect(joinPhone('+966','0551400324')).toBe('+966551400324');
    expect(joinPhone('+39','0612345678')).toBe('+390612345678');
    expect(joinPhone('+20','')).toBe('');
    expect(splitPhone('+201018681448')).toEqual({countryCode:'+20',number:'1018681448'});
    expect(splitPhone('00966551400324')).toEqual({countryCode:'+966',number:'551400324'});
    expect(splitPhone('+819012345678')).toEqual({countryCode:'+81',number:'9012345678'});
  });
  it('binds both fields to one international number and validates optional and required values',async()=>{
    await TestBed.configureTestingModule({imports:[Host]}).compileComponents();
    const f=TestBed.createComponent(Host);f.detectChanges();await f.whenStable();f.detectChanges();
    const form=f.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
    expect(form.valid).toBe(true);
    f.componentInstance.required=true;f.changeDetectorRef.markForCheck();f.detectChanges();await f.whenStable();f.detectChanges();expect(form.valid).toBe(false);
    const fields=f.nativeElement.querySelectorAll('input');
    fields[0].value='+966';fields[0].dispatchEvent(new Event('input'));
    fields[1].value='0551400324';fields[1].dispatchEvent(new Event('input'));
    f.detectChanges();await f.whenStable();f.detectChanges();
    expect(f.componentInstance.phone).toBe('+966551400324');expect(form.valid).toBe(true);
    fields[1].value='abc';fields[1].dispatchEvent(new Event('input'));
    f.detectChanges();await f.whenStable();expect(form.valid).toBe(false);
  });
});
