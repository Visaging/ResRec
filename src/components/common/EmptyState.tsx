import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  children,
}) => {
  return (
    <div
      className={`text-center p-8 sm:p-12 border border-dashed border-subtle rounded bg-surface-inset/50 ${className}`}
    >
      <div className="w-10 h-10 rounded bg-surface-elevated flex items-center justify-center mx-auto mb-3 border border-default">
        <Icon className="w-5 h-5 text-muted-custom" />
      </div>
      <h3 className="text-sm font-semibold text-primary-custom mb-1">{title}</h3>
      <p className="text-xs text-muted-custom max-w-sm mx-auto mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
};
