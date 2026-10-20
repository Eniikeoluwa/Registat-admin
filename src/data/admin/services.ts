export type ServiceStatus = 'Active' | 'Inactive';
export type ServiceCategory = 'Business Formation' | 'Intellectual Property' | 'Compliance' | 'Tax Services' | 'Corporate Changes' | 'Document Services';
export type ServiceField = { id: string; label: string; description: string; enabled: boolean; required: boolean };
export type ServiceDocument = ServiceField & { fileType: 'PDF' | 'Image' | 'Any' };
export type ServiceFee = { id: string; type: 'Government fee' | 'Service fee' | 'Other fee'; title: string; amount: number; description: string; timing: 'first' | 'included' | 'later'; required: boolean };
export type ServiceAddon = { id: string; serviceId?: string; title: string; description: string; price: number; customPrice?: number; enabled: boolean; entityIds: string[] };
export type ServiceEntity = { id: string; name: string; description: string; selected: boolean; fields: ServiceField[]; documents: ServiceDocument[]; customPricing: boolean; fees: ServiceFee[] };
export type AdminService = { id: string; name: string; shortDescription: string; description: string; category: ServiceCategory; serviceType: 'One-time service' | 'Recurring service'; processingTime: string; jurisdiction: string; additionalJurisdictions: string[]; status: ServiceStatus; created: string; updated: string; features: string[]; entities: ServiceEntity[]; addons: ServiceAddon[] };

export const serviceCategories: ServiceCategory[] = ['Business Formation', 'Intellectual Property', 'Compliance', 'Tax Services', 'Corporate Changes', 'Document Services'];
export const baseEntities = [
  { id: 'private-limited', name: 'Private Limited Company', description: 'Ltd or limited by shares' },
  { id: 'public-limited', name: 'Public Limited Company', description: 'Public company limited by shares' },
  { id: 'unlimited', name: 'Unlimited Company', description: 'Unlimited liability' },
  { id: 'guarantee', name: 'Company Limited by Guarantee', description: 'Not for profit / NGOs' },
  { id: 'nonprofit', name: 'Non-Profit Company', description: 'Limited by guarantee' },
  { id: 'foreign', name: 'Foreign Company Registration', description: 'Branch or representative office' },
  { id: 'sole', name: 'Sole Proprietorship', description: 'Single owner business' },
  { id: 'partnership', name: 'Partnership', description: 'Two or more partners' },
];
export const defaultFields: ServiceField[] = [
  ['proposed', 'Proposed company name', 'First choice of company name'],
  ['alternative', 'Alternative company name', 'Second choice (optional)'],
  ['activity', 'Business activity', 'Brief description of business'],
  ['capital', 'Authorised share capital', 'Total share capital amount'],
  ['address', 'Registered office address', "Company’s official address"],
  ['directors', 'Directors information', 'Details of company directors'],
  ['shareholders', 'Shareholders information', 'Details of shareholders'],
].map(([id, label, description]) => ({ id, label, description, enabled: true, required: id !== 'alternative' }));
export const defaultDocuments: ServiceDocument[] = [
  ['identity', 'Valid ID (Passport or National ID)', 'For identity verification'],
  ['photo', 'Passport photograph', 'Recent passport'],
  ['address', 'Proof of address', 'Utility bill or bank statement'],
  ['articles', 'Memorandum & Articles of Association', 'Company constitution'],
  ['shareholders', 'Shareholder details', 'List of shareholders'],
  ['resolution', 'Board resolution', 'Authorisation document'],
].map(([id, label, description]) => ({ id, label, description, enabled: true, required: ['identity', 'address', 'articles'].includes(id), fileType: 'Any' as const }));
export const defaultFees = (amount: number): ServiceFee[] => [
  { id: 'government', type: 'Government fee', title: 'Government filing fee', amount: Math.round(amount * .25), description: '', timing: 'included', required: true },
  { id: 'service', type: 'Service fee', title: 'Registat service fee', amount: amount - Math.round(amount * .25), description: '', timing: 'included', required: true },
];
export const newEntities = (): ServiceEntity[] => baseEntities.map(entity => ({ ...entity, selected: ['private-limited', 'public-limited', 'sole', 'partnership'].includes(entity.id), fields: defaultFields.map(field => ({ ...field })), documents: defaultDocuments.map(document => ({ ...document })), customPricing: false, fees: defaultFees(0) }));
const seed = (id: string, name: string, shortDescription: string, category: ServiceCategory, amount: number, status: ServiceStatus, date: string, jurisdictions: string[] = []) : AdminService => ({ id, name, shortDescription, description: shortDescription, category, serviceType: 'One-time service', processingTime: '5–10 business days', jurisdiction: 'Nigeria', additionalJurisdictions: jurisdictions, status, created: `${date}T10:24:00Z`, updated: `${date}T14:15:00Z`, features: [], entities: newEntities().map(entity => ({ ...entity, fees: defaultFees(amount) })), addons: [] });
export const initialServices: AdminService[] = [
  seed('service-company-registration', 'Company Registration', 'Incorporate a private limited company', 'Business Formation', 80000, 'Active', '2024-09-12', ['United Kingdom', 'United States']),
  seed('service-trademark', 'Trademark Registration', 'Register a trademark for your brand', 'Intellectual Property', 75000, 'Active', '2024-09-10', ['United Kingdom', 'Ghana']),
  seed('service-business-name', 'Business Name Registration', 'Reserve and register a business name', 'Business Formation', 10000, 'Active', '2024-09-05', ['United Kingdom']),
  seed('service-annual-returns', 'Annual Returns Filing', 'File annual returns with CAC', 'Compliance', 50000, 'Active', '2024-09-01'),
  seed('service-tax', 'Tax Registration', 'Register for TIN and tax services', 'Tax Services', 25000, 'Active', '2024-08-30', ['United Kingdom']),
  seed('service-directors', 'Change of Directors', 'Update director information', 'Corporate Changes', 45000, 'Active', '2024-08-28'),
  seed('service-capital', 'Share Capital Increase', 'Increase authorised share capital', 'Corporate Changes', 60000, 'Active', '2024-08-20'),
  seed('service-dissolution', 'Dissolution / Strike Off', 'Dissolve a company', 'Corporate Changes', 120000, 'Inactive', '2024-08-15'),
  seed('service-cac-search', 'CAC Document Search', 'Search and obtain CAC documents', 'Document Services', 5000, 'Active', '2024-08-10'),
  seed('service-certified-copy', 'Certified True Copy', 'Get certified true copies from CAC', 'Document Services', 10000, 'Active', '2024-08-05'),
  seed('service-compliance-package', 'Post-incorporation Compliance Package', 'Annual returns, tax filing and more', 'Compliance', 35000, 'Active', '2024-07-28'),
  seed('service-business-banking', 'Business Banking', 'Open a business banking account', 'Business Formation', 20000, 'Inactive', '2024-07-20'),
];
initialServices[0].description = 'Full company incorporation service including name reservation, document preparation and filing with CAC.';
initialServices[0].features = ['Name availability search', 'Preparation of incorporation documents', 'Filing with CAC', 'Certificate of Incorporation (digital copy)', 'Post-incorporation guidance'];
export const servicePrice = (service: AdminService, entityId?: string) => (service.entities.find(entity => entity.id === entityId) ?? service.entities.find(entity => entity.selected))?.fees.filter(fee => fee.timing !== 'later').reduce((sum, fee) => sum + fee.amount, 0) ?? 0;
export function validateService(service: AdminService) {
  if (!service.name.trim()) throw new Error('Enter a service name.');
  if (!service.description.trim()) throw new Error('Enter a description.');
  if (!service.entities.some(entity => entity.selected)) throw new Error('Select at least one entity type.');
  for (const entity of service.entities.filter(item => item.selected)) {
    if (entity.fields.some(field => field.required && !field.enabled) || entity.documents.some(document => document.required && !document.enabled)) throw new Error('Required fields and documents must be enabled.');
    if (entity.fees.some(fee => !fee.title.trim() || !Number.isFinite(fee.amount) || fee.amount < 0)) throw new Error(`Check the fees for ${entity.name}.`);
  }
  if (service.addons.some(addon => !addon.title.trim() || !Number.isFinite(addon.price) || addon.price < 0 || (addon.customPrice !== undefined && (!Number.isFinite(addon.customPrice) || addon.customPrice < 0)))) throw new Error('Check the add-on prices.');
}
