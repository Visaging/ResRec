import React, { type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  badge?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-subtle overflow-x-auto ${className}`}>
      <nav className="flex space-x-1 sm:space-x-2 min-w-max px-0.5" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`py-2 px-3 inline-flex items-center gap-2 border-b-2 font-medium text-xs transition-all whitespace-nowrap cursor-pointer select-none rounded-t ${
                isActive
                  ? 'border-accent-primary text-accent-primary font-bold bg-surface-elevated'
                  : 'border-transparent text-muted-custom hover:text-primary-custom hover:border-default hover:bg-surface-elevated/50'
              }`}
            >
              {tab.icon && (
                <span
                  className={`inline-flex items-center transition-colors ${
                    isActive ? 'text-accent-primary' : 'text-muted-custom'
                  }`}
                >
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`ml-1 py-0.2 px-1.5 rounded text-[10px] font-mono transition-colors ${
                    isActive
                      ? 'bg-accent-primary text-white font-semibold'
                      : 'bg-surface-inset text-muted-custom border border-subtle'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && <span className="ml-1">{tab.badge}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
