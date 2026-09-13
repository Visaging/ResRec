import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  actions?: React.ReactNode;
  className?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records, IDs, or researchers...',
  filterGroups = [],
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 bg-surface p-2.5 rounded border border-default shadow-xs',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-custom">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded border border-default bg-surface-elevated py-1.5 pl-8 pr-8 text-xs text-primary-custom placeholder:text-muted-custom focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-custom hover:text-primary-custom cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {filterGroups.map((group) => (
          <div key={group.id} className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-custom font-medium text-[11px]">{group.label}:</span>
            <select
              value={group.selectedValue}
              onChange={(e) => group.onChange(e.target.value)}
              className="rounded border border-default bg-surface-elevated py-1.5 pl-2.5 pr-7 text-xs text-primary-custom font-medium focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer transition-colors"
            >
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Optional right-aligned actions */}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};
