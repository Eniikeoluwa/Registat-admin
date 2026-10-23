"use client";
import { useState } from "react";
import { api, useApi } from "@/lib/api/client";
import { Empty, LoadState, date } from "@/components/applications/UI";
import { Pagination } from "./ModuleUI";
type Notification = { _id: string; title: string; message: string; isRead: boolean; createdAt: string };
export default function Notifications({ compact = false }: { compact?: boolean }) {
  const [page, setPage] = useState(1); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const resource = useApi<Notification[]>(`notifications?page=${page}&limit=${compact ? 3 : 20}`);
  async function markRead(id?: string) {
    setBusy(true); setError("");
    try { await api(id ? `notifications/${id}/read` : "notifications/read-all", { method: "PATCH" }); resource.reload(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to update notifications."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3"><LoadState {...resource} retry={resource.reload} />{error && <p role="alert">{error}</p>}{resource.data?.map(item => <div key={item._id} className="border-b border-slate-100 py-3"><strong>{item.title}</strong><p className="text-sm text-slate-600">{item.message}</p><small>{date(item.createdAt)}</small>{!item.isRead && <button className="ml-3 text-sm text-[#067939] underline" disabled={busy} onClick={() => void markRead(item._id)}>Mark read</button>}</div>)}{resource.data?.length === 0 && <Empty title="No notifications" description="Notifications for your account will appear here." />}{!compact && <><button className="text-[#067939] underline" disabled={busy || !resource.data?.length} onClick={() => void markRead()}>Mark all read</button><Pagination value={resource.pagination} onPage={setPage} /></>}</div>;
}
