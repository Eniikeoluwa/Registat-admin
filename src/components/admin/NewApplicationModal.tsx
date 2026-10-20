"use client";

import { lockAdminDialogScroll } from "./dialogScrollLock";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { applicationJurisdictions, applicationServices, customers, defaultDocuments, entityTypes, initials, jurisdictionFlags, type AdminApplication, type Customer } from "@/data/admin/applications";
import { copyText, Field, SmallIcon, StatusBadge } from "./ApplicationUI";
import { nextApplicationReference, saveApplication, saveDocumentFiles, useApplications } from "./applicationStore";

import { useCustomers } from "./customerStore";
import { useCompanies } from "./companyStore";

const steps = [
  { title: "Customer", description: "Select or create customer" },
  { title: "Service", description: "Choose service and entity type" },
  { title: "Application details", description: "Enter company information" },
  { title: "Documents", description: "Upload application documents" },
  { title: "Review", description: "Confirm and create" },
];

export default function NewApplicationModal({ onClose, onView }: { onClose: () => void; onView: (reference: string) => void }) {
  const applications = useApplications();
  const directory = useCustomers();
  const params = useSearchParams();
  const linkedCompany = useCompanies().find(company => company.id === params.get("company"));
  const customerEmail = linkedCompany?.owner.email ?? params.get("customer");
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(1);
  const [customerMode, setCustomerMode] = useState("existing");
  const [query, setQuery] = useState("");
  const [customerSelection, setSelectedCustomer] = useState<Customer | null | undefined>(undefined);
  const selectedCustomer = customerSelection === undefined ? directory.find(person => person.email === customerEmail) ?? customers[0] : customerSelection;
  const [newCustomer, setNewCustomer] = useState<Customer>({ name: "", email: "", phone: "" });
  const [service, setService] = useState("Company Registration");
  const [entitySelection, setEntityType] = useState<string>();
  const entityType = entitySelection ?? linkedCompany?.entityType ?? "Private Limited Company";
  const [jurisdictionSelection, setJurisdiction] = useState<string>();
  const jurisdiction = jurisdictionSelection ?? linkedCompany?.jurisdiction ?? "Nigeria";
  const [assignedTo, setAssignedTo] = useState("Admin");
  const [priority, setPriority] = useState("Normal");
  const [serviceNotes, setServiceNotes] = useState("");
  const [nameSelection, setCompanyName] = useState<string>();
  const companyName = nameSelection ?? linkedCompany?.name ?? "";
  const [activitySelection, setActivity] = useState<string>();
  const activity = activitySelection ?? linkedCompany?.activity ?? "";
  const [addressSelection, setAddress] = useState<string>();
  const address = addressSelection ?? linkedCompany?.address ?? "";
  const [shareholders, setShareholders] = useState("1");
  const [detailsNotes, setDetailsNotes] = useState("");
  const [documents, setDocuments] = useState(defaultDocuments);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<AdminApplication | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const customer = customerMode === "new" ? newCustomer : selectedCustomer;
  const knownCustomers = [...new Map([...customers, ...applications.map((item) => item.customer), ...directory.map(({ name, email, phone }) => ({ name, email, phone }))].map((person) => [person.email, person])).values()];
  const matches = knownCustomers.filter((person) => Object.values(person).join(" ").toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const element = dialog.current;
    const releaseScroll = lockAdminDialogScroll();
    element?.showModal();
    return () => { element?.close(); releaseScroll(); };
  }, []);

  useEffect(() => { heading.current?.focus(); }, [step, created]);

  function goToStep(next: number) { setError(""); setStep(next); }

  function chooseFile(id: string, file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !/\.(pdf|png|jpe?g)$/i.test(file.name)) {
      setError("Select a PDF, PNG, or JPG file up to 5 MB."); return;
    }
    setError(""); setFiles((current) => ({ ...current, [id]: file }));
    setDocuments((current) => current.map((doc) => doc.id === id ? { ...doc, state: "Uploaded", filename: file.name } : doc));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (step === 1 && !customer?.name.trim()) { setError("Select an existing customer or create a new customer."); return; }
    if (step === 3 && (!companyName.trim() || !address.trim())) { setError("Enter a company name and registered address."); return; }
    if (step === 4 && documents.some((doc) => doc.required && !files[doc.id])) { setError("Upload the required documents before continuing."); return; }
    if (step < 5) { goToStep(step + 1); return; }
    if (saving || !customer) return;
    setSaving(true);
    try {
      const reference = nextApplicationReference();
      const now = new Date().toISOString();
      const application: AdminApplication = {
        reference, ...(linkedCompany ? { companyId: linkedCompany.id } : {}), customer: { name: customer.name.trim(), email: customer.email.trim(), phone: customer.phone.trim() },
        service, entityType, jurisdiction, assignedTo, priority, companyName: companyName.trim(), activity, address: address.trim(), shareholders,
        status: "In Progress", submitted: now, updated: now,
        notes: [serviceNotes.trim(), detailsNotes.trim()].filter(Boolean).map((text) => ({ id: crypto.randomUUID(), text, date: now })),
        documents: documents.map((doc) => ({ ...doc, ...(files[doc.id] ? { fileKey: `${reference}:${doc.id}` } : {}) })),
      };
      await saveDocumentFiles(Object.entries(files).map(([id, file]) => ({ key: `${reference}:${id}`, file })));
      saveApplication(application); setCreated(application);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create this application. Please try again."); }
    finally { setSaving(false); }
  }

  function reviewBlock(title: string, targetStep: number, content: React.ReactNode) {
    return <section className="application-review-card"><header><h4>{title}</h4><button type="button" onClick={() => goToStep(targetStep)}><SmallIcon name="edit" />Edit</button></header>{content}</section>;
  }

  return <dialog ref={dialog} className={`new-application-dialog ${created ? "is-success" : ""}`} aria-labelledby="new-application-title" onCancel={(event) => { if (saving) event.preventDefault(); else onClose(); }}>
    {created ? <div className="application-created"><button className="application-icon-button application-success-close" aria-label="Close creation confirmation" onClick={onClose}><SmallIcon name="close" /></button><div className="application-success-icon"><SmallIcon name="check" /></div><h2 ref={heading} tabIndex={-1} id="new-application-title">Application created<br />successfully!</h2><p>The application has been created and a<br className="application-desktop-break" /> reference number has been generated.</p><div className="application-reference-box"><span>Reference number</span><div><strong>{created.reference}</strong><button className="application-icon-button" aria-label="Copy new application reference" onClick={() => void copyText(created.reference).then(() => setCopyMessage("Reference copied.")).catch((cause: Error) => setCopyMessage(cause.message))}><SmallIcon name="copy" /></button></div></div><p role="status" className="application-copy-message">{copyMessage}</p><footer><button className="application-button primary" onClick={() => onView(created.reference)}>View application</button><button className="application-button soft" onClick={() => { setCreated(null); setStep(1); setCustomerMode("existing"); setSelectedCustomer(undefined); setNewCustomer({ name: "", email: "", phone: "" }); setQuery(""); setService("Company Registration"); setEntityType(undefined); setJurisdiction(undefined); setAssignedTo("Admin"); setPriority("Normal"); setCompanyName(undefined); setActivity(undefined); setAddress(undefined); setShareholders("1"); setServiceNotes(""); setDetailsNotes(""); setDocuments(defaultDocuments()); setFiles({}); setAvailability(""); setCopyMessage(""); }}>New application</button></footer></div> : <>
      <header className="new-application-header"><div><h2 id="new-application-title">New application</h2><p>Create a new registration or compliance application for a customer.</p></div><button className="application-icon-button" aria-label="Close new application" onClick={onClose} disabled={saving}><SmallIcon name="close" /></button></header>
      <div className="new-application-body">
        <nav className="application-stepper" aria-label="New application steps"><ol>{steps.map((item, index) => <li key={item.title} className={index + 1 < step ? "done" : index + 1 === step ? "current" : ""}><button type="button" disabled={index + 1 > step || saving} aria-current={index + 1 === step ? "step" : undefined} onClick={() => goToStep(index + 1)}><span>{index + 1 < step ? <SmallIcon name="check" /> : index + 1}</span><div><strong>{item.title}</strong><p>{item.description}</p></div></button></li>)}</ol></nav>
        <form id="new-application-step" className="new-application-form" onSubmit={(event) => void submit(event)}>
          <div className="application-form-heading"><h3 ref={heading} tabIndex={-1}>{["Customer details", "Service details", "Application details", "Documents", "Review application"][step - 1]}</h3><p>{["Search for an existing customer or create a new one.", "Select the service and entity type for this application.", "Enter the company information for this application.", "Upload the required documents for this application.", "Confirm the details before creating this application."][step - 1]}</p></div>
          {error && <p className="application-form-error" role="alert">{error}</p>}
          {step === 1 && <>
            <div className="application-customer-mode"><button type="button" aria-pressed={customerMode === "existing"} onClick={() => setCustomerMode("existing")}><SmallIcon name="search" />Search existing customer</button><button type="button" disabled={!!linkedCompany} aria-pressed={customerMode === "new"} onClick={() => setCustomerMode("new")}><SmallIcon name="user" />Create new customer</button></div>
            {customerMode === "existing" ? <><div className="application-search-input"><SmallIcon name="search" /><input disabled={!!linkedCompany} aria-label="Search existing customers" placeholder="Search by name, email, phone number or ID…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>{selectedCustomer && !query && <div className="application-selected-customer"><span className="application-initials blue">{initials(selectedCustomer.name)}</span><div><strong>{selectedCustomer.name}</strong><p>{selectedCustomer.email} • {selectedCustomer.phone}</p></div><span className="application-active-label">● Active</span><button type="button" className="application-icon-button" disabled={!!linkedCompany} aria-label="Remove selected customer" onClick={() => setSelectedCustomer(null)}><SmallIcon name="close" /></button></div>}{(query || !selectedCustomer) && <div className="application-customer-results">{matches.map((person) => <button type="button" key={person.email} onClick={() => { setSelectedCustomer(person); setQuery(""); }}><span className="application-initials blue">{initials(person.name)}</span><span><strong>{person.name}</strong><small>{person.email} · {person.phone}</small></span></button>)}{matches.length === 0 && <p>No matching customers. Choose “Create new customer” to add one.</p>}</div>}</> : <div className="application-form-fields"><Field label="Full name" required><input autoComplete="name" value={newCustomer.name} onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })} required /></Field><Field label="Email address" required><input type="email" autoComplete="email" value={newCustomer.email} onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })} required /></Field><Field label="Phone number" required><input type="tel" autoComplete="tel" value={newCustomer.phone} onChange={(event) => setNewCustomer({ ...newCustomer, phone: event.target.value })} required /></Field></div>}
          </>}
          {step === 2 && <div className="application-form-fields"><div className="application-two-fields"><Field label="Service" required><select value={service} onChange={(event) => setService(event.target.value)} required>{applicationServices.map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="Entity type" required><select value={entityType} onChange={(event) => setEntityType(event.target.value)} required>{entityTypes.map((name) => <option key={name}>{name}</option>)}</select></Field></div><Field label="Jurisdiction" required><select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}>{applicationJurisdictions.map((name) => <option key={name} value={name}>{jurisdictionFlags[name]} {name}</option>)}</select></Field><Field label="Assign to (optional)"><select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="Admin">Admin (You)</option><option>John Adeyemi</option><option>Unassigned</option></select></Field><fieldset className="application-priority-options"><legend>Priority <span>(optional)</span></legend>{["Low", "Normal", "High"].map((level) => <label key={level} className={priority === level ? "selected" : ""}><input type="radio" name="priority" value={level} checked={priority === level} onChange={() => setPriority(level)} /><i className={level.toLowerCase()} />{level}</label>)}</fieldset><Field label="Internal notes (optional)"><textarea placeholder="Add any internal notes about this application…" maxLength={500} value={serviceNotes} onChange={(event) => setServiceNotes(event.target.value)} /><small className="application-character-count">{serviceNotes.length}/500</small></Field></div>}
          {step === 3 && <div className="application-form-fields"><Field label="Proposed company name" required><div className="application-name-check"><input readOnly={!!linkedCompany} placeholder="e.g. Zylo Technologies Ltd" value={companyName} onChange={(event) => { setCompanyName(event.target.value); setAvailability(""); }} pattern=".*\S.*" required /><button type="button" className="application-button" disabled={!!linkedCompany || !companyName.trim()} onClick={() => setAvailability(applications.some((item) => item.companyName.toLowerCase() === companyName.trim().toLowerCase()) ? "This name already appears in an application. Please choose another name." : "No matching name in this workspace. Official registry availability still needs verification.")}>Check availability</button></div></Field>{availability && <p className="application-inline-message" role="status">{availability}</p>}<Field label="Business activity" required><select value={activity} onChange={(event) => setActivity(event.target.value)} required><option value="" disabled>Select business activity</option>{[...new Set([...(activity ? [activity] : []), "Technology Consulting", "Retail & E-commerce", "Professional Services", "Manufacturing", "Real Estate", "Other"])].map((name) => <option key={name}>{name}</option>)}</select></Field><Field label="Registered address" required><textarea placeholder="Enter registered address…" value={address} onChange={(event) => setAddress(event.target.value)} required /></Field><div className="application-shareholders"><div><strong>Shareholder structure</strong><p>How many shareholders?</p></div><select aria-label="Number of shareholders" value={shareholders} onChange={(event) => setShareholders(event.target.value)}>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => <option key={count}>{count}</option>)}</select></div><Field label="Internal notes (optional)"><textarea placeholder="Add any internal notes about this application…" maxLength={500} value={detailsNotes} onChange={(event) => setDetailsNotes(event.target.value)} /><small className="application-character-count">{detailsNotes.length}/500</small></Field></div>}
          {step === 4 && <div className="application-upload-list">{documents.map((doc) => <section key={doc.id}><span className="application-document-icon"><SmallIcon name="document" /></span><div><h4>{doc.name}{doc.required && " *"}</h4><p>{doc.filename ?? doc.description}</p></div><label className="application-button application-upload-button" htmlFor={`upload-${doc.id}`}>{doc.filename ? "Replace" : "Upload"}<input id={`upload-${doc.id}`} className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => { chooseFile(doc.id, event.target.files?.[0]); event.target.value = ""; }} /></label></section>)}<p className="application-upload-help">PDF, PNG, or JPG · Up to 5 MB per file. Files are saved in this browser.</p></div>}
          {step === 5 && <div className="application-review-list">{reviewBlock("Customer details", 1, <div className="application-review-person"><span className="application-initials">{initials(customer?.name ?? "")}</span><div><strong>{customer?.name}</strong><span className="application-active-label">Active</span><p>{customer?.email} • {customer?.phone}</p></div></div>)}{reviewBlock("Service details", 2, <div className="application-review-person"><span className="application-document-icon"><SmallIcon name="building" /></span><div><strong>{service}</strong><p>{entityType} • {jurisdiction}</p><p>Assigned to {assignedTo} · {priority} priority</p></div></div>)}{reviewBlock("Application details", 3, <dl className="application-review-details"><div><dt>Proposed name</dt><dd>{companyName}</dd></div><div><dt>Business activity</dt><dd>{activity}</dd></div><div><dt>Address</dt><dd>{address}</dd></div><div><dt>Shareholders</dt><dd>{shareholders}</dd></div>{(serviceNotes || detailsNotes) && <div><dt>Internal notes</dt><dd>{[serviceNotes, detailsNotes].filter(Boolean).join("\n")}</dd></div>}</dl>)}{reviewBlock("Documents", 4, <ul className="application-review-documents">{documents.map((doc) => <li key={doc.id}><span>{doc.name}</span><strong>{doc.state === "Uploaded" ? doc.filename : doc.state}</strong></li>)}</ul>)}</div>}
        </form>
        <aside className="new-application-summary"><h3>Application summary</h3><p>This will be created after you complete all steps.</p><dl>{[
          ["user", "Customer", customer?.name || "—", customer?.email || ""], ["document", "Service", service], ["building", "Entity type", entityType], ["globe", "Jurisdiction", jurisdiction], ["user", "Assigned to", assignedTo], ["key", "Status", "In Progress"], ["calendar", "Created on", "—"],
        ].map(([icon, label, value, detail]) => <div key={label}><SmallIcon name={icon} /><div><dt>{label}</dt><dd>{label === "Status" ? <StatusBadge status="In Progress" /> : <strong>{value}</strong>}{detail && <small>{detail}</small>}</dd></div></div>)}</dl><p className="application-info"><SmallIcon name="info" />This will create a new application and generate a unique reference number automatically.</p></aside>
      </div>
      <footer className="new-application-footer"><button type="button" className="application-button" onClick={onClose} disabled={saving}>Cancel</button><div><button type="button" className="application-button soft" disabled={step === 1 || saving} onClick={() => goToStep(step - 1)}>Back</button><button className="application-button primary" type="submit" form="new-application-step" disabled={saving}>{saving ? "Creating…" : step === 5 ? "Create application" : "Next →"}</button></div></footer>
    </>}
  </dialog>;
}
