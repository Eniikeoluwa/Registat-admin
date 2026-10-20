import { customers, type Customer } from './applications';
export type CustomerStatus = 'Active' | 'Inactive' | 'Blocked';
export type AdminCustomer = Customer & {
  id: string; type: 'Individual' | 'Business'; status: CustomerStatus; address: string;
  jurisdiction: string; joined: string; identityType: string; identityNumber: string; photo?: string;
  notes: { id: string; text: string; date: string }[];
  events: { id: string; text: string; date: string }[];
};
export function customerRecord(customer: Customer, id: string, date: string): AdminCustomer {
  return { ...customer, id, type: 'Individual', status: 'Active', address: '', jurisdiction: 'Nigeria', joined: date, identityType: '', identityNumber: '', notes: [], events: [] };
}
export const initialCustomers: AdminCustomer[] = [
  ...customers,
  { name: 'Emeka Nwosu', email: 'emeka@example.com', phone: '+234 803 222 3344' },
  { name: 'Aisha Bello', email: 'aisha@example.com', phone: '+234 818 999 1122' },
  { name: 'John Doe', email: 'john@example.com', phone: '+234 802 333 4455' },
  { name: 'Fatima Ahmed', email: 'fatima@example.com', phone: '+234 708 111 2233' },
].map((person, index) => ({ ...customerRecord(person, `customer-${index + 1}`, `2026-09-${String(12 - index).padStart(2, '0')}T09:00:00Z`), type: index === 4 || index === 6 ? 'Business' : 'Individual', status: index === 3 ? 'Inactive' : index === 7 ? 'Blocked' : 'Active', address: index === 0 ? 'Lekki, Lagos, Nigeria' : '', jurisdiction: index === 4 ? 'Kenya' : 'Nigeria' }));
