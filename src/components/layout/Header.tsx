import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Bell,
  AlertTriangle,
  Search,
  LampDesk,
  Lamp,
  ChevronRight,
} from 'lucide-react';
import { appState } from '../../services/api';
import { useTheme } from '../../context/useTheme';

interface HeaderProps {
  currentMode: 'researcher' | 'reviewer';
  onModeChange: (mode: 'researcher' | 'reviewer') => void;
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onOpenSearch?: () => void;
  currentRoute?: string;
  routeParams?: Record<string, string>;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  onNavigate,
  onOpenSearch,
  currentRoute = 'dashboard',
  routeParams = {},
}) => {
  const { theme, toggleTheme } = useTheme();
  const [alerts, setAlerts] = useState(appState.getAlerts().filter((a) => a.status === 'open'));
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);

  useEffect(() => {
    return appState.subscribe(() => {
      setAlerts(appState.getAlerts().filter((a) => a.status === 'open'));
    });
  }, []);

  const getBreadcrumb = () => {
    switch (currentRoute) {
      case 'experiments':
        return 'Experiments Registry';
      case 'experiment-detail':
        return `Case File / ${routeParams.id || 'EXP-2026-0042'}`;
      case 'datasets':
        return 'Datasets Registry';
      case 'evidence':
        return 'Evidence Registry';
      case 'provenance':
        return 'Provenance Lineage';
      case 'verification-center':
      case 'verification':
        return 'Verification Center';
      case 'submissions':
        return 'Research Submissions';
      case 'reviewer-mode':
        return 'Independent Reviewer Audit';
      case 'audit-log':
        return 'Compliance & Audit Log';
      case 'settings':
        return 'Node Settings';
      default:
        return 'Research Integrity Portfolio';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-surface text-primary-custom border-b border-subtle select-none no-print transition-colors">
      <div className="px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Left: Brand Identity & Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded p-1 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded bg-surface-elevated flex items-center justify-center border border-default transition-all group-hover:border-strong">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-sm text-primary-custom">ResRec</span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-surface-inset text-muted-custom rounded border border-subtle">
                  CooL Node
                </span>
              </div>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-custom border-l border-subtle pl-4 font-mono">
            <span>Portfolio</span>
            <ChevronRight className="w-3 h-3 text-faint-custom" />
            <span className="text-primary-custom font-medium font-sans">{getBreadcrumb()}</span>
          </div>
        </div>

        {/* Center: Global Search Bar Trigger */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full bg-surface-elevated hover:bg-surface-inset border border-subtle hover:border-default rounded px-3 py-1.5 text-xs text-muted-custom flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-faint-custom group-hover:text-primary-custom transition-colors" />
              <span>Search experiments, CooL receipts, multihashes...</span>
            </div>
            <span className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-subtle text-faint-custom">
              Ctrl+K
            </span>
          </button>
        </div>

        {/* Right: Actions, Theme Switcher & Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded hover:bg-surface-elevated text-muted-custom hover:text-primary-custom border border-subtle transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <LampDesk className="w-4 h-4 text-amber-400" />
            ) : (
              <Lamp className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Notifications / Alerts Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAlertsMenu(!showAlertsMenu)}
              className="relative p-1.5 rounded hover:bg-surface-elevated text-muted-custom hover:text-primary-custom border border-subtle transition-colors cursor-pointer"
              title="Integrity Alerts"
              aria-label="Integrity Alerts"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-surface" />
              )}
            </button>

            {showAlertsMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-surface rounded shadow-elevated border border-default text-primary-custom z-50 p-2 text-xs animate-subtle-fade">
                <div className="font-semibold text-primary-custom px-2 py-1.5 border-b border-subtle flex items-center justify-between">
                  <span>Institutional Integrity Alerts</span>
                  <span className="font-mono text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded font-bold">
                    {alerts.length} OPEN
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-subtle py-1">
                  {alerts.length === 0 ? (
                    <div className="p-3 text-center text-muted-custom">
                      All experimental records cryptographically verified.
                    </div>
                  ) : (
                    alerts.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-2 hover:bg-surface-elevated transition-colors cursor-pointer"
                        onClick={() => {
                          setShowAlertsMenu(false);
                          onNavigate('verification-center');
                        }}
                      >
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium text-rose-700 dark:text-rose-400">
                              {alt.title}
                            </div>
                            <div className="text-[11px] text-muted-custom mt-0.5 leading-snug">
                              {alt.reason}
                            </div>
                            <div className="text-[10px] font-mono text-faint-custom mt-1">
                              Record: {alt.recordId || alt.experimentId}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Institutional Mode Switcher */}
          <div className="flex items-center bg-surface-inset p-0.5 rounded border border-subtle text-xs">
            <button
              type="button"
              onClick={() => onModeChange('researcher')}
              className={`px-2 py-1 rounded font-medium transition-all cursor-pointer ${
                currentMode === 'researcher'
                  ? 'bg-surface text-primary-custom shadow-xs font-semibold'
                  : 'text-muted-custom hover:text-primary-custom'
              }`}
            >
              Researcher
            </button>
            <button
              type="button"
              onClick={() => onModeChange('reviewer')}
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all cursor-pointer ${
                currentMode === 'reviewer'
                  ? 'bg-accent-primary text-white shadow-xs font-semibold'
                  : 'text-muted-custom hover:text-primary-custom'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              <span>Auditor</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
