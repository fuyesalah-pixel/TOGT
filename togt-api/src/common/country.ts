const CITY_COUNTRIES: Record<string, string> = {
  add: 'Ethiopia', ethiopia: 'Ethiopia', dxb: 'United Arab Emirates', dubai: 'United Arab Emirates',
  jed: 'Saudi Arabia', jeddah: 'Saudi Arabia', med: 'Saudi Arabia', madinah: 'Saudi Arabia', makkah: 'Saudi Arabia', mecca: 'Saudi Arabia',
  ist: 'Turkey', istanbul: 'Turkey', lhr: 'United Kingdom', london: 'United Kingdom', jfk: 'United States', 'new york': 'United States',
  cai: 'Egypt', cairo: 'Egypt', nbo: 'Kenya', nairobi: 'Kenya', doh: 'Qatar', doha: 'Qatar', bom: 'India', mumbai: 'India', del: 'India', delhi: 'India',
  pek: 'China', beijing: 'China', bkk: 'Thailand', bangkok: 'Thailand', fra: 'Germany', frankfurt: 'Germany', cdg: 'France', paris: 'France',
};

export function countryFromValue(value: unknown, fallback = 'Ethiopia') {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const normalized = value.trim().toLowerCase();
  return CITY_COUNTRIES[normalized] ?? value.trim();
}

export function originCountry(user: { nationality?: string | null; phone?: string | null; passportNumber?: string | null }) {
  if (user.nationality) return countryFromValue(user.nationality);
  if (user.phone?.replace(/[\s()-]/g, '').startsWith('+251')) return 'Ethiopia';
  if (user.passportNumber?.toUpperCase().startsWith('ET')) return 'Ethiopia';
  return 'Ethiopia';
}

export function destinationCountry(form: Record<string, unknown>, serviceType: string) {
  if (serviceType === 'UMRAH') return 'Saudi Arabia';
  if (serviceType === 'DOMESTIC') return 'Ethiopia';
  return countryFromValue(form.destinationCountry ?? form.destination ?? form.to ?? form.destinations);
}
