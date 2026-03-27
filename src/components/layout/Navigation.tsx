'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Settings, Plus } from 'lucide-react';
import { usePlusActionContext } from '@/lib/plus-action-context';
import { useNavSettings } from '@/lib/nav-settings-context';

const tabs = [
  { href: '/',              icon: LayoutDashboard, label: 'Home'         },
  { href: '/auswertungen',  icon: BarChart3,        label: 'Auswertungen' },
  { href: '/einstellungen', icon: Settings,         label: 'Einstellungen'},
];

export default function Navigation() {
  const pathname     = usePathname();
  const { plusAction } = usePlusActionContext();
  const { navPosition } = useNavSettings();

  const PlusBtn = () => (
    <button
      onClick={() => plusAction?.()}
      disabled={!plusAction}
      className={`relative flex items-center justify-center transition-all duration-200 active:scale-90
        w-12 h-12 rounded-full
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
  );

  // Desktop-Seitenleiste (nur wenn navPosition === 'left', nur ab md)
  const LeftNav = () => (
    <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-16 flex-col items-center
                    gap-1 py-6 bg-bg-surface/95 backdrop-blur-xl border-r border-bg-border">
      {tabs.slice(0, 1).map(tab => (
        <SideTab key={tab.href} {...tab} active={pathname === tab.href} />
      ))}

      <div className="my-2">
        <PlusBtn />
      </div>

      {tabs.slice(1).map(tab => (
        <SideTab
          key={tab.href}
          {...tab}
          active={pathname === tab.href || pathname.startsWith(tab.href + '/')}
        />
      ))}
    </nav>
  );

  // Bottom-Navigation (immer auf Mobile; auf Desktop nur wenn navPosition === 'bottom')
  const BottomNav = () => (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 bg-bg-surface/95 backdrop-blur-xl border-t border-bg-border
                     ${navPosition === 'left' ? 'md:hidden' : ''}`}>
      <div className="max-w-3xl mx-auto flex items-center justify-around px-2 pb-safe">
        {tabs.slice(0, 1).map(tab => (
          <NavTab key={tab.href} {...tab} active={pathname === tab.href} />
        ))}

        <div className="flex flex-col items-center py-2 px-4">
          <PlusBtn />
        </div>

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

  return (
    <>
      {navPosition === 'left' && <LeftNav />}
      <BottomNav />
    </>
  );
}

function NavTab({ href, icon: Icon, label, active }: {
  href: string; icon: React.ElementType; label: string; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-all duration-200
                  ${active ? 'text-accent' : 'text-tx-muted hover:text-tx-secondary'}`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}

function SideTab({ href, icon: Icon, label, active }: {
  href: string; icon: React.ElementType; label: string; active: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={`flex flex-col items-center gap-1 w-12 py-3 rounded-xl transition-all duration-200
                  ${active ? 'text-accent bg-accent/10' : 'text-tx-muted hover:text-tx-secondary hover:bg-bg-hover'}`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
      <span className="text-[9px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}
