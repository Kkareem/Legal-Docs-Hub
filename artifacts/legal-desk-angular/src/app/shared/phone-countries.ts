import {getCountries, getCountryCallingCode, CountryCode} from 'libphonenumber-js/min';
export interface PhoneCountry {id: CountryCode; name: string; code: string;}
const names = new Intl.DisplayNames(['ar'], {type: 'region'});
export const PHONE_COUNTRIES: readonly PhoneCountry[] = getCountries().map(id => ({
  id, name: names.of(id) || id, code: '+' + getCountryCallingCode(id)
})).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
export function normalizeCountrySearch(value: string): string {
  return value.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).trim().toLowerCase();
}
export function searchPhoneCountries(query: string): readonly PhoneCountry[] {
  const term = normalizeCountrySearch(query);
  return PHONE_COUNTRIES.filter(c => normalizeCountrySearch(c.name + ' ' + c.id + ' ' + c.code + (c.id === 'US' ? ' امريكا الولايات المتحدة' : c.id === 'GB' ? ' بريطانيا انجلترا' : '')).includes(term));
}
