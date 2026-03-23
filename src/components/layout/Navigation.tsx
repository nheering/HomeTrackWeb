'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Settings, Plus } from 'lucide-react';
import { usePlusActionContext } from '@/lib/plus-action-context';

const tabs = [
  { href: '/',              icon: LayoutDashboard, label: 'Home'         },
  { href: '/auswertungen',  icon: BarChart3,        label: 'Auswertungen' },
  { href: '/einstellungen', icon: Settings,         label: 'Einstellungen'},
];

export default function Navigation() {
  const pathname = usePathname();
  const { plusAction } = usePlusActionContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-surface/95 backdrop-blur-xl border-t border-bg-border">
      <div className="max-w-3xl mx-auto flex items-center justify-around px-2 pb-safe">
        {/* Left tab */}
        {tabs.slice(0, 1).map(tab => (
          <NavTab key={tab.href} {...tab} active={pathname === tab.href} />
        ))}

        {/* Center Plus Button */}
        <div className="flex flex-col items-center py-2 px-4">
          <button
            onClick={() => plusAction?.()}
            disabled={!plusAction}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center
                        transition-all duration-200 active:scale-90
                        ${plusAction
                          ? 'bg-accent hover:bg-accent-dark shadow-accent'
                          : 'bg-bg-card border border-bg-border opacity-30 cursor-not-allowed'
                        }`}
            aria-label="Neu erstellen"
          >
            <Plus className="w-6 h-6 text-white" />
            {plusAction && (
              <span className="absolute inset-0 rounded-full animate-pulse-slow bg-accent/20" />
            )}
          </button>
        </div>

        {/* Right tabs */}
        {tabs.slice(1).map(tab => (
          <NavTab
            key={tab.href}
            {...tab}
            active={pathname === tab.href || pathname.startsWith(tab.href + '/')}
          />
        ))}
      </div>
    </nav>
  );
}

function NavTab({ href, icon: Icon, label, active }: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl
                  transition-all duration-200
                  ${active ? 'text-accent' : 'text-tx-muted hover:text-tx-secondary'}`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}
