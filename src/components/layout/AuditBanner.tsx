import React, { useState, useEffect } from 'react';
import { ShieldAlert, RotateCcw, ArrowRight } from 'lucide-react';
import { appState } from '../../services/api';

interface AuditBannerProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export const AuditBanner: React.FC<AuditBannerProps> = ({ onNavigate }) => {
  const [isTampered, setIsTampered] = useState(appState.getIsTamperSimulated());

  useEffect(() => {
    return appState.subscribe(() => {
      setIsTampered(appState.getIsTamperSimulated());
    });
  }, []);

  if (!isTampered) return null;

  return (
    <div className="bg-danger-surface text-danger-text border-b border-danger-border px-4 sm:px-6 py-2.5 text-xs select-none no-print transition-all duration-200 animate-subtle-fade">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-rose-200 dark:bg-rose-900 border border-danger-border shrink-0">
            <ShieldAlert className="w-4 h-4 text-danger-primary" />
          </div>
          <div className="leading-snug">
            <span className="font-bold tracking-tight">
              CRYPTOGRAPHIC COMMITMENT MISMATCH:
            </span>{' '}
            <span className="opacity-90">
              Raw dataset multihash deviates from immutable CooL receipt seal. Verification engine will reject unrecorded modifications.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigate('verification-center')}
            className="text-danger-text hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Run Cryptographic Audit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => appState.resetTamper()}
            className="bg-danger-primary hover:opacity-90 text-white px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restore Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
