import React from 'react';
import {
  LayoutDashboard,
  FlaskConical,
  Database,
  ShieldCheck,
  CheckCircle2,
  GitFork,
  FileCheck2,
  FileText,
  Sliders,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { appState } from '../../services/api';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string, params?: Record<string, string>) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const coreNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'evidence', label: 'Evidence', icon: ShieldCheck },
    { id: 'provenance', label: 'Provenance', icon: GitFork },
    { id: 'verification-center', label: 'Verification', icon: CheckCircle2 },
    { id: 'submissions', label: 'Submissions', icon: FileCheck2 },
    { id: 'audit-log', label: 'Reports', icon: FileText },
  ];

  const secondaryNavItems = [
    { id: 'settings', label: 'Node Settings', icon: Sliders },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Reset all experiments and evidence records back to verified institutional default state?'
      )
    ) {
      appState.resetToDefaults();
    }
  };

  return (
    <aside
      className={cn(
        'w-60 min-h-[calc(100vh-3.5rem)] bg-sidebar-custom text-slate-300 flex flex-col border-r border-slate-800/80 shrink-0 select-none z-30 transition-transform sm:translate-x-0 no-print',
        isOpenMobile ? 'fixed inset-y-0 left-0 translate-x-0' : 'hidden sm:flex'
      )}
    >
      {/* Institutional Descriptor Header */}
      <div className="px-4 py-3.5 border-b border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-100 tracking-tight flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Institutional Node</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 tracking-wide">
          Research Evidence Infrastructure
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        <div>
          <div className="px-2 pb-1.5 text-[9px] font-mono uppercase tracking-wider text-slate-400">
            Core Registry
          </div>
          <div className="space-y-0.5">
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentRoute === item.id ||
                (item.id === 'experiments' && currentRoute.startsWith('experiment-detail')) ||
                (item.id === 'verification-center' && currentRoute === 'verification');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all text-left cursor-pointer active:scale-[0.99]',
                    isActive
                      ? 'bg-slate-800/90 text-white font-semibold border-l-2 border-accent-primary pl-2 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5 shrink-0 transition-colors',
                      isActive ? 'text-accent-primary' : 'text-slate-400'
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-2 pb-1.5 text-[9px] font-mono uppercase tracking-wider text-slate-400">
            Administration
          </div>
          <div className="space-y-0.5">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all text-left cursor-pointer active:scale-[0.99]',
                    isActive
                      ? 'bg-slate-800/90 text-white font-semibold border-l-2 border-accent-primary pl-2 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5 shrink-0 transition-colors',
                      isActive ? 'text-accent-primary' : 'text-slate-400'
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Node Health & Reset Baseline Trigger */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse-subtle" />
            <span>CooL Protocol Node #91A2</span>
          </span>
          <span className="text-slate-400">v3.2.0</span>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="w-full py-1 px-2 rounded bg-slate-800/50 hover:bg-slate-800 text-[10px] font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700/50"
          title="Reset experimental registry to verified default state"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Reset Default State</span>
        </button>
      </div>
    </aside>
  );
};
