import React, { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { BadgeVariant } from '../../types';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'secondary',
  children,
  className,
  size = 'sm',
  icon,
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'verified':
      case 'success':
        return 'bg-success-surface text-success-text border-success-border font-semibold';
      case 'failed':
      case 'integrity_issue':
      case 'flagged':
      case 'destructive':
      case 'critical':
      case 'mismatch':
        return 'bg-danger-surface text-danger-text border-danger-border font-bold';
      case 'under_review':
      case 'corrected':
      case 'warning':
        return 'bg-warning-surface text-warning-text border-warning-border font-semibold';
      case 'not_provided':
        return 'bg-surface-inset text-muted-custom border-subtle italic';
      case 'not_checked':
        return 'bg-surface-inset text-faint-custom border-subtle';
      case 'active':
      case 'primary':
        return 'bg-accent-surface text-accent-text border-accent-border font-bold';
      case 'sealed':
      case 'completed':
        return 'bg-slate-800 dark:bg-slate-700 text-white border-slate-700 font-bold';
      case 'info':
        return 'bg-info-surface text-info-text border-info-border font-medium';
      case 'secondary':
      default:
        return 'bg-surface-elevated text-primary-custom border-default font-medium';
    }
  };

  const sizeStyles = size === 'sm' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono border rounded transition-colors whitespace-nowrap select-none',
        getStyles(),
        sizeStyles,
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
