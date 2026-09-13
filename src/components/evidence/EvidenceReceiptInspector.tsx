import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MonospaceHash } from '../common/MonospaceHash';
import { StatusIndicator } from '../common/StatusIndicator';
import { Button } from '../common/Button';
import type { EvidenceRecord } from '../../types';
import { formatDate } from '../../lib/utils';
import { Code, Copy, Check } from 'lucide-react';

interface EvidenceReceiptInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  record?: EvidenceRecord | null;
  evidenceRecord?: EvidenceRecord | null;
}

export const EvidenceReceiptInspector: React.FC<EvidenceReceiptInspectorProps> = ({
  isOpen,
  onClose,
  record,
  evidenceRecord,
}) => {
  const activeRecord = evidenceRecord || record;
  const [activeView, setActiveView] = useState<'details' | 'json'>('details');
  const [copied, setCopied] = useState(false);

  if (!activeRecord) return null;

  const rawJson = JSON.stringify(activeRecord, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Evidence Receipt: ${activeRecord.id}`}
      subtitle={`Sequence #${activeRecord.sequence} • Event: ${activeRecord.eventType} • Experiment: ${activeRecord.experimentId}`}
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs">
        {/* View Switcher */}
        <div className="flex border-b border-subtle">
          <button
            type="button"
            onClick={() => setActiveView('details')}
            className={`py-1.5 px-3 font-medium border-b-2 transition-colors cursor-pointer ${
              activeView === 'details'
                ? 'border-accent-primary text-accent-primary font-bold'
                : 'border-transparent text-muted-custom hover:text-primary-custom'
            }`}
          >
            Cryptographic Audit Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveView('json')}
            className={`py-1.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === 'json'
                ? 'border-accent-primary text-accent-primary font-bold'
                : 'border-transparent text-muted-custom hover:text-primary-custom'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw Receipt JSON</span>
          </button>
        </div>

        {activeView === 'details' ? (
          <div className="space-y-4">
            {/* Section 1: Record Identifiers */}
            <div className="bg-surface-elevated p-3.5 rounded border border-subtle space-y-2">
              <h4 className="font-semibold text-primary-custom border-b border-subtle pb-1.5 uppercase text-[10px] tracking-wider font-mono">
                Record Identifiers & Issuance
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-custom block text-[11px]">Record ID</span>
                  <span className="font-mono font-bold text-primary-custom">{activeRecord.id}</span>
                </div>
                <div>
                  <span className="text-muted-custom block text-[11px]">Execution ID</span>
                  <span className="font-mono font-semibold text-primary-custom">{activeRecord.executionId}</span>
                </div>
                <div>
                  <span className="text-muted-custom block text-[11px]">Sequence Number</span>
                  <span className="font-mono text-primary-custom font-bold">#{activeRecord.sequence}</span>
                </div>
                <div>
                  <span className="text-muted-custom block text-[11px]">Issued At</span>
                  <span className="font-mono text-muted-custom text-[11px]">
                    {formatDate(activeRecord.issuedAt)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-subtle text-primary-custom">
                <span className="font-semibold text-primary-custom">Summary: </span>
                {activeRecord.payloadSummary}
              </div>
            </div>

            {/* Section 2: Commitments */}
            <div className="bg-surface-elevated p-3.5 rounded border border-subtle space-y-2">
              <h4 className="font-semibold text-primary-custom border-b border-subtle pb-1.5 uppercase text-[10px] tracking-wider font-mono">
                Cryptographic Commitments (CooL Multihash)
              </h4>
              <div className="space-y-2 font-mono text-[11px]">
                <div>
                  <span className="text-muted-custom block font-sans text-xs mb-0.5">Metadata Commitment:</span>
                  <MonospaceHash value={activeRecord.metadataCommitment} truncate={false} className="w-full justify-between" />
                </div>
                <div>
                  <span className="text-muted-custom block font-sans text-xs mb-0.5">Input Commitment:</span>
                  <MonospaceHash value={activeRecord.inputCommitment} truncate={false} className="w-full justify-between" />
                </div>
                <div>
                  <span className="text-muted-custom block font-sans text-xs mb-0.5">Output Commitment:</span>
                  <MonospaceHash value={activeRecord.outputCommitment} truncate={false} className="w-full justify-between" />
                </div>
              </div>
            </div>

            {/* Section 3: Software Identity */}
            <div className="bg-surface-elevated p-3.5 rounded border border-subtle space-y-2">
              <h4 className="font-semibold text-primary-custom border-b border-subtle pb-1.5 uppercase text-[10px] tracking-wider font-mono">
                Software Identity & Execution Environment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-custom block text-[11px]">Software Agent / Engine</span>
                  <span className="font-medium text-primary-custom">
                    {activeRecord.softwareIdentity.name} ({activeRecord.softwareIdentity.version})
                  </span>
                </div>
                <div>
                  <span className="text-muted-custom block text-[11px]">Signer DID Key</span>
                  <MonospaceHash value={activeRecord.signerIdentity} startLen={10} endLen={10} />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-custom block text-[11px]">Binary Digest (SHA-256)</span>
                  <MonospaceHash value={activeRecord.softwareIdentity.binaryDigest} truncate={false} className="w-full justify-between" />
                </div>
                <div className="sm:col-span-2 text-muted-custom text-[11px]">
                  <span className="font-semibold text-primary-custom font-sans">Runtime: </span>
                  <span className="font-mono">{activeRecord.softwareIdentity.runtimeEnvironment}</span>
                </div>
              </div>
            </div>

            {/* Section 4: Cryptographic Verification Breakdown */}
            <div className="bg-surface-elevated p-3.5 rounded border border-subtle space-y-2.5">
              <h4 className="font-semibold text-primary-custom border-b border-subtle pb-1.5 uppercase text-[10px] tracking-wider font-mono flex items-center justify-between">
                <span>Cryptographic Verification Checks</span>
                <span className="text-muted-custom font-normal normal-case">
                  CooL Protocol Spec v4
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 bg-surface rounded border border-subtle flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Record Binding</div>
                    <div className="text-[10px] text-muted-custom">CooL Merkle node binding</div>
                  </div>
                  <StatusIndicator status={activeRecord.verification.binding} />
                </div>

                <div className="p-2.5 bg-surface rounded border border-subtle flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Signatures</div>
                    <div className="text-[10px] text-muted-custom">Ed25519 institutional key</div>
                  </div>
                  <StatusIndicator status={activeRecord.verification.signature} />
                </div>

                <div className="p-2.5 bg-surface rounded border border-subtle flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Transparency Log</div>
                    <div className="text-[10px] text-muted-custom">
                      Inclusion index #{activeRecord.transparencyLogIndex || 148920}
                    </div>
                  </div>
                  <StatusIndicator status={activeRecord.verification.transparency} />
                </div>

                <div className="p-2.5 bg-surface rounded border border-subtle flex items-center justify-between">
                  <div>
                    <div className="font-medium text-primary-custom">Witnesses Consensus</div>
                    <div className="text-[10px] text-muted-custom">
                      {activeRecord.witnessCount}/{activeRecord.witnessThreshold} Independent nodes
                    </div>
                  </div>
                  <StatusIndicator status={activeRecord.verification.witnesses} />
                </div>

                <div className="p-2.5 bg-surface rounded border border-subtle flex items-center justify-between sm:col-span-2">
                  <div>
                    <div className="font-medium text-primary-custom">Hardware Enclave Attestation</div>
                    <div className="text-[10px] text-muted-custom">
                      TPM 2.0 / SGX quote (strictly distinguishes Verified vs Not Provided)
                    </div>
                  </div>
                  <StatusIndicator status={activeRecord.verification.attestation} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-custom text-[11px] font-mono">
                receipt_{activeRecord.id}.json
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyJson}
                icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied' : 'Copy JSON'}
              </Button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-100 rounded border border-slate-800 text-[11px] font-mono overflow-x-auto max-h-96">
              {rawJson}
            </pre>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-subtle">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Receipt Inspector
          </Button>
        </div>
      </div>
    </Modal>
  );
};
