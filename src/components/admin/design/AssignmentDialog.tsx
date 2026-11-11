"use client";
import { useState } from "react";
import { useApi } from "@/lib/api/client";
import type { AdminApplicationResponse } from "@/lib/api/types";
import { LoadState } from "@/components/applications/UI";
import SchemaEditor from "@/components/modules/SchemaEditor";
import { Dialog, Field, Icon } from "./UI";
export default function AssignmentDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [query, setQuery] = useState(""); const [id, setId] = useState(""); const [page, setPage] = useState(1);
  const resource = useApi<AdminApplicationResponse[]>(`applications/admin?limit=10&page=${page}${query.trim() ? `&search=${encodeURIComponent(query.trim().slice(0, 100))}` : ""}`);
  return <Dialog title="Assign application" onClose={onClose} className="design-native-modal"><header className="design-modal-heading"><div><h2>Assign application</h2><p>Select a case and an eligible staff member.</p></div><button className="application-icon-button" aria-label="Close assignment" onClick={onClose}><Icon name="close" /></button></header><Field title="Find application"><input value={query} onChange={event => { setPage(1); setQuery(event.target.value); }} placeholder="Reference or customer name" /></Field><LoadState {...resource} retry={resource.reload} /><Field title="Application" required><select value={id} onChange={event => setId(event.target.value)}><option value="">Select an application</option>{resource.data?.filter(row => !["completed", "rejected", "cancelled"].includes(row.status)).map(row => <option key={row._id} value={row._id}>{row.reference} · {row.userInfo.name}</option>)}</select></Field><div className="design-customer-pages"><button disabled={!resource.pagination?.hasPreviousPage} onClick={() => setPage(value => value - 1)}>Previous</button><button disabled={!resource.pagination?.hasNextPage} onClick={() => setPage(value => value + 1)}>Next</button></div>{id && <div className="design-drawer-tools"><SchemaEditor key={id} title="Case assignment" schemaName="AdminCaseUpdate" endpoint={`applications/admin/${id}/case`} method="PATCH" onSaved={() => { onSaved(); onClose(); }} /></div>}</Dialog>;
}
