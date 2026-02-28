'use client';

import { usePathname } from 'next/navigation';
import { X, Zap, MapPin, Building2, FileText, Gauge } from 'lucide-react';
import { useState } from 'react';
import VerbrauchswertModal from '@/components/modals/VerbrauchswertModal';
import VerbrauchstypModal from '@/components/modals/VerbrauchstypModal';
import AnbieterModal from '@/components/modals/AnbieterModal';
import VertragModal from '@/components/modals/VertragModal';

interface PlusMenuProps {
  onClose: () => void;
}

const menuItems = [
  { id: 'verbrauchswert', icon: Gauge,    label: 'Zählerstand erfassen', color: 'text-accent',        bg: 'bg-accent/10' },
  { id: 'verbrauchstyp', icon: Zap,      label: 'Verbrauchstyp anlegen', color: 'text-chart-strom',  bg: 'bg-yellow-500/10' },
  { id: 'anbieter',      icon: Building2, label: 'Anbieter hinzufügen',  color: 'text-chart-wasser', bg: 'bg-sky-500/10' },
  { id: 'vertrag',       icon: FileText,  label: 'Vertrag erstellen',    color: 'text-chart-heizung', bg: 'bg-rose-500/10' },
];

export default function PlusMenu({ onClose }: PlusMenuProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleItem = (id: string) => {
    setActiveModal(id);
  };

  const handleModalClose = () => {
    setActiveModal(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-72 animate-slide-up">
        <div className="ht-card space-y-1">
          <p className="ht-section-title px-2 pt-1">Neu erstellen</p>
          {menuItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => handleItem(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                         hover:bg-bg-hover transition-colors duration-150 text-left"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </span>
              <span className="text-sm text-tx-primary">{item.label}</span>
            </button>
          ))}
        </div>
        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-3 w-full ht-btn-secondary justify-center"
        >
          <X className="w-4 h-4" /> Schließen
        </button>
      </div>

      {/* Modals */}
      {activeModal === 'verbrauchswert' && <VerbrauchswertModal onClose={handleModalClose} />}
      {activeModal === 'verbrauchstyp'  && <VerbrauchstypModal  onClose={handleModalClose} />}
      {activeModal === 'anbieter'       && <AnbieterModal        onClose={handleModalClose} />}
      {activeModal === 'vertrag'        && <VertragModal         onClose={handleModalClose} />}
    </>
  );
}
