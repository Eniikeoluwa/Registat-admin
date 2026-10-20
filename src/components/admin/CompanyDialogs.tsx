'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { lockAdminDialogScroll } from './dialogScrollLock';
import { SmallIcon } from './ApplicationUI';
export default function CompanyDialog({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current; const releaseScroll = lockAdminDialogScroll();
    element?.showModal();
    return () => { element?.close(); releaseScroll(); };
  }, []);
  return <dialog ref={dialog} className={`company-dialog ${className}`} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}><header>{className.includes("company-skip-dialog") && <span className="company-warning-icon"><SmallIcon name="alert" /></span>}<h2>{title}</h2><button type="button" className="application-icon-button" aria-label={`Close ${title}`} onClick={onClose}><SmallIcon name="close" /></button></header>{children}</dialog>;
}
