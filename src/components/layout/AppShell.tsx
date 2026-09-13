import React, { useState, useEffect, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AuditBanner } from './AuditBanner';
import { GlobalCommandSearch } from './GlobalCommandSearch';
import { Menu } from 'lucide-react';

interface AppShellProps {
  currentRoute: string;
  routeParams?: Record<string, string>;
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onViewEvidence: (recordId: string) => void;
  onOpenNewExperiment?: () => void;
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  routeParams = {},
  onNavigate,
  onViewEvidence,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isReviewerRoute = currentRoute === 'reviewer-mode';

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-app flex flex-col font-sans text-primary-custom antialiased transition-colors duration-150">
      {/* Top Institutional Header */}
      <Header
        currentMode={isReviewerRoute ? 'reviewer' : 'researcher'}
        onModeChange={(mode) => onNavigate(mode === 'reviewer' ? 'reviewer-mode' : 'dashboard')}
        onNavigate={onNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        currentRoute={currentRoute}
        routeParams={routeParams}
      />

      {/* Global Contextual Audit Banner */}
      <AuditBanner onNavigate={onNavigate} />

      {/* Mobile Top Bar */}
      <div className="sm:hidden bg-sidebar-custom text-white px-4 py-2 flex items-center justify-between border-b border-slate-800 no-print">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
        <span className="text-xs font-mono text-slate-400 capitalize">{currentRoute}</span>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full">
        {/* Desktop Left Navigation Sidebar */}
        <div className="hidden sm:flex shrink-0">
          <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />
        </div>

        {/* Mobile Flyout Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex sm:hidden">
            <div
              className="fixed inset-0 bg-slate-950/70"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-sidebar-custom h-full shadow-xl z-10 flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-slate-800 text-white">
                <span className="font-bold text-sm">ResRec Navigation</span>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-xs text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
              <Sidebar
                currentRoute={currentRoute}
                onNavigate={(route: string, params?: Record<string, string>) => {
                  onNavigate(route, params);
                  setIsMobileSidebarOpen(false);
                }}
                isOpenMobile={true}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Primary Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Command Search Modal */}
      <GlobalCommandSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
        onViewEvidence={onViewEvidence}
      />
    </div>
  );
};
