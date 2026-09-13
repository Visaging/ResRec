import React, { type ReactNode } from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  noPadding?: boolean;
  variant?: 'default' | 'elevated' | 'inset';
  className?: string;
  headerClassName?: string;
  children: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  badge,
  action,
  noPadding = false,
  variant = 'default',
  className = '',
  headerClassName = '',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-surface border-default shadow-card',
    elevated: 'bg-surface-elevated border-default shadow-elevated',
    inset: 'bg-surface-inset border-subtle shadow-none',
  };

  return (
    <div
      className={`rounded border transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {(title || subtitle || badge || action) && (
        <div
          className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-surface-elevated/50 ${headerClassName}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {title && (
                <div className="text-xs sm:text-sm font-semibold text-primary-custom tracking-tight flex items-center gap-2">
                  {title}
                </div>
              )}
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-muted-custom mt-0.5 leading-normal">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div>
    </div>
  );
};
