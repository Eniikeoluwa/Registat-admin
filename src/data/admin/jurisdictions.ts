import { baseEntities, defaultFields, defaultDocuments, defaultFees, type ServiceDocument, type ServiceEntity, type ServiceFee, type ServiceField } from './services';

export type JurisdictionStatus = 'Active' | 'Coming soon' | 'Inactive';
export type ComplianceDocument = { id: string; name: string; required: boolean; notes: string };
export type ComplianceRequirement = { id: string; name: string; description: string; regulator: string; entityIds: string[]; frequency: string; dueRule: string; dueDetail: string; documents: ComplianceDocument[]; enabled: boolean };
export type JurisdictionService = { id: string; name: string; description: string; enabled: boolean; entityIds: string[]; entities: ServiceEntity[] };
export type Jurisdiction = { id: string; name: string; code: string; flag: string; region: string; currency: string; currencyName: string; status: JurisdictionStatus; dateAdded: string; updated: string; description: string; website: string; regulator: string; notes: string; services: JurisdictionService[]; entities: string[]; requirements: ComplianceRequirement[]; seedServiceCount?: number; companiesRegistered?: number; totalRevenue?: number; averageProcessingDays?: number };
export const regions = ['Africa', 'Europe', 'North America', 'South America', 'Middle East', 'Asia', 'Oceania'];
export const currencies = [
  { code: 'NGN', name: 'Nigerian Naira' }, { code: 'GBP', name: 'Pound Sterling' }, { code: 'USD', name: 'US Dollar' },
  { code: 'AED', name: 'UAE Dirham' }, { code: 'ZAR', name: 'South African Rand' }, { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'CAD', name: 'Canadian Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'GHS', name: 'Ghanaian Cedi' },
];
export const countryOptions = [
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬', currency: 'NGN', region: 'Africa' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', currency: 'GBP', region: 'Europe' },
  { name: 'United States', code: 'US', flag: '🇺🇸', currency: 'USD', region: 'North America' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', currency: 'AED', region: 'Middle East' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', currency: 'ZAR', region: 'Africa' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪', currency: 'KES', region: 'Africa' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', currency: 'CAD', region: 'North America' },
];
export const jurisdictionEntityOptions = [
  ...baseEntities.map(entity => ({ id: entity.id, name: entity.name, description: entity.description })),
  { id: 'other', name: 'Other (Custom)', description: 'Entity types specific to this jurisdiction' },
];
export const newJurisdiction = (): Jurisdiction => ({
  id: '', name: '', code: '', flag: '⚑', region: '', currency: '', currencyName: '', status: 'Active',
  dateAdded: new Date().toISOString(), updated: new Date().toISOString(), description: '', website: '', regulator: '', notes: '',
  services: [], entities: ['private-limited', 'public-limited', 'sole'], requirements: [],
});
export function makeJurisdictionService(id: string, name: string, description: string, price: number): JurisdictionService {
  return { id, name, description, enabled: true, entityIds: ['private-limited', 'public-limited', 'sole', 'partnership'], entities: baseEntities.map(entity => ({
    ...entity, selected: ['private-limited', 'public-limited', 'sole', 'partnership'].includes(entity.id),
    fields: defaultFields.map((field: ServiceField) => ({ ...field })), documents: defaultDocuments.map((document: ServiceDocument) => ({ ...document })),
    customPricing: false, fees: defaultFees(price).map((fee: ServiceFee) => ({ ...fee })),
  })) };
}
const seed = (name: string, code: string, flag: string, region: string, currency: string, currencyName: string, status: JurisdictionStatus, dateAdded: string, seedServiceCount: number): Jurisdiction => ({
  ...newJurisdiction(), id: code.toLowerCase(), name, code, flag, region, currency, currencyName, status, dateAdded, updated: '2024-09-12T14:15:00Z', seedServiceCount,
  description: name === 'Nigeria' ? 'Registat offers company incorporation and related compliance services in Nigeria, including CAC registration, tax registration and post-incorporation filings.' : `Registat offers business registration and related services in ${name}.`,
  services: name === 'Nigeria' ? [
    makeJurisdictionService('service-company-registration', 'Company Registration', 'Register companies and other business entities in this country.', 80000),
    makeJurisdictionService('service-trademark', 'Trademark Registration', 'Search and register trademarks in this country.', 75000),
  ] : [],
  companiesRegistered: name === 'Nigeria' ? 248 : 0, totalRevenue: name === 'Nigeria' ? 12480000 : 0, averageProcessingDays: name === 'Nigeria' ? 4.8 : 0,
});
export const initialJurisdictions: Jurisdiction[] = [
  seed('Nigeria', 'NG', '🇳🇬', 'Africa', 'NGN', 'Nigerian Naira', 'Active', '2024-01-12T10:00:00Z', 10),
  seed('United Kingdom', 'GB', '🇬🇧', 'Europe', 'GBP', 'Pound Sterling', 'Active', '2024-03-05T10:00:00Z', 8),
  seed('United States', 'US', '🇺🇸', 'North America', 'USD', 'US Dollar', 'Coming soon', '2024-05-10T10:00:00Z', 6),
  seed('United Arab Emirates', 'AE', '🇦🇪', 'Middle East', 'AED', 'UAE Dirham', 'Active', '2024-06-18T10:00:00Z', 7),
  seed('South Africa', 'ZA', '🇿🇦', 'Africa', 'ZAR', 'South African Rand', 'Active', '2024-07-22T10:00:00Z', 4),
  seed('Kenya', 'KE', '🇰🇪', 'Africa', 'KES', 'Kenyan Shilling', 'Inactive', '2024-08-15T10:00:00Z', 5),
];
export const jurisdictionServiceCount = (item: Jurisdiction) => item.seedServiceCount ?? item.services.filter(service => service.enabled).length;
export const entityName = (id: string) => jurisdictionEntityOptions.find(entity => entity.id === id)?.name ?? id;
export const countryFlag = (code: string) => countryOptions.find(item => item.code === code.toUpperCase())?.flag ?? (code.length === 2 ? String.fromCodePoint(...code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0))) : '⚑');
