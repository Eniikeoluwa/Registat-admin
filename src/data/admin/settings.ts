export type AdminRole = 'Super Admin' | 'Operations Admin' | 'Support Admin';
export type AdminStatus = 'Active' | 'Invited' | 'Inactive';
export type AdminMember = { id: string; name: string; email: string; role: AdminRole; status: AdminStatus; lastActive: string };
export type AuditEntry = { id: string; admin: string; action: string; target: string; detail: string; module: string; at: string; ip: string; device: string; location: string; tone: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'gray'; extra?: Record<string, string> };
export type AdminSettings = {
  profile: { name: string; email: string; phone: string };
  preferences: { language: string; dateFormat: string; timezone: string };
  notifications: { email: boolean; applications: boolean; compliance: boolean };
  security: { twoFactorEnabled: boolean; sessions: { id: string; device: string; location: string; lastActive: string; current: boolean }[] };
  admins: AdminMember[];
  audit: AuditEntry[];
};

const members: AdminMember[] = [
  { id: 'john', name: 'John Adeyemi', email: 'john@registat.co', role: 'Super Admin', status: 'Active', lastActive: 'Today, 10:24 AM' },
  { id: 'sarah', name: 'Sarah Bello', email: 'sarah@registat.co', role: 'Operations Admin', status: 'Active', lastActive: 'Today, 9:12 AM' },
  { id: 'michael', name: 'Michael Kola', email: 'michael@registat.co', role: 'Support Admin', status: 'Active', lastActive: '12 Sep 2024' },
  { id: 'fatima', name: 'Fatima Yusuf', email: 'fatima@registat.co', role: 'Operations Admin', status: 'Active', lastActive: '10 Sep 2024' },
  { id: 'emeka', name: 'Emeka Okafor', email: 'emeka@registat.co', role: 'Support Admin', status: 'Invited', lastActive: 'Invited 2 days ago' },
  { id: 'tunde', name: 'Tunde Salami', email: 'tunde@registat.co', role: 'Support Admin', status: 'Inactive', lastActive: '05 Sep 2024' },
];
const activity: Omit<AuditEntry, 'id'>[] = [
  { admin: 'John Adeyemi', action: 'Approved application', target: 'Zuri Technologies Ltd', detail: 'RC 2093347', module: 'Applications', at: '2024-09-12T14:15:00', ip: '192.168.1.24', device: 'Windows • Chrome', location: 'Lagos, Nigeria', tone: 'green', extra: { 'Application type': 'Annual Returns', Jurisdiction: 'Nigeria', 'Filing authority': 'Corporate Affairs Commission (CAC)', 'Due date': '12 Sep 2024', Status: 'Approved' } },
  { admin: 'Sarah Bello', action: 'Updated pricing', target: 'Nigeria', detail: 'Company registration', module: 'Services & Pricing', at: '2024-09-12T11:02:00', ip: '192.168.1.25', device: 'Windows • Chrome', location: 'Lagos, Nigeria', tone: 'blue' },
  { admin: 'Michael Kola', action: 'Enabled jurisdiction', target: 'Kenya', detail: 'Company registration', module: 'Jurisdictions', at: '2024-09-10T16:30:00', ip: '192.168.1.26', device: 'Mac • Chrome', location: 'Lagos, Nigeria', tone: 'green' },
  { admin: 'Fatima Yusuf', action: 'Invited new admin', target: 'Emeka Okafor', detail: 'Support Admin', module: 'Admin management', at: '2024-09-09T10:24:00', ip: '192.168.1.27', device: 'Windows • Chrome', location: 'Lagos, Nigeria', tone: 'purple' },
  { admin: 'John Adeyemi', action: 'Marked filing as complete', target: 'Maple Consulting', detail: 'Annual Returns', module: 'Compliance', at: '2024-09-08T15:10:00', ip: '192.168.1.24', device: 'Windows • Chrome', location: 'Lagos, Nigeria', tone: 'orange' },
  { admin: 'Tunde Salami', action: 'Deactivated admin', target: 'Chiamaka Nwosu', detail: 'Support Admin', module: 'Admin management', at: '2024-09-05T13:22:00', ip: '192.168.1.28', device: 'iPhone • Safari', location: 'Lagos, Nigeria', tone: 'red' },
  { admin: 'Sarah Bello', action: 'Updated service settings', target: 'Trademark Registration', detail: 'Service', module: 'Services & Pricing', at: '2024-09-03T09:41:00', ip: '192.168.1.25', device: 'Windows • Chrome', location: 'Lagos, Nigeria', tone: 'gray' },
  { admin: 'Michael Kola', action: 'Uploaded document', target: 'GreenField Farms Ltd', detail: 'Tax Registration', module: 'Companies', at: '2024-09-01T17:18:00', ip: '192.168.1.26', device: 'Mac • Chrome', location: 'Lagos, Nigeria', tone: 'blue' },
];
export const initialSettings: AdminSettings = {
  profile: { name: 'John Adeyemi', email: 'john@registat.co', phone: '+234 801 234 5678' },
  preferences: { language: 'English', dateFormat: 'DD MMM YYYY', timezone: '(GMT+1) Lagos, Nigeria' },
  notifications: { email: true, applications: true, compliance: false },
  security: { twoFactorEnabled: true, sessions: [
    { id: 'current', device: 'Windows • Chrome', location: 'Lagos, Nigeria', lastActive: '12 Sep 2024, 2:15 PM', current: true },
    { id: 'iphone', device: 'iPhone • Safari', location: 'Lagos, Nigeria', lastActive: '10 Sep 2024, 10:24 AM', current: false },
    { id: 'mac', device: 'Mac • Chrome', location: 'Lagos, Nigeria', lastActive: '08 Sep 2024, 6:30 PM', current: false },
  ] },
  admins: members,
  audit: Array.from({ length: 24 }, (_, index) => ({ ...activity[index % activity.length], id: `audit-${index + 1}`, at: index < activity.length ? activity[index].at : `2024-08-${String(31 - (index - activity.length)).padStart(2, '0')}T10:24:00` })),
};
export function auditDate(at: string) {
  const date = new Date(at);
  return `${date.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]} ${date.getFullYear()}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}
