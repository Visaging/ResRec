import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { MonospaceHash } from '../common/MonospaceHash';
import { EvidenceReceiptInspector } from './EvidenceReceiptInspector';
import { appState } from '../../services/api';
import type { Experiment, EvidenceRecord } from '../../types';
import { formatDate } from '../../lib/utils';

interface EvidenceTabProps {
  experiment: Experiment;
  initialSelectedEvidenceId?: string | null;
}

export const EvidenceTab: React.FC<EvidenceTabProps> = ({
  experiment,
  initialSelectedEvidenceId,
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>(
    appState.getEvidenceRecords(experiment.id)
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(initialSelectedEvidenceId || null);

  useEffect(() => {
    return appState.subscribe(() => {
      setEvidenceList(appState.getEvidenceRecords(experiment.id));
    });
  }, [experiment.id]);

  const selectedRecord = selectedRecordId ? appState.getEvidenceRecord(selectedRecordId) || null : null;

  return (
    <div className="space-y-6 animate-subtle-fade">
      <Card
        title="Cryptographic Evidence Registry"
        subtitle={`Immutable sequence of signed execution receipts for ${experiment.id}`}
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-primary-custom">
            <thead className="bg-surface-elevated text-muted-custom font-medium border-b border-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">Record ID</th>
                <th className="px-4 py-3 font-semibold">Event Type</th>
                <th className="px-4 py-3 font-semibold">Sequence</th>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Payload Summary</th>
                <th className="px-4 py-3 font-semibold">Signer / Agent</th>
                <th className="px-4 py-3 font-semibold text-right">Receipt Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {evidenceList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-custom">
                    <div className="text-xs font-semibold text-primary-custom">No evidence records registered yet</div>
                    <div className="text-[11px] text-muted-custom mt-1">
                      Evidence receipts will be generated automatically as measurements are recorded or datasets finalized.
                    </div>
                  </td>
                </tr>
              ) : (
                evidenceList.map((rec) => (
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
                    <td className="px-4 py-3 font-mono font-bold text-primary-custom">
                      #{rec.sequence}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-custom whitespace-nowrap">
                      {formatDate(rec.issuedAt)}
                    </td>
                    <td className="px-4 py-3 text-primary-custom max-w-xs truncate text-[11px]">
                      {rec.payloadSummary}
                    </td>
                    <td className="px-4 py-3 text-muted-custom text-[11px] truncate max-w-[120px]">
                      {rec.softwareIdentity.name}
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
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
