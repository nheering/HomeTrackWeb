'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  // ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const widthClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4`}>
        <div className={`w-full ${widthClass} animate-slide-up`}>
          <div className="ht-card max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-tx-primary">{title}</h2>
              <button onClick={onClose} className="ht-btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
