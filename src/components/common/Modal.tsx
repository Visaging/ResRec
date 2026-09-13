import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 text-center sm:p-4">
        <div
          className={cn(
            'relative transform overflow-hidden rounded bg-surface text-left shadow-elevated transition-all sm:my-8 w-full border border-default flex flex-col max-h-[90vh] animate-subtle-fade',
            maxWidthClass
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-subtle px-5 py-3.5 bg-surface-elevated">
            <div>
              <h3 className="text-sm font-semibold text-primary-custom tracking-tight leading-snug">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-custom mt-0.5 leading-normal">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              className="text-muted-custom hover:text-primary-custom p-1 rounded hover:bg-surface-inset transition-colors cursor-pointer"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto max-h-[calc(85vh-7.5rem)] text-xs sm:text-sm text-primary-custom space-y-4">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="border-t border-subtle px-5 py-3 bg-surface-elevated flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
