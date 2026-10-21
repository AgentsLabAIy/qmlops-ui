import * as React from "react";
import { Button } from "./button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
      ) || []);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4 ${className}`}>
        
        {/* Header Block Panel */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h4 id={titleId} className="text-xs font-bold text-cyan-400 font-sans tracking-wide uppercase">
            {title}
          </h4>
          <button 
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-500 hover:text-slate-300 font-mono text-sm leading-none cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Content Pane Payload Section */}
        <div className="text-xs text-slate-300 font-sans leading-relaxed">
          {children}
        </div>

        {/* Action Panel Baseline Tray */}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Dismiss Menu
          </Button>
        </div>

      </div>
    </div>
  );
};
