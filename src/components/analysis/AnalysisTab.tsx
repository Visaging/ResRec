import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { Experiment } from '../../types';
import { Download, FileCode, CheckCircle2 } from 'lucide-react';

interface AnalysisTabProps {
  experiment: Experiment;
  onViewEvidence: (evidenceId: string) => void;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({ experiment, onViewEvidence }) => {
  return (
    <div className="space-y-6 animate-subtle-fade">
      {/* Top Analysis Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-surface p-4 rounded border border-subtle">
          <span className="text-muted-custom font-medium block">Fitted Kinetic Model</span>
          <div className="text-sm font-bold text-primary-custom mt-1 font-mono">
            Arrhenius-Eyring Non-linear Regression
          </div>
          <div className="text-[11px] text-muted-custom mt-1 font-mono">
            Ea = 31.4 ± 0.6 kJ/mol (R² = 0.994)
          </div>
        </div>

        <div className="bg-surface p-4 rounded border border-subtle">
          <span className="text-muted-custom font-medium block">Thermal Runaway Critical Threshold</span>
          <div className="text-sm font-bold text-primary-custom mt-1 font-mono">
            81.8 {experiment.primaryUnit || '°C'} (Cycle #16)
          </div>
          <div className="text-[11px] text-muted-custom mt-1">
            SEI exothermic decomposition rate exceeded dissipation
          </div>
        </div>

        <div className="bg-surface p-4 rounded border border-subtle">
          <span className="text-muted-custom font-medium block">Reproducibility Package</span>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complete & Sealed
          </div>
          <div className="text-[11px] text-muted-custom mt-1">
            Docker container digest & computational environment verified
          </div>
        </div>
      </div>

      {/* Pipeline Execution Details */}
      <Card
        title="Computational Pipeline Logs & Statistical Artifacts"
        subtitle={`Sealed in evidence record REC-C992-0050 for ${experiment.id}`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewEvidence('REC-C992-0050')}
            icon={<FileCode className="w-3.5 h-3.5" />}
          >
            Inspect Pipeline Evidence
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-950 text-slate-200 rounded border border-slate-800 font-mono text-[11px] space-y-1">
            <div className="text-slate-400"># Computational Execution Log (Deterministic Scipy/Numpy)</div>
            <div>[2026-09-13 15:20:01 UTC] Ingesting thermal-cycling-042.csv (CooL: 7f3a88c24f61e791...)</div>
            <div>[2026-09-13 15:20:02 UTC] Applying Arrhenius least squares fit to dT/dt vs 1/T_kelvin</div>
            <div>[2026-09-13 15:20:02 UTC] Convergence reached at iteration 14. Tolerance: 1e-8</div>
            <div>[2026-09-13 15:20:03 UTC] Output parameter Ea: 31.428 kJ/mol | R2: 0.99412 | p-val: 1.2e-9</div>
            <div>[2026-09-13 15:20:04 UTC] Generating Figure 3 vector art (600 DPI CMYK)</div>
            <div className="text-emerald-400">[2026-09-13 15:20:05 UTC] Output sealed with CooL multihash commitment: 2a4c88e910293847...</div>
          </div>

          <div className="p-3 bg-surface-elevated rounded border border-subtle flex items-center justify-between">
            <div>
              <div className="font-semibold text-primary-custom">Download Complete Reproducibility Bundle</div>
              <div className="text-muted-custom text-[11px]">
                Contains dataset CSV, Jupyter analysis notebook, environment.yml, and CooL cryptographic receipts.
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => alert('Reproducibility bundle downloaded with NIST verification manifests.')}
            >
              Download Bundle (.tar.gz)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
