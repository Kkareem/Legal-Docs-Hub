import {CurrencyService} from './currency.service';
describe('Office currency',()=>{
 it('formats the same amount using the configured office currency without converting it',()=>{
  const service=new CurrencyService();service.code.set('EGP');const egyptian=service.format(1234.5);
  expect(egyptian).toBe(new Intl.NumberFormat('ar',{style:'currency',currency:'EGP',minimumFractionDigits:2,maximumFractionDigits:2}).format(1234.5));
  service.code.set('USD');expect(service.format(1234.5)).not.toBe(egyptian);
  expect(service.format(1234.5)).toContain('US$');
 });
 it('does not label amounts with an assumed currency before settings load',()=>{
  expect(new CurrencyService().format(100)).not.toContain('ر.س');
 });
});
