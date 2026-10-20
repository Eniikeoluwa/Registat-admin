'use client';
let locks = 0;
let originalOverflow = '';
// Nested dialogs may unmount in either order when their route changes.
export function lockAdminDialogScroll() {
  if (locks === 0) originalOverflow = document.body.style.overflow;
  locks += 1; document.body.style.overflow = 'hidden';
  let released = false;
  return () => { if (released) return; released = true; locks -= 1; if (locks === 0) document.body.style.overflow = originalOverflow; };
}
