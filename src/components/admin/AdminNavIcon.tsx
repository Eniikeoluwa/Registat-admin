import type { ReactNode } from "react";

const icons: Record<string, ReactNode> = {
  alert: <><path d="m10 3-9 16a2 2 0 0 0 2 3h18a2 2 0 0 0 2-3L14 3a2 2 0 0 0-4 0Z" /><path d="M12 9v5M12 18h.01" /></>,
  folder: <path d="M3 7V4a2 2 0 0 1 2-2h5l3 3h6a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5M3 15v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></>,
  download: <><path d="M12 3v13m-5-5 5 5 5-5M3 16v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  email: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 5 10 8L22 5" /></>,
  phone: <path d="M7 3H3v4c0 8 6 14 14 14h4v-4l-5-2-2 2a15 15 0 0 1-7-7l2-2Z" />,
  location: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  photo: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1" /><path d="m3 17 6-6 4 4 3-3 5 5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 6 6" /></>,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  copy: <><rect x="8" y="7" width="12" height="15" rx="2" /><path d="M16 7V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /></>,
  document: <><rect x="5" y="2" width="14" height="20" rx="3" /><path d="M9 7h6M9 11h6M9 15h4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="17" rx="3" /><path d="M7 2v6M17 2v6M3 11h18M7 15h.01M12 15h.01M17 15h.01" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l-4 2" /></>,
  user: <><circle cx="12" cy="6" r="4" /><path d="M3 22v-3a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v3" /></>,
  note: <><path d="M21 12a8 8 0 0 1-8 8H8l-5 3v-8a9 9 0 1 1 18-3Z" /><path d="M7 9h10M7 13h7" /></>,
  refresh: <><path d="M21 4v6h-6M3 20v-6h6" /><path d="M5 7a8 8 0 0 1 13-2l3 5M3 14l3 5a8 8 0 0 0 13-2" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M11 13 22 2" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 11v6M12 7h.01" /></>,
  edit: <><path d="m4 16-1 5 5-1L21 7l-4-4Z" /><path d="m14 6 4 4" /></>,
  key: <><circle cx="16" cy="7" r="5" /><path d="m12 11-9 9v2h3v-3h3v-3h3l3-3" /></>,
  home: <><path d="m3 10 7-6a3 3 0 0 1 4 0l7 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 16h6" /></>,
  inbox: <><path d="M12 4H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-6" /><path d="M3 13h5l2 3h4l2-3h5" /><circle cx="18" cy="5" r="4" /></>,
  users: <><circle cx="9" cy="7" r="3" /><circle cx="18" cy="9" r="2.5" /><path d="M2 21v-3a6 6 0 0 1 12 0v3ZM16 14a4.5 4.5 0 0 1 6 4.2V21h-5" /></>,
  building: <><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M3 22h18M10 22v-5h4v5M10 6h4M10 10h4M10 14h4" /></>,
  payments: <><rect x="2" y="5" width="20" height="15" rx="4" /><path d="M2 10h20M6 15h3M12 15h1" /></>,
  services: <><path d="m12 2-9 5v10l7 4M3 7l9 5 9-5-9-5ZM12 12v4M7.5 4.5l9 5M7 12v3" /><path d="m17.5 13 4.5 2.5v5L17.5 23 13 20.5v-5ZM13 15.5l4.5 2.5 4.5-2.5M17.5 18v5" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="4" ry="10" /><path d="M3 8h18M2 12h20M3 16h18" /></>,
  compliance: <><path d="M12 3H6a3 3 0 0 0-3 3v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M7 12h3M7 16h9" /><circle cx="18" cy="6" r="5" /><path d="m15.5 6 1.7 1.7L20.5 4" /></>,
  gear: <><path d="m9.5 3-.7 2.2-2 .9-2.2-.5L2.5 9l1.5 1.7v2.6L2.5 15l2.1 3.4 2.2-.5 2 .9.7 2.2h5l.7-2.2 2-.9 2.2.5 2.1-3.4-1.5-1.7v-2.6L21.5 9l-2.1-3.4-2.2.5-2-.9-.7-2.2Z" /><circle cx="12" cy="12" r="3.5" /></>,
};

export default function AdminNavIcon({ name }: { name: string }) {
  return <svg className="admin-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icons[name]}</svg>;
}
