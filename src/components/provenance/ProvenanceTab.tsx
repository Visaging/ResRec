import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Activity,
  Database,
  Filter,
  BarChart3,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCheck2,
  CheckCircle2,
  Layers,
  Info,
  CornerDownRight,
  GitBranch,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { MonospaceHash } from '../common/MonospaceHash';
import { Button } from '../common/Button';
import { appState } from '../../services/api';
import type { Experiment, ProvenanceNode } from '../../types';
import { formatDate } from '../../lib/utils';

interface ProvenanceTabProps {
  experiment: Experiment;
  onViewEvidence: (evidenceId: string) => void;
}

interface NodeStyleConfig {
  level: number;
  indentClass: string;
  badgeLabel: string;
  badgeClass: string;
  cardBorder: string;
  iconBg: string;
  textColor: string;
  borderLeftColor: string;
  isSubBranch: boolean;
}

export const ProvenanceTab: React.FC<ProvenanceTabProps> = ({ experiment, onViewEvidence }) => {
  const nodes = appState.getProvenanceNodes(experiment.id);
  const [selectedNode, setSelectedNode] = useState<ProvenanceNode | null>(nodes[0] || null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const getNodeConfig = (category: string): NodeStyleConfig => {
    switch (category) {
      case 'experiment':
        return {
          level: 0,
          indentClass: 'ml-0',
          badgeLabel: 'Protocol Genesis',
          badgeClass: 'bg-primary-custom text-app border-primary-custom',
          cardBorder: 'border-l-4 border-l-primary-custom border-subtle bg-surface',
          iconBg: 'bg-surface-elevated text-primary-custom',
          textColor: 'text-primary-custom',
          borderLeftColor: 'border-primary-custom',
          isSubBranch: false,
        };
      case 'raw_measurements':
        return {
          level: 1,
          indentClass: 'ml-0 sm:ml-4',
          badgeLabel: 'Telemetry Ingestion',
          badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 font-semibold',
          cardBorder: 'border-l-4 border-l-sky-500 border-subtle bg-sky-500/5',
          iconBg: 'bg-sky-500/10 text-sky-500',
          textColor: 'text-primary-custom',
          borderLeftColor: 'border-sky-500',
          isSubBranch: true,
        };
      case 'dataset':
        return {
          level: 1,
          indentClass: 'ml-0 sm:ml-4',
          badgeLabel: 'Data Artifact Upload',
          badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold',
          cardBorder: 'border-l-4 border-l-blue-500 border-subtle bg-blue-500/5',
          iconBg: 'bg-blue-500/10 text-blue-500',
          textColor: 'text-primary-custom',
          borderLeftColor: 'border-blue-500',
          isSubBranch: true,
        };
      case 'processing_step':
        return {
          level: 2,
          indentClass: 'ml-2 sm:ml-10',
          badgeLabel: 'Pipeline Transformation / Correction',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold',
          cardBorder: 'border-l-4 border-l-amber-500 border-subtle bg-amber-500/5',
          iconBg: 'bg-amber-500/10 text-amber-500',
          textColor: 'text-primary-custom',
          borderLeftColor: 'border-amber-500',
          isSubBranch: true,
        };
      case 'analysis':
        return {
          level: 2,
          indentClass: 'ml-2 sm:ml-10',
          badgeLabel: 'Statistical Regression',
          badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-semibold',
          cardBorder: 'border-l-4 border-l-indigo-500 border-subtle bg-indigo-500/5',
          iconBg: 'bg-indigo-500/10 text-indigo-500',
          textColor: 'text-primary-custom',
          borderLeftColor: 'border-indigo-500',
          isSubBranch: true,
        };
      case 'figure':
        return {
          level: 3,
          indentClass: 'ml-4 sm:ml-16',
          badgeLabel: 'Figure & Graphic Export',
          badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold',
          cardBorder: 'border-l-4 border-l-purple-500 border-subtle bg-purple-500/5',
          iconBg: 'bg-purple-500/10 text-purple-500',
          textColor: 'text-primary-custom',
          borderLeftColor: 'border-purple-500',
          isSubBranch: true,
        };
      case 'submission':
        return {
          level: 0,
          indentClass: 'ml-0',
          badgeLabel: 'Sealed Manuscript Milestone',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold',
          cardBorder: 'border-l-4 border-l-emerald-500 border-subtle bg-emerald-500/5',
          iconBg: 'bg-emerald-500/10 text-emerald-500',
          textColor: 'text-primary-custom',
          borderLeftColor: 'border-emerald-500',
          isSubBranch: false,
        };
      default:
        return {
          level: 0,
          indentClass: 'ml-0',
          badgeLabel: 'Evidence Record',
          badgeClass: 'bg-surface-elevated text-primary-custom border-subtle',
          cardBorder: 'border-l-4 border-l-muted-custom border-subtle bg-surface',
          iconBg: 'bg-surface-elevated text-muted-custom',
          textColor: 'text-primary-custom',
          borderLeftColor: 'border-subtle',
          isSubBranch: false,
        };
    }
  };

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'experiment':
        return <FlaskConical className="w-4 h-4 text-accent-primary" />;
      case 'raw_measurements':
        return <Activity className="w-4 h-4 text-sky-500" />;
      case 'dataset':
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'processing_step':
        return <Filter className="w-4 h-4 text-amber-500" />;
      case 'analysis':
        return <BarChart3 className="w-4 h-4 text-indigo-500" />;
      case 'derived_result':
        return <FileSpreadsheet className="w-4 h-4 text-muted-custom" />;
      case 'figure':
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      case 'submission':
        return <FileCheck2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Layers className="w-4 h-4 text-muted-custom" />;
    }
  };

  const filteredNodes = useMemo(() => {
    if (filterCategory === 'all') return nodes;
    if (filterCategory === 'uploads') {
      return nodes.filter((n) => n.category === 'dataset' || n.category === 'raw_measurements');
    }
    if (filterCategory === 'processing') {
      return nodes.filter((n) => n.category === 'processing_step' || n.category === 'analysis');
    }
    if (filterCategory === 'figures') {
      return nodes.filter((n) => n.category === 'figure' || n.category === 'submission');
    }
    return nodes;
  }, [nodes, filterCategory]);

  return (
    <div className="space-y-6 animate-subtle-fade">
      {/* Category Filter & Indentation Legend Bar */}
      <div className="bg-surface p-3.5 rounded border border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-muted-custom font-semibold mr-1 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5 text-muted-custom" /> Filter Chain:
          </span>
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              filterCategory === 'all'
                ? 'bg-accent-primary text-white font-semibold'
                : 'bg-surface-elevated text-muted-custom hover:text-primary-custom'
            }`}
          >
            Full Lineage Tree ({nodes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('uploads')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              filterCategory === 'uploads'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
            }`}
          >
            Data Artifact Uploads ({nodes.filter((n) => n.category === 'dataset' || n.category === 'raw_measurements').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('processing')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              filterCategory === 'processing'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            Pipeline & Corrections ({nodes.filter((n) => n.category === 'processing_step' || n.category === 'analysis').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('figures')}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              filterCategory === 'figures'
                ? 'bg-purple-600 text-white font-semibold'
                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/30'
            }`}
          >
            Figures & Archive ({nodes.filter((n) => n.category === 'figure' || n.category === 'submission').length})
          </button>
        </div>

        {/* Tree Indentation Level Legend */}
        <div className="hidden xl:flex items-center gap-2 text-[10px] text-muted-custom font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-primary" /> Genesis (L0)
          </span>
          <span className="text-muted-custom opacity-40">•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Uploads (L1)
          </span>
          <span className="text-muted-custom opacity-40">•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Processing (L2)
          </span>
          <span className="text-muted-custom opacity-40">•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Figures (L3)
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: Scientific Lineage Graph with Hierarchy Indentation */}
        <div className="flex-1 w-full space-y-3">
          <Card
            title="Experimental Lineage & Processing Chain"
            subtitle="Step-by-step cryptographic lineage structured by acquisition tier and data upload lineage"
          >
            <div className="relative pl-4 sm:pl-6 space-y-4 before:absolute before:left-2 sm:before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-subtle">
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const config = getNodeConfig(node.category);

                return (
                  <div key={node.id} className={`relative transition-all duration-150 ${config.indentClass}`}>
                    {/* Branch connector indicator for indented sub-chains */}
                    {config.isSubBranch && (
                      <div className="absolute -left-5 sm:-left-6 top-3 text-muted-custom flex items-center pointer-events-none">
                        <CornerDownRight className="w-3.5 h-3.5 text-muted-custom" />
                      </div>
                    )}

                    {/* Bullet marker on vertical timeline */}
                    <div
                      className={`absolute -left-4 sm:-left-6 top-3 w-4 h-4 rounded-full border-2 bg-surface flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-accent-primary bg-accent-primary text-white scale-110 shadow-xs'
                          : 'border-subtle text-muted-custom'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : config.level === 0 ? 'bg-primary-custom' : 'bg-muted-custom'
                        }`}
                      />
                    </div>

                    {/* Node Card with Tier-specific Left Border and Tint */}
                    <div
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded border transition-all cursor-pointer ${config.cardBorder} ${
                        isSelected
                          ? 'ring-2 ring-accent-primary shadow-sm bg-surface-elevated'
                          : 'hover:shadow-xs hover:border-default'
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded border border-subtle shrink-0 mt-0.5 ${config.iconBg}`}>
                            {getNodeIcon(node.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`font-semibold text-xs sm:text-sm ${config.textColor}`}>
                                {node.label}
                              </h4>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border font-mono tracking-wider ${config.badgeClass}`}
                              >
                                {config.badgeLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-custom">
                              <span className="font-mono font-medium text-primary-custom">ID: {node.id}</span>
                              <span>•</span>
                              <span>Record: <strong className="font-mono text-primary-custom">{node.recordId}</strong></span>
                              {node.details.operator && (
                                <>
                                  <span>•</span>
                                  <span>Op: {node.details.operator}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 mt-1 sm:mt-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-subtle">
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Sealed & Verified
                          </span>
                          <div className="text-[10px] text-muted-custom font-mono">
                            {formatDate(node.timestamp)}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-primary-custom text-xs mt-2.5 leading-relaxed bg-surface/60 p-2 rounded border border-subtle">
                        {node.details.description}
                      </p>

                      {/* Parameters / Hash Preview if present */}
                      {node.details.parameters && Object.keys(node.details.parameters).length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase text-muted-custom flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" /> Params:
                          </span>
                          {Object.entries(node.details.parameters).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-surface-elevated text-primary-custom rounded text-[10px] font-mono border border-subtle"
                            >
                              <span className="text-muted-custom">{k}:</span>
                              <span className="font-medium text-primary-custom">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="mt-2.5 pt-2 border-t border-subtle flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-mono text-muted-custom text-[10px]">
                          {node.details.outputHash ? (
                            <span>Hash: <strong className="text-primary-custom">{node.details.outputHash.slice(0, 22)}...</strong></span>
                          ) : (
                            <span>Hardware Telemetry Ledger Entry</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewEvidence(node.recordId);
                          }}
                          className="text-accent-primary hover:underline font-mono font-semibold flex items-center gap-1 cursor-pointer bg-surface-elevated px-2 py-0.5 rounded border border-subtle hover:bg-surface"
                        >
                          <ShieldCheck className="w-3 h-3 text-accent-primary" /> Inspect CooL Receipt →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Selected Node Detailed Inspector */}
        <div className="w-full lg:w-96 shrink-0 sticky top-20">
          {selectedNode ? (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-accent-primary" />
                  <span>Lineage Node Audit Inspector</span>
                </div>
              }
              subtitle={selectedNode.label}
            >
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-muted-custom block text-[11px] mb-0.5">Stage Classification</span>
                  <Badge variant="secondary" className="font-mono">
                    {selectedNode.category.toUpperCase().replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <span className="text-muted-custom block text-[11px] mb-0.5">Timestamp (UTC Recorded)</span>
                  <div className="font-mono text-primary-custom font-medium">
                    {formatDate(selectedNode.timestamp)}
                  </div>
                </div>

                <div>
                  <span className="text-muted-custom block text-[11px] mb-0.5">Cryptographic Evidence Receipt</span>
                  <button
                    type="button"
                    onClick={() => onViewEvidence(selectedNode.recordId)}
                    className="font-mono font-bold text-accent-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{selectedNode.recordId}</span>
                    <span className="text-[10px] text-accent-primary">(View Receipt)</span>
                  </button>
                </div>

                {selectedNode.details.operator && (
                  <div>
                    <span className="text-muted-custom block text-[11px] mb-0.5">Operator / Instrument</span>
                    <span className="text-primary-custom font-medium">{selectedNode.details.operator}</span>
                  </div>
                )}

                {selectedNode.details.software && (
                  <div>
                    <span className="text-muted-custom block text-[11px] mb-0.5">Execution Agent / Software</span>
                    <span className="font-mono text-primary-custom">{selectedNode.details.software}</span>
                  </div>
                )}

                {selectedNode.details.outputHash && (
                  <div>
                    <span className="text-muted-custom block text-[11px] mb-0.5">Sealed Output Multihash</span>
                    <MonospaceHash value={selectedNode.details.outputHash} truncate={false} className="w-full justify-between" />
                  </div>
                )}

                {selectedNode.details.parameters && Object.keys(selectedNode.details.parameters).length > 0 && (
                  <div className="p-3 bg-surface-elevated rounded border border-subtle space-y-1.5">
                    <span className="text-primary-custom font-semibold block text-[11px] border-b border-subtle pb-1">
                      Recorded Parameters
                    </span>
                    {Object.entries(selectedNode.details.parameters).map(([key, val]) => (
                      <div key={key} className="flex justify-between font-mono text-[11px]">
                        <span className="text-muted-custom">{key}:</span>
                        <span className="text-primary-custom font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-subtle">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => onViewEvidence(selectedNode.recordId)}
                    icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  >
                    Open Sealed Evidence Receipt
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card title="Lineage Node Details">
              <div className="text-xs text-muted-custom py-6 text-center">
                Select a lineage node on the left to inspect cryptographic properties.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
