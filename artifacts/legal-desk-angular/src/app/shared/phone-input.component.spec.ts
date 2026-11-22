import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormsModule, NgForm} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {PhoneInputComponent} from './phone-input.component';
import {joinPhone, splitPhone} from './phone-number';
import {PHONE_COUNTRIES, searchPhoneCountries} from './phone-countries';
@Component({standalone:true, imports:[FormsModule,PhoneInputComponent],template:`<form><app-phone-input name="phone" [(ngModel)]="phone" [required]="required" [disabled]="disabled" /></form>`})
class Host {phone='';required=false;disabled=false;}
describe('split telephone input',()=>{
  it('normalizes Egyptian and Saudi domestic prefixes and preserves other country numbers',()=>{
    expect(joinPhone('+20','01000000000')).toBe('+201000000000');
    expect(joinPhone('+2','01000000000')).toBe('+201000000000');
    expect(joinPhone('+966','0500000000')).toBe('+966500000000');
    expect(joinPhone('+39','0612345678')).toBe('+390612345678');
    expect(joinPhone('+20','')).toBe('');
    expect(splitPhone('+201000000000')).toEqual({countryCode:'+20',number:'1000000000'});
    expect(splitPhone('00966500000000')).toEqual({countryCode:'+966',number:'500000000'});
    expect(splitPhone('+819012345678')).toEqual({countryCode:'+81',number:'9012345678'});
  });
  it('binds both fields to one international number and validates optional and required values',async()=>{
    await TestBed.configureTestingModule({imports:[Host]}).compileComponents();
    const f=TestBed.createComponent(Host);f.detectChanges();await f.whenStable();f.detectChanges();
    const form=f.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
    expect(form.valid).toBe(true);
    f.componentInstance.required=true;f.changeDetectorRef.markForCheck();f.detectChanges();await f.whenStable();f.detectChanges();expect(form.valid).toBe(false);
    const fields=f.nativeElement.querySelectorAll('input');
    const phone=f.debugElement.query(By.directive(PhoneInputComponent)).componentInstance as PhoneInputComponent;
    phone.selectCountry(PHONE_COUNTRIES.find(c=>c.id==='SA')!);
    f.detectChanges();await f.whenStable();f.detectChanges();
    fields[0].value='0500000000';fields[0].dispatchEvent(new Event('input'));
    f.detectChanges();await f.whenStable();f.detectChanges();
    expect(f.componentInstance.phone).toBe('+966500000000');expect(form.valid).toBe(true);
    fields[0].value='abc';fields[0].dispatchEvent(new Event('input'));
    f.detectChanges();await f.whenStable();expect(form.valid).toBe(false);
  });
  it('covers dialable countries and searches partial Arabic names without requiring hamzas',()=>{
    expect(PHONE_COUNTRIES.length).toBeGreaterThan(240);
    expect(searchPhoneCountries('سعود').some(c=>c.id==='SA'&&c.code==='+966')).toBe(true);
    expect(searchPhoneCountries('امارات').some(c=>c.id==='AE')).toBe(true);
    expect(searchPhoneCountries('الياب').some(c=>c.id==='JP'&&c.code==='+81')).toBe(true);
    expect(searchPhoneCountries('٩٦٦').some(c=>c.id==='SA')).toBe(true);
    expect(splitPhone('+38344123456')).toEqual({countryCode:'+383',number:'44123456'});
  });
  it('filters the country dropdown, selects using the keyboard, and preserves the phone number',async()=>{
    await TestBed.configureTestingModule({imports:[Host]}).compileComponents();
    const f=TestBed.createComponent(Host);f.componentInstance.phone='+201000000000';f.detectChanges();await f.whenStable();f.detectChanges();
    f.nativeElement.querySelector('.country-toggle').click();f.detectChanges();await f.whenStable();f.detectChanges();
    const search=f.nativeElement.querySelector('.country-search') as HTMLInputElement;
    search.value='سعود';search.dispatchEvent(new Event('input'));f.detectChanges();await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelectorAll('[role=option]').length).toBe(1);
    search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));f.detectChanges();await f.whenStable();f.detectChanges();
    expect(f.componentInstance.phone).toBe('+9661000000000');
    expect(f.nativeElement.querySelector('.country-popup')).toBeNull();
    expect(f.nativeElement.querySelector('.phone-number').placeholder).toBe('رقم الهاتف بدون مفتاح الدولة');
    const phone=f.debugElement.query(By.directive(PhoneInputComponent)).componentInstance as PhoneInputComponent;
    f.componentInstance.disabled=true;f.changeDetectorRef.markForCheck();f.detectChanges();await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.country-toggle').disabled).toBe(true);
    expect(f.nativeElement.querySelector('.phone-number').disabled).toBe(true);
  });
});
