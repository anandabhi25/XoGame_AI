import type { Envelope } from './types';
export const API = import.meta.env.VITE_API_URL || '/api/v1';
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<Envelope<T>> {
  const response = await fetch(API + path, {method, headers: body instanceof FormData ? {} : {'Content-Type':'application/json'}, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.details?.map((d: {field: string; message: string}) => `${d.field}: ${d.message}`).join(' · ') || result.error?.message || 'Something went wrong. Please retry.');
  return result;
}
export function label(value: string) { return value.toLowerCase().replaceAll('_', ' ').replace(/^./, s => s.toUpperCase()); }
export function date(value: string) { return new Date(value).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}); }
export function money(value: number | null, currency = 'INR') { return value == null ? '' : new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:0,notation:'compact'}).format(value); }
