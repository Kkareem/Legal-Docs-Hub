import {PHONE_COUNTRIES} from './phone-countries';
const CALLING_CODES = [...new Set(PHONE_COUNTRIES.map(c => c.code))].sort((a,b) => b.length-a.length);
export function joinPhone(countryCode: string, number: string): string {
  if (!number.trim()) return '';
  let code = countryCode.trim();
  let local = number.trim().replace(/[ ()-]/g, '');
  // Egypt and Saudi Arabia omit the domestic leading zero internationally.
  if (code === '+2' && local.startsWith('0')) code = '+20';
  if (['+20', '+966'].includes(code)) local = local.replace(/^0/, '');
  return code + local;
}
export function splitPhone(value: string): {countryCode: string; number: string} {
  const clean = value.trim().replace(/[ ()-]/g, '').replace(/^00/, '+');
  if (!clean) return {countryCode: '+20', number: ''};
  const code = CALLING_CODES.find(c => clean.startsWith(c));
  if (code) return {countryCode: code, number: clean.slice(code.length)};
  // Keep unknown prefixes or legacy domestic numbers intact until explicitly edited.
  return {countryCode: '', number: clean};
}
