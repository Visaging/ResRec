import React, { useState } from 'react';
import {
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusIndicator } from '../common/StatusIndicator';

export const SettingsPage: React.FC = () => {
  const [didKey, setDidKey] = useState(
    'did:key:z6MkqnB7WqU98Vd4E1r8T5Y9bF3vG8kL2sP5mQ7wE9rX1yZ3'
  );
  const [transparencyEndpoint, setTransparencyEndpoint] = useState(
    'https://log.co-ol.org/v1/institutions/stanford-energy'
  );
  const [witnessThreshold, setWitnessThreshold] = useState(3);
  const [witnessCount] = useState(4);
  const [attestationPolicy, setAttestationPolicy] = useState<'strict' | 'permissive'>('strict');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-subtle-fade">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-custom">
            Institutional Cryptographic Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-custom mt-1">
            Manage institutional signing keys, witness consensus networks, and CooL protocol compliance rules.
          </p>
        </div>

        {saved && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institutional Identity */}
        <Card
          title="Institutional Identity & Signer Keys"
          subtitle="Ed25519 decentralized identifier used for signing immutable research records"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-primary-custom font-medium mb-1">
                Institutional DID Public Key
              </label>
              <input
                type="text"
                value={didKey}
                onChange={(e) => setDidKey(e.target.value)}
                className="w-full rounded border border-default bg-surface py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <span className="text-[11px] text-muted-custom mt-1 block">
                Public key registered in the Global Academic DID Registry (W3C DID v1.0 compliant).
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary-custom font-medium mb-1">Institution Name</label>
                <input
                  type="text"
                  defaultValue="Stanford Advanced Energy Institute"
                  className="w-full rounded border border-default bg-surface py-1.5 px-3 text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block text-primary-custom font-medium mb-1">ROR ID (Research Organization Registry)</label>
                <input
                  type="text"
                  defaultValue="https://ror.org/00f54p054"
                  className="w-full rounded border border-default bg-surface py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Transparency Log & Merkle Witnesses */}
        <Card
          title="Transparency Log & Witness Quorum"
          subtitle="Distributed consensus configuration for tamper-evident record commitment"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-primary-custom font-medium mb-1">
                Transparency Log Ingestion URL
              </label>
              <input
                type="text"
                value={transparencyEndpoint}
                onChange={(e) => setTransparencyEndpoint(e.target.value)}
                className="w-full rounded border border-default bg-surface py-1.5 px-3 font-mono text-primary-custom text-xs focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary-custom font-medium mb-1">
                  Active Witness Nodes ({witnessCount})
                </label>
                <div className="p-3 bg-surface-elevated rounded border border-subtle space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-primary-custom">1. MIT Energy Witness #1</span>
                    <StatusIndicator status="verified" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-custom">2. UC Berkeley Material Lab</span>
                    <StatusIndicator status="verified" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-custom">3. SLAC National Accelerator</span>
                    <StatusIndicator status="verified" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary-custom">4. CERN Compliance Daemon</span>
                    <StatusIndicator status="verified" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-primary-custom font-medium mb-1">
                  Required Witness Quorum Threshold ({witnessThreshold} of {witnessCount})
                </label>
                <input
                  type="range"
                  min={1}
                  max={witnessCount}
                  value={witnessThreshold}
                  onChange={(e) => setWitnessThreshold(parseInt(e.target.value, 10))}
                  className="w-full mt-2 accent-accent-primary"
                />
                <div className="flex justify-between text-[11px] text-muted-custom mt-1 font-mono">
                  <span>1 (Weak)</span>
                  <span className="font-bold text-accent-primary">Current: {witnessThreshold}</span>
                  <span>4 (Consensus)</span>
                </div>
                <p className="text-[11px] text-muted-custom mt-2">
                  At least {witnessThreshold} independent nodes must countersign Merkle roots before publication sealing.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Hardware Enclave & Signature Policies */}
        <Card
          title="Hardware Enclave & Attestation Policy"
          subtitle="Define whether Intel SGX / TPM 2.0 quotes are strictly enforced for sensor acquisition"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attestationPolicy"
                  checked={attestationPolicy === 'strict'}
                  onChange={() => setAttestationPolicy('strict')}
                  className="text-accent-primary focus:ring-accent-primary"
                />
                <span className="font-medium text-primary-custom">
                  Strict (Flag receipts without hardware enclave quote)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attestationPolicy"
                  checked={attestationPolicy === 'permissive'}
                  onChange={() => setAttestationPolicy('permissive')}
                  className="text-accent-primary focus:ring-accent-primary"
                />
                <span className="font-medium text-primary-custom">
                  Permissive (Allow software agent signatures)
                </span>
              </label>
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="md"
            type="submit"
            icon={<Save className="w-4 h-4" />}
          >
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
