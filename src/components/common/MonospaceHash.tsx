import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn, truncateHash } from '../../lib/utils';

interface MonospaceHashProps {
  value: string;
  truncate?: boolean;
  startLen?: number;
  endLen?: number;
  className?: string;
  showCopy?: boolean;
  prefix?: string;
}

export const MonospaceHash: React.FC<MonospaceHashProps> = ({
  value,
  truncate = true,
  startLen = 8,
  endLen = 8,
  className,
  showCopy = true,
  prefix,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayVal = truncate ? truncateHash(value, startLen, endLen) : value;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs text-primary-custom bg-surface-inset px-2 py-0.5 rounded border border-subtle select-all group transition-colors',
        copied ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'hover:border-default',
        className
      )}
      title={value}
    >
      {prefix && <span className="text-muted-custom font-sans select-none text-[11px]">{prefix}</span>}
      <span className="truncate tracking-tight">{displayVal}</span>
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'transition-colors p-0.5 rounded cursor-pointer',
            copied
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50'
              : 'text-muted-custom hover:text-primary-custom hover:bg-surface-elevated'
          )}
          title={copied ? 'Copied to clipboard' : 'Copy full cryptographic hash'}
          aria-label="Copy cryptographic value"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      )}
    </span>
  );
};
