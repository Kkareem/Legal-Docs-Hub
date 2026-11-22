import {Component, ElementRef, HostListener, ViewChild, forwardRef, input, booleanAttribute, effect} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors, FormsModule} from '@angular/forms';
import {joinPhone, splitPhone} from './phone-number';
import {PHONE_COUNTRIES, PhoneCountry, searchPhoneCountries} from './phone-countries';
@Component({
  selector: 'app-phone-input', standalone: true, imports: [FormsModule],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true}, {provide: NG_VALIDATORS, useExisting: forwardRef(() => PhoneInputComponent), multi: true}],
  template: `<div class="phone-fields" dir="rtl" (focusout)="focusOut($event)">
    <div class="country-picker">
      <button class="input country-toggle" type="button" aria-label="مفتاح الدولة" aria-haspopup="listbox" [attr.aria-expanded]="open" [attr.aria-controls]="listId" [disabled]="disabled" (click)="toggle()" (keydown.arrowdown)="$event.preventDefault(); show()">
        <span>{{selectedCountry?.name || 'اختر الدولة'}} <bdi>{{countryCode}}</bdi></span><span aria-hidden="true">▾</span>
      </button>
      @if(open){
        <div class="country-popup">
          <input #countrySearch class="input country-search" type="search" role="combobox" aria-label="ابحث عن الدولة" placeholder="ابحث باسم الدولة أو المفتاح" autocomplete="off" [attr.aria-controls]="listId" aria-expanded="true" aria-autocomplete="list" [attr.aria-activedescendant]="filteredCountries.length ? listId + '-' + activeIndex : null" [ngModel]="query" (ngModelChange)="query=$event; activeIndex=0" [ngModelOptions]="{standalone:true}" (keydown)="searchKey($event)">
          <div class="country-options" role="listbox" aria-label="الدول ومفاتيح الاتصال" [id]="listId">
            @for(country of filteredCountries; track country.id; let i=$index){
              <button type="button" role="option" tabindex="-1" [id]="listId + '-' + i" [attr.aria-selected]="country.id===selectedCountry?.id" [class.active]="i===activeIndex" (mousedown)="$event.preventDefault()" (click)="selectCountry(country)"><span>{{country.name}}</span><bdi>{{country.code}}</bdi></button>
            } @empty {<p class="meta" role="status">لا توجد دولة مطابقة</p>}
          </div>
        </div>
      }
    </div>
    <input class="input phone-number" dir="ltr" type="tel" aria-label="رقم الهاتف" placeholder="رقم الهاتف بدون مفتاح الدولة" maxlength="20" autocomplete="tel-national" [disabled]="disabled" [value]="number" (input)="number=$any($event.target).value; changed()">
  </div><small class="meta">اختر الدولة ثم أدخل رقم الهاتف</small>`,
  styles: [`:host{display:block;min-width:0}.phone-fields{display:flex;gap:8px}.country-picker{position:relative;flex:0 1 48%;min-width:0}.country-toggle{display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;text-align:right;cursor:pointer}.country-toggle>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.phone-number{width:0;flex:1;min-width:0}.country-popup{position:absolute;inset-inline-start:0;top:calc(100% + 4px);width:320px;max-width:calc(100vw - 48px);padding:8px;background:var(--surface,#181818);color:var(--text,#f2efe7);border:1px solid var(--line,#34332d);border-radius:10px;box-shadow:0 8px 24px #0002;z-index:100}.country-search{width:100%;box-sizing:border-box}.country-options{max-height:230px;overflow-y:auto;margin-top:6px}.country-options button{display:flex;justify-content:space-between;gap:12px;width:100%;padding:9px 10px;border:0;border-radius:6px;background:transparent;color:inherit;text-align:right;cursor:pointer;font:inherit}.country-options button:hover,.country-options button.active{background:var(--surface-soft,#20201e)}.country-options button[aria-selected=true]{font-weight:700}.country-options p{padding:8px}small{display:block;margin-top:4px}@media(max-width:480px){.phone-fields{flex-wrap:wrap}.country-picker{flex:1 1 100%}.phone-number{flex-basis:100%;width:100%}}`]
})
export class PhoneInputComponent implements ControlValueAccessor, Validator {
  private static nextId=0;
  readonly listId='phone-countries-'+PhoneInputComponent.nextId++;
  readonly required=input(false, {transform:booleanAttribute});
  @ViewChild('countrySearch') searchInput?:ElementRef<HTMLInputElement>;
  constructor(private host:ElementRef<HTMLElement>){effect(()=>{this.required();this.onValidatorChange();});}
  countryCode='+20'; number=''; disabled=false; open=false; query=''; activeIndex=0;
  selectedCountry:PhoneCountry|undefined=PHONE_COUNTRIES.find(c=>c.id==='EG');
  get filteredCountries(){return searchPhoneCountries(this.query);}
  private onChange:(value:string)=>void=()=>{};
  onTouched:()=>void=()=>{};
  private onValidatorChange:()=>void=()=>{};
  writeValue(value:string|null|undefined){const parts=splitPhone(value||'');this.countryCode=parts.countryCode;this.number=parts.number;if(this.selectedCountry?.code!==this.countryCode)this.selectedCountry=PHONE_COUNTRIES.find(c=>c.code===this.countryCode);}
  registerOnChange(fn:(value:string)=>void){this.onChange=fn;}
  registerOnTouched(fn:()=>void){this.onTouched=fn;}
  registerOnValidatorChange(fn:()=>void){this.onValidatorChange=fn;}
  setDisabledState(disabled:boolean){this.disabled=disabled;if(disabled)this.open=false;}
  changed(){this.onChange(joinPhone(this.countryCode,this.number));this.onValidatorChange();}
  toggle(){if(this.open)this.open=false;else this.show();}
  show(){if(this.disabled)return;this.open=true;this.query='';this.activeIndex=0;setTimeout(()=>this.searchInput?.nativeElement.focus());}
  selectCountry(country:PhoneCountry){this.selectedCountry=country;this.countryCode=country.code;this.open=false;this.changed();this.focusToggle();}
  private focusToggle(){this.host.nativeElement.querySelector<HTMLButtonElement>('.country-toggle')?.focus();}
  searchKey(event:KeyboardEvent){
    const countries=this.filteredCountries;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.open=false;this.focusToggle();return;}
    if(event.key==='Enter'){event.preventDefault();if(countries[this.activeIndex])this.selectCountry(countries[this.activeIndex]);return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();this.activeIndex=Math.max(0,Math.min(countries.length-1,this.activeIndex+(event.key==='ArrowDown'?1:-1)));
      this.host.nativeElement.querySelector<HTMLElement>('#'+this.listId+'-'+this.activeIndex)?.scrollIntoView?.({block:'nearest'});
    }
  }
  focusOut(event:FocusEvent){if(!this.host.nativeElement.contains(event.relatedTarget as Node|null)){this.open=false;this.onTouched();}}
  @HostListener('document:click',['$event']) outsideClick(event:MouseEvent){if(!this.host.nativeElement.contains(event.target as Node))this.open=false;}
  validate(control:AbstractControl):ValidationErrors|null {
    if(!this.number.trim())return this.required()?{required:true}:null;
    const combined=joinPhone(this.countryCode,this.number);
    return PHONE_COUNTRIES.some(c=>c.code===this.countryCode)&&/^[0-9 ()-]+$/.test(this.number)&&/^\+[1-9][0-9]{6,14}$/.test(combined)?null:{phone:true};
  }
}
