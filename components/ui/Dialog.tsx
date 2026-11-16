'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** 'center' = modal card, 'right' = slide-over panel, 'full' = whole screen. */
  variant?: 'center' | 'right' | 'full';
  /** Close when the backdrop is clicked (off for forms with typed input). */
  closeOnBackdrop?: boolean;
  width?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * One dialog primitive for the whole app: role=dialog + aria-modal, Escape closes,
 * Tab is trapped inside, focus moves in on open and back to the opener on close.
 */
export function Dialog({ open, onClose, title, variant = 'center', closeOnBackdrop = true, width, headerExtra, children, footer }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useRef(`dlg-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current!;
    const first = panel.querySelector<HTMLElement>('[data-autofocus]') ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    first.focus();

    const onKey = (e: KeyboardEvent) => {
      // Only the top-most dialog reacts.
      const dialogs = document.querySelectorAll('[data-dialog-panel]');
      if (dialogs[dialogs.length - 1] !== panel) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null);
        if (items.length === 0) { e.preventDefault(); return; }
        const firstEl = items[0], lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const panelClass =
    variant === 'right'
      ? 'panel !border-y-0 !border-r-0 fixed inset-y-0 right-0 w-full sm:max-w-[var(--w)] anim-slide-right flex flex-col'
      : variant === 'full'
        ? 'fixed inset-0 flex flex-col anim-fade bg-paper-0'
        : 'panel relative w-full max-w-[var(--w)] max-h-[90vh] flex flex-col anim-pop';

  return (
    <div className={`fixed inset-0 z-50 ${variant === 'center' ? 'flex items-center justify-center p-4' : ''}`}>
      {variant !== 'full' && (
        <div className="absolute inset-0 bg-paper-0/80 anim-fade" onClick={closeOnBackdrop ? onClose : undefined} aria-hidden />
      )}
      <div
        ref={panelRef}
        data-dialog-panel
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ ['--w' as string]: width ?? (variant === 'right' ? '34rem' : '30rem') }}
        className={`${panelClass} outline-none`}
      >
        {variant === 'center' && <span className="tape -top-3 left-1/2 -translate-x-1/2" style={{ ['--rot' as string]: '-2deg' }} aria-hidden />}
        <header className={`flex items-center justify-between gap-3 px-6 py-4 shrink-0 ${variant === 'full' ? 'border-b-[1.5px] border-line' : 'border-b-[1.5px] border-dashed border-line'}`}>
          <h2 id={titleId} className="text-lg font-extrabold text-ink truncate" style={{ fontStretch: '115%' }}>{title}</h2>
          <div className="flex items-center gap-1 shrink-0">
            {headerExtra}
            <button onClick={onClose} className="btn-icon" aria-label="Close (Esc)" title="Close (Esc)">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="px-6 py-4 border-t-[1.5px] border-dashed border-line shrink-0">{footer}</footer>}
      </div>
    </div>
  );
}
