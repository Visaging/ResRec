import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, MinusCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { VerificationStatus } from '../../types';

interface StatusIndicatorProps {
  status: VerificationStatus | 'detected' | 'not_detected';
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  className,
}) => {
  const isSm = size === 'sm';
  const iconClass = isSm ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0';

  const renderIconAndLabel = () => {
    switch (status) {
      case 'verified':
      case 'not_detected':
        return {
          icon: <CheckCircle2 className={cn(iconClass, 'text-emerald-600 dark:text-emerald-400')} />,
          text: label || (status === 'verified' ? 'VERIFIED' : 'NOT DETECTED'),
          color: 'text-emerald-700 dark:text-emerald-400 font-semibold',
        };
      case 'failed':
      case 'detected':
        return {
          icon: <XCircle className={cn(iconClass, 'text-rose-600 dark:text-rose-400')} />,
          text: label || (status === 'failed' ? 'FAILED' : 'DETECTED'),
          color: 'text-rose-700 dark:text-rose-400 font-bold',
        };
      case 'not_provided':
        return {
          icon: <MinusCircle className={cn(iconClass, 'text-muted-custom')} />,
          text: label || 'NOT PROVIDED',
          color: 'text-muted-custom italic',
        };
      case 'not_checked':
      default:
        return {
          icon: <HelpCircle className={cn(iconClass, 'text-muted-custom')} />,
          text: label || 'NOT CHECKED',
          color: 'text-muted-custom',
        };
    }
  };

  const { icon, text, color } = renderIconAndLabel();

  return (
    <div className={cn('inline-flex items-center gap-1.5 font-mono text-xs', className)}>
      {icon}
      <span className={cn('tracking-wide', color, isSm ? 'text-[11px]' : 'text-xs')}>{text}</span>
    </div>
  );
};
