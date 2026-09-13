import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.985] cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.2 gap-1.5 font-medium',
    md: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2 font-medium',
    lg: 'text-sm sm:text-base px-4 py-2 gap-2.5 font-semibold',
  }[size];

  const variantStyles = {
    primary:
      'bg-accent-primary hover:bg-accent-primary-hover text-accent-primary-fg border border-transparent shadow-xs',
    secondary:
      'bg-surface hover:bg-surface-elevated text-primary-custom border border-default shadow-xs active:bg-surface-inset',
    outline:
      'bg-transparent hover:bg-surface-elevated text-primary-custom border border-default',
    destructive:
      'bg-danger-primary hover:opacity-90 text-white border border-transparent shadow-xs',
    ghost:
      'bg-transparent hover:bg-surface-elevated text-muted-custom hover:text-primary-custom',
    accent:
      'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 shadow-xs',
  }[variant];

  return (
    <button
      className={cn(baseStyles, sizeStyles, variantStyles, className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
