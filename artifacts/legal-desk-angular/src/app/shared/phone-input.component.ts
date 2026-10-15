import {Component, forwardRef, input, booleanAttribute, effect} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors, FormsModule} from '@angular/forms';
import {joinPhone, splitPhone} from './phone-number';
@Component({
  selector: 'app-phone-input', standalone: true, imports: [FormsModule],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true}, {provide: NG_VALIDATORS, useExisting: forwardRef(() => PhoneInputComponent), multi: true}],
  template: `<div class="phone-fields" dir="ltr">
    <input class="input country-code" type="tel" aria-label="مفتاح الدولة" placeholder="+20" maxlength="4" autocomplete="tel-country-code" [disabled]="disabled" [ngModel]="countryCode" (ngModelChange)="countryCode=$event; changed()" [ngModelOptions]="{standalone:true}" (blur)="onTouched()">
    <input class="input phone-number" type="tel" aria-label="رقم الهاتف" placeholder="01018681448" maxlength="20" autocomplete="tel-national" [disabled]="disabled" [ngModel]="number" (ngModelChange)="number=$event; changed()" [ngModelOptions]="{standalone:true}" (blur)="onTouched()">
  </div><small class="meta">مفتاح الدولة ثم الرقم — مصر +20، السعودية +966</small>`,
  styles: [`:host{display:block;min-width:0}.phone-fields{display:flex;gap:8px}.country-code{width:90px;flex:0 0 90px}.phone-number{width:0;flex:1;min-width:0}small{display:block;margin-top:4px}`]
})
export class PhoneInputComponent implements ControlValueAccessor, Validator {
  readonly required=input(false, {transform:booleanAttribute});
  constructor(){effect(()=>{this.required();this.onValidatorChange();});}
  countryCode='+20'; number=''; disabled=false;
  private onChange: (value:string)=>void=()=>{};
  onTouched: ()=>void=()=>{};
  private onValidatorChange: ()=>void=()=>{};
  writeValue(value:string|null|undefined){const parts=splitPhone(value||'');this.countryCode=parts.countryCode;this.number=parts.number;}
  registerOnChange(fn:(value:string)=>void){this.onChange=fn;}
  registerOnTouched(fn:()=>void){this.onTouched=fn;}
  registerOnValidatorChange(fn:()=>void){this.onValidatorChange=fn;}
  setDisabledState(disabled:boolean){this.disabled=disabled;}
  changed(){this.onChange(joinPhone(this.countryCode,this.number));this.onValidatorChange();}
  validate(control:AbstractControl):ValidationErrors|null {
    if (!this.number.trim()) return this.required()?{required:true}:null;
    const combined=joinPhone(this.countryCode,this.number);
    return /^\+[1-9][0-9]{0,2}$/.test(this.countryCode.trim()) && /^[0-9 ()-]+$/.test(this.number) && /^\+[1-9][0-9]{6,14}$/.test(combined) ? null : {phone:true};
  }
}
