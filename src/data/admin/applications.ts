import { initialCompanies } from "./companies";
import { pendingTasks } from "./dashboard";

export const applicationStatuses = ["In Progress", "Under Review", "Awaiting Payment", "Completed", "Rejected"] as const;
export type ApplicationStatus = typeof applicationStatuses[number];
export type Customer = { name: string; email: string; phone: string };
export type ApplicationDocument = { id: string; name: string; description: string; required: boolean; state: "Pending" | "Received" | "Uploaded"; filename?: string; fileKey?: string };
export type AdminApplication = {
  companyId?: string;
  reference: string; customer: Customer; service: string; entityType: string;
  jurisdiction: string; status: ApplicationStatus; submitted: string; updated: string;
  assignedTo: string; priority: string; companyName: string; activity: string;
  address: string; shareholders: string; notes: { id: string; text: string; date: string }[];
  documents: ApplicationDocument[];
};

export const applicationServices = ["Company Registration", "Trademark Registration", "Annual Returns Filing", "Business Licensing", "Business Banking", "Tax Registration"];
export const applicationJurisdictions = ["Nigeria", "United Kingdom", "United States", "Kenya", "Canada", "United Arab Emirates"];
export const jurisdictionFlags: Record<string, string> = { Nigeria: "🇳🇬", "United Kingdom": "🇬🇧", "United States": "🇺🇸", Kenya: "🇰🇪", Canada: "🇨🇦", "United Arab Emirates": "🇦🇪" };
export const entityTypes = ["Private Limited Company", "Public Limited Company", "Business Name", "Individual", "Corporate Entity"];
export const customers: Customer[] = [
  { name: "Tolu Adebayo", email: "tolu@example.com", phone: "+234 803 123 4567" },
  { name: "Chioma Okafor", email: "chioma@example.com", phone: "+234 803 234 5678" },
  { name: "Kola Williams", email: "kola@example.com", phone: "+234 803 345 6789" },
  { name: "Favour Eze", email: "favour@example.com", phone: "+234 803 456 7890" },
  { name: "Daniel Kimani", email: "daniel@sample.com", phone: "+254 712 345678" },
  { name: "Zainab Yusuf", email: "zainab@example.com", phone: "+234 803 567 8901" },
];

export function defaultDocuments(): ApplicationDocument[] {
  return [
    { id: "identification", name: "Director’s identification", description: "Passport, National ID or Driver’s License", required: true, state: "Pending" },
    { id: "address", name: "Proof of address", description: "Utility bill or bank statement", required: true, state: "Pending" },
    { id: "articles", name: "Memorandum & Articles", description: "Company constitution documents", required: true, state: "Pending" },
    { id: "shareholders", name: "Shareholder information", description: "For all shareholders", required: false, state: "Pending" },
  ];
}

export const initialApplications: AdminApplication[] = customers.map((customer, index) => ({
  reference: `REG-2026-${String(124 - index).padStart(5, "0")}`, customer,
  service: ["Company Registration", "Company Registration", "Annual Returns Filing", "Trademark Registration", "Business Licensing", "Company Registration"][index],
  entityType: index === 4 ? "Public Limited Company" : "Private Limited Company",
  jurisdiction: "Nigeria", status: ["Under Review", "Awaiting Payment", "In Progress", "Completed", "In Progress", "In Progress"][index] as ApplicationStatus,
  submitted: `2026-09-${String(12 - index).padStart(2, "0")}T10:24:00Z`, updated: "2026-09-12T14:16:00Z",
  assignedTo: "Admin", priority: "Normal", companyName: `${customer.name.split(" ")[0]} Enterprises Ltd`, activity: "Technology Consulting", address: "Lekki, Lagos, Nigeria", shareholders: "1", notes: [],
  documents: defaultDocuments().map((doc, i) => ({ ...doc, state: i < 2 ? "Received" : "Pending" })),
}));

initialApplications.push(...pendingTasks.map((task) => ({
  ...initialApplications[0], reference: task.reference,
  customer: { name: task.customer, email: `${task.customer.toLowerCase().replaceAll(" ", ".")}@example.com`, phone: "+234 803 123 4567" },
  service: task.service, companyName: task.customer, status: "In Progress" as const, priority: task.priority === "High" ? "High" : "Normal",
})));

export function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(); }
export function displayDate(date: string, time = false) {
  if (!date || !Number.isFinite(Date.parse(date))) return "Not provided";
  return new Intl.DateTimeFormat("en-GB", { ...(time ? { hour: "numeric", minute: "2-digit", hour12: true } : { day: "2-digit", month: "short", year: "numeric" }), timeZone: "Europe/Vilnius" }).format(new Date(date));
}

// Company workspace reference applications use the same store and detail routes.
initialApplications.push(...["Company Registration", "Trademark Registration", "Tax Registration", "Business Banking"].map((service, index) => ({
  ...initialApplications[0], reference: `APP-2024-00${index + 1}`, companyId: initialCompanies[0].id,
  customer: initialCompanies[0].owner, companyName: initialCompanies[0].name,
  service, status: ["Completed", "Under Review", "In Progress", "Awaiting Payment"][index] as ApplicationStatus,
  submitted: `2024-09-${[10, 14, 20, 25][index]}T09:00:00Z`, updated: "2024-09-25T09:00:00Z",
  address: initialCompanies[0].address, activity: initialCompanies[0].activity,
})));
