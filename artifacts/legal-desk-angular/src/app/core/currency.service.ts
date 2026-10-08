import {Injectable,signal} from '@angular/core';
@Injectable({providedIn:'root'})
export class CurrencyService {
 readonly code=signal('');
 format(value:number|string|null|undefined){
  const amount=Number(value??0);
  return new Intl.NumberFormat('ar',{...(this.code()?{style:'currency',currency:this.code()}:{}),minimumFractionDigits:2,maximumFractionDigits:2}).format(amount);
 }
}
