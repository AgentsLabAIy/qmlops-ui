import * as React from "react";
import { Button } from "./button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        
        {/* Header Block Panel */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h4 className="text-xs font-bold text-cyan-400 font-sans tracking-wide uppercase">
            {title}
          </h4>
          <button 
            onClick={onClose}
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
