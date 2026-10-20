// Figma reference data. Replace with API data when admin services are connected.
export const adminNavigation = [
  { label: "COMPANY MANAGEMENT", items: [
    { label: "Dashboard", path: "/admin/dashboard", icon: "home" },
    { label: "Applications", path: "/admin/applications", icon: "inbox", badge: true },
    { label: "Customers", path: "/admin/customers", icon: "users" },
    { label: "Companies", path: "/admin/companies", icon: "building" },
  ] },
  { label: "OPERATIONS", items: [
    { label: "Payments", path: "/admin/payments", icon: "payments" },
    { label: "Services & Pricing", path: "/admin/services", icon: "services" },
    { label: "Jurisdictions", path: "/admin/jurisdictions", icon: "globe" },
    { label: "Compliance", path: "/admin/compliance", icon: "compliance", badge: true },
  ] },
  { label: "ACCOUNT", items: [{ label: "Settings", path: "/admin/settings", icon: "gear" }] },
];

export const summaryCards = [
  { label: "Total Applications", value: 248, status: "all" },
  { label: "New Applications", value: 32, status: "new" },
  { label: "In Progress", value: 86, status: "in-progress" },
  { label: "Action Required", value: 14, status: "action-required" },
  { label: "Completed", value: 116, status: "completed" },
];

export const serviceBreakdown = [
  { label: "Company Registration", percentage: 42, color: "#0b4d3c" },
  { label: "Trademark Registration", percentage: 24, color: "#34d399" },
  { label: "Business Licensing", percentage: 18, color: "#fbbf24" },
  { label: "Business Banking", percentage: 10, color: "#c084fc" },
  { label: "Others", percentage: 6, color: "#cbd5e1" },
];

export const jurisdictions = [
  { label: "Nigeria", count: 98, width: 82, color: "#0b4d3c" },
  { label: "United Kingdom", count: 46, width: 44, color: "#a7f3d0" },
  { label: "United States", count: 38, width: 36, color: "#bbf7d0" },
  { label: "UAE", count: 26, width: 25, color: "#dcfce7" },
  { label: "Kenya", count: 18, width: 17, color: "#e2e8f0" },
  { label: "Others", count: 22, width: 21, color: "#e2e8f0" },
];

export const activities = [
  { title: "Document approved", description: "Certificate of Incorporation • Kemi Creative", time: "2 minutes ago", icon: "documentApproved", color: "#ecfdf5" },
  { title: "Payment received", description: "₦250,000 • Teni Enterprises", time: "28 minutes ago", icon: "paymentReceived", color: "#f0fdfa" },
  { title: "Application submitted", description: "REG-2026-1045 • Bright Trade Ltd", time: "1 hour ago", icon: "applicationSubmitted", color: "#eff6ff" },
  { title: "Information requested", description: "Additional document • Lumo Tech", time: "2 hours ago", icon: "informationRequested", color: "#fff1f2" },
  { title: "Status updated", description: "In Review → Action Required • Zuri Global", time: "3 hours ago", icon: "statusUpdated", color: "#ecfdf5" },
];

export const pendingTasks = [
  { reference: "REG-2026-1042", customer: "Lumo Tech", service: "Company Registration", task: "Review documents", due: "Today", priority: "High" },
  { reference: "REG-2026-1041", customer: "Teni Enterprises", service: "Business Licensing", task: "Payment pending", due: "Today", priority: "High" },
  { reference: "REG-2026-1038", customer: "Bright Trade Ltd", service: "Trademark Registration", task: "Requires review", due: "11 Sep 2026", priority: "Pending" },
  { reference: "REG-2026-1035", customer: "Kemi Creative", service: "Business Banking", task: "Customer response", due: "12 Sep 2026", priority: "Pending" },
  { reference: "REG-2026-1031", customer: "Zuri Global", service: "Company Registration", task: "Missing document", due: "12 Sep 2026", priority: "Low" },
];
