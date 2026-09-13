import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { SearchFilterBar, type FilterGroup } from '../common/SearchFilterBar';
import { formatDate } from '../../lib/utils';

interface AuditLogPageProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onViewEvidence: (evidenceId: string) => void;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ onNavigate, onViewEvidence }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const auditEvents = [
    {
      id: 'AUD-9012',
      timestamp: '2026-09-13T15:30:00Z',
      action: 'verification.executed',
      actor: 'Nature Battery Reviewer Node #3',
      target: 'EXP-2026-0042',
      receiptId: 'REC-7F82-110C',
      status: 'success',
      details: 'Automated cryptographic integrity check passed (6/6 checks valid).',
    },
    {
      id: 'AUD-9011',
      timestamp: '2026-09-13T14:45:10Z',
      action: 'measurement.corrected',
      actor: 'Dr. Elena Vance',
      target: 'EXP-2026-0042',
      receiptId: 'REC-C991-0049',
      status: 'success',
      details: 'Cycle #14 resistance reading corrected from 38.2 to 28.2 mΩ (thermocouple recalibrated).',
    },
    {
      id: 'AUD-9010',
      timestamp: '2026-09-13T14:10:00Z',
      action: 'dataset.sealed',
      actor: 'Dr. Elena Vance',
      target: 'EXP-2026-0042',
      receiptId: 'REC-7F82-110C',
      status: 'success',
      details: 'Dataset thermal-cycling-042.csv sealed with SHA-256 CooL multihash.',
    },
    {
      id: 'AUD-9009',
      timestamp: '2026-09-13T10:00:00Z',
      action: 'experiment.created',
      actor: 'Dr. Elena Vance',
      target: 'EXP-2026-0042',
      receiptId: 'REC-4B21-0001',
      status: 'success',
      details: 'New experiment record initialized under DOE Grant #DE-EE0009842.',
    },
    {
      id: 'AUD-9008',
      timestamp: '2026-09-12T18:02:11Z',
      action: 'verification.executed',
      actor: 'Stanford Institutional Auditor',
      target: 'EXP-2026-0039',
      receiptId: 'REC-B441-0021',
      status: 'success',
      details: 'Independent audit confirmed zero post-recording alterations.',
    },
    {
      id: 'AUD-9007',
      timestamp: '2026-09-12T16:20:00Z',
      action: 'submission.sealed',
      actor: 'Prof. Arthur Sterling',
      target: 'SUB-2026-NMAT-0042',
      receiptId: 'REC-F912-0051',
      status: 'success',
      details: 'Research submission package signed with institutional DID key.',
    },
  ];

  const filterGroups: FilterGroup[] = [
    {
      id: 'action',
      label: 'Event Action',
      selectedValue: actionFilter,
      onChange: setActionFilter,
      options: [
        { label: 'All Actions', value: 'all' },
        { label: 'verification.executed', value: 'verification.executed' },
        { label: 'measurement.corrected', value: 'measurement.corrected' },
        { label: 'dataset.sealed', value: 'dataset.sealed' },
        { label: 'experiment.created', value: 'experiment.created' },
        { label: 'submission.sealed', value: 'submission.sealed' },
      ],
    },
  ];

  const filtered = auditEvents.filter((ev) => {
    const matchesSearch =
      ev.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || ev.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-5 animate-subtle-fade">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-custom">
            Institutional Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-muted-custom mt-1">
            Complete institutional audit trail of all research modifications, corrections, receipts, and compliance queries.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => alert('Audit log exported to institutional compliance CSV.')}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Export Compliance Log
        </Button>
      </div>

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search audit ID, actor, target, or details..."
        filterGroups={filterGroups}
      />

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-custom">
            <thead className="bg-surface-elevated text-muted-custom font-medium border-b border-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">Audit Event ID</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Target Entity</th>
                <th className="px-4 py-3 font-semibold">Details</th>
                <th className="px-4 py-3 font-semibold text-right">Evidence Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-primary-custom">
                    {item.id}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {item.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-custom whitespace-nowrap">
                    {formatDate(item.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary-custom whitespace-nowrap">
                    {item.actor}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <button
                      type="button"
                      onClick={() => onNavigate('experiment-detail', { id: item.target })}
                      className="text-accent-primary hover:underline"
                    >
                      {item.target}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-custom max-w-md">
                    {item.details}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onViewEvidence(item.receiptId)}
                      className="font-mono font-bold text-accent-primary hover:underline text-xs"
                    >
                      {item.receiptId}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
