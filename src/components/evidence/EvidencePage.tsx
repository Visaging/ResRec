import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { MonospaceHash } from '../common/MonospaceHash';
import { SearchFilterBar, type FilterGroup } from '../common/SearchFilterBar';
import { EvidenceReceiptInspector } from './EvidenceReceiptInspector';
import { appState } from '../../services/api';
import type { EvidenceRecord } from '../../types';
import { formatDate } from '../../lib/utils';

interface EvidencePageProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
  initialSelectedEvidenceId?: string | null;
}

export const EvidencePage: React.FC<EvidencePageProps> = ({
  onNavigate,
  initialSelectedEvidenceId,
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>(appState.getEvidenceRecords());
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(initialSelectedEvidenceId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  useEffect(() => {
    return appState.subscribe(() => {
      setEvidenceList(appState.getEvidenceRecords());
    });
  }, []);

  const selectedRecord = selectedRecordId ? appState.getEvidenceRecord(selectedRecordId) || null : null;

  const filterGroups: FilterGroup[] = [
    {
      id: 'eventType',
      label: 'Event Type',
      selectedValue: eventTypeFilter,
      onChange: setEventTypeFilter,
      options: [
        { label: 'All Events', value: 'all' },
        { label: 'measurement.recorded', value: 'measurement.recorded' },
        { label: 'measurement.corrected', value: 'measurement.corrected' },
        { label: 'dataset.finalized', value: 'dataset.finalized' },
        { label: 'pipeline.executed', value: 'pipeline.executed' },
        { label: 'provenance.sealed', value: 'provenance.sealed' },
      ],
    },
  ];

  const filtered = evidenceList.filter((e) => {
    const matchesSearch =
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.experimentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.payloadSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.signerIdentity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = eventTypeFilter === 'all' || e.eventType === eventTypeFilter;
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="space-y-5 animate-subtle-fade">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-custom">
            Cryptographic Evidence Registry
          </h1>
          <p className="text-xs sm:text-sm text-muted-custom mt-1">
            Global ledger of cryptographic receipts, software agent signatures, and transparency log commitments.
          </p>
        </div>
        <div className="text-xs font-mono text-muted-custom bg-surface px-3 py-1.5 rounded border border-subtle">
          Total Receipts: <span className="font-bold text-primary-custom">{evidenceList.length + 1836}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search record ID, experiment, signer DID, or summary..."
        filterGroups={filterGroups}
      />

      {/* Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-custom">
            <thead className="bg-surface-elevated text-muted-custom font-medium border-b border-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">Record ID</th>
                <th className="px-4 py-3 font-semibold">Event Type</th>
                <th className="px-4 py-3 font-semibold">Experiment</th>
                <th className="px-4 py-3 font-semibold">Sequence</th>
                <th className="px-4 py-3 font-semibold">Issued At</th>
                <th className="px-4 py-3 font-semibold">Payload Summary</th>
                <th className="px-4 py-3 font-semibold">Signer DID</th>
                <th className="px-4 py-3 font-semibold text-right">Receipt Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filtered.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-surface-elevated transition-colors cursor-pointer group"
                  onClick={() => setSelectedRecordId(rec.id)}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-primary-custom">
                    <MonospaceHash value={rec.id} startLen={6} endLen={6} />
                  </td>

                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {rec.eventType}
                    </Badge>
                  </td>

                  <td className="px-4 py-3 font-mono">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('experiment-detail', { id: rec.experimentId });
                      }}
                      className="text-accent-primary hover:underline font-semibold"
                    >
                      {rec.experimentId}
                    </button>
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-primary-custom">
                    #{rec.sequence}
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px] text-muted-custom whitespace-nowrap">
                    {formatDate(rec.issuedAt)}
                  </td>

                  <td className="px-4 py-3 text-primary-custom max-w-xs truncate text-[11px]">
                    {rec.payloadSummary}
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px] text-muted-custom truncate max-w-[140px]">
                    {rec.signerIdentity}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecordId(rec.id);
                      }}
                      className="inline-flex items-center gap-1 text-accent-primary hover:underline font-medium text-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedRecord && (
        <EvidenceReceiptInspector
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecordId(null)}
          evidenceRecord={selectedRecord}
        />
      )}
    </div>
  );
};
