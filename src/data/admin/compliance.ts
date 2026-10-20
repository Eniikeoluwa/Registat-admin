export type FilingStatus = 'Overdue' | 'Action Required' | 'Upcoming' | 'Compliant' | 'Archived';
export type FilingDocument = { id: string; name: string; uploaded: boolean; fileName?: string; fileData?: string };
export type FilingEvent = { label: string; date: string; tone: 'green' | 'blue' | 'red' };
export type Filing = { id: string; company: string; rc: string; type: string; jurisdiction: string; flag: string; due: string; status: FilingStatus; assignee: string; regulator: string; frequency: string; entityType: string; daysOverdue?: number; documents: FilingDocument[]; notes: string[]; timeline: FilingEvent[]; completedOn?: string; confirmation?: FilingDocument };

const companies = [
  ['Zuri Technologies Ltd', '2093347', 'Nigeria', '🇳🇬'],
  ['Maple Consulting', '1321098', 'United Kingdom', '🇬🇧'],
  ['Nova Retail Ltd', '1432109', 'Kenya', '🇰🇪'],
  ['GreenField Farms Ltd', '1987654', 'Nigeria', '🇳🇬'],
  ['Luxe & Co.', '1876543', 'United Kingdom', '🇬🇧'],
  ['BrightPath Education Ltd', '2011122', 'South Africa', '🇿🇦'],
  ['Koya Media Limited', '1654321', 'Nigeria', '🇳🇬'],
  ['Silva Properties', '1321098', 'BVI', '🇻🇬'],
  ['Trek Global Ltd', '1765432', 'Nigeria', '🇳🇬'],
  ['Sunrise Ventures', '1433221', 'Kenya', '🇰🇪'],
] as const;
const types = ['Annual Returns', 'VAT Return', 'Beneficial Ownership', 'Tax Registration', 'Confirmation Statement', 'Economic Substance'];
const dates = ['2024-09-12', '2024-09-14', '2024-09-16', '2024-09-20', '2024-09-22', '2024-10-05', '2024-10-10', '2024-10-12', '2024-10-01', '2024-10-03'];
const statuses: FilingStatus[] = ['Overdue', 'Action Required', 'Upcoming', 'Upcoming', 'Action Required', 'Compliant', 'Upcoming', 'Compliant', 'Overdue', 'Overdue'];
const overdueDays = [3, 1, 2, 3, 4, 6, 9, 12, 15, 17];
export const filingStatusCounts: Record<FilingStatus, number> = { Overdue: 18, 'Action Required': 27, Upcoming: 36, Compliant: 186, Archived: 21 };
export const filingStatuses: FilingStatus[] = ['Overdue', 'Action Required', 'Upcoming', 'Compliant', 'Archived'];
export const dateLabel = (date: string) => {
  const [year, month, day] = date.slice(0, 10).split('-');
  return `${Number(day)} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(month) - 1]} ${year}`;
};
export function defaultFiling(index: number, status: FilingStatus): Filing {
  const company = companies[index % companies.length];
  const type = types[index % types.length];
  const regulator = company[2] === 'Nigeria' ? 'Corporate Affairs Commission (CAC)' : company[2] === 'United Kingdom' ? 'Companies House' : 'Company Registry';
  return {
    id: `filing-${String(index + 1).padStart(4, '0')}`, company: company[0], rc: company[1], jurisdiction: company[2], flag: company[3],
    type, due: dates[index % dates.length], status, assignee: 'Admin (you)', regulator, frequency: 'Annually', entityType: 'Private Limited Company',
    daysOverdue: status === 'Overdue' ? overdueDays[index % overdueDays.length] : undefined,
    documents: type === 'Annual Returns' ? [
      { id: 'return-form', name: 'CAC Annual Return Form', uploaded: true, fileName: 'annual-return-form.pdf' },
      { id: 'directors', name: 'List of Directors', uploaded: true, fileName: 'directors.pdf' },
      { id: 'share-capital', name: 'Statement of Share Capital', uploaded: false },
    ] : [{ id: 'confirmation', name: `${type} confirmation`, uploaded: false }],
    notes: ['Please review the filing details and supporting documents.'],
    timeline: [{ label: 'Filing created', date: '2024-08-12', tone: 'green' }, { label: 'Reminder sent', date: '2024-09-05', tone: 'blue' }, ...(status === 'Overdue' ? [{ label: 'Marked overdue', date: dates[index % dates.length], tone: 'red' as const }] : [])],
  };
}
export const initialFilings: Filing[] = (() => {
  const curated = statuses.map((status, index) => defaultFiling(index, status));
  curated[0].type = 'Annual Returns';
  curated[1].type = 'VAT Return';
  curated[2].type = 'Beneficial Ownership';
  curated[3].type = 'Tax Registration';
  curated[4].type = 'Confirmation Statement';
  curated[5].type = 'Annual Returns';
  curated[6].type = 'Tax Registration';
  curated[7].type = 'Economic Substance';
  const target = { ...filingStatusCounts };
  for (const item of curated) target[item.status] -= 1;
  let index = curated.length;
  for (const status of filingStatuses) for (let count = 0; count < target[status]; count += 1) curated.push(defaultFiling(index++, status));
  return curated;
})();
