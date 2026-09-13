import React, { useState, useEffect } from 'react';
import { Plus, FlaskConical, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { SearchFilterBar, type FilterGroup } from '../common/SearchFilterBar';
import { EmptyState } from '../common/EmptyState';
import { appState } from '../../services/api';
import type { Experiment } from '../../types';
import { formatDate } from '../../lib/utils';

interface ExperimentListProps {
  onNavigate: (route: string, params?: Record<string, string>) => void;
  onOpenNewExperiment: () => void;
  onOpenImportDataset?: () => void;
}

export const ExperimentList: React.FC<ExperimentListProps> = ({
  onNavigate,
  onOpenNewExperiment,
}) => {
  const [experiments, setExperiments] = useState<Experiment[]>(appState.getExperiments());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [researcherFilter, setResearcherFilter] = useState('all');
  const [isTampered, setIsTampered] = useState<boolean>(appState.getIsTamperSimulated());

  useEffect(() => {
    return appState.subscribe(() => {
      setExperiments(appState.getExperiments());
      setIsTampered(appState.getIsTamperSimulated());
    });
  }, []);

  const uniqueResearchers = Array.from(new Set(experiments.map((e) => e.principalInvestigator)));

  const filterGroups: FilterGroup[] = [
    {
      id: 'status',
      label: 'Status',
      selectedValue: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Integrity Issue', value: 'integrity_issue' },
      ],
    },
    {
      id: 'researcher',
      label: 'PI',
      selectedValue: researcherFilter,
      onChange: setResearcherFilter,
      options: [
        { label: 'All Investigators', value: 'all' },
        ...uniqueResearchers.map((r) => ({ label: r, value: r })),
      ],
    },
  ];

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch =
      exp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.principalInvestigator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.sample.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    const matchesResearcher =
      researcherFilter === 'all' || exp.principalInvestigator === researcherFilter;

    return matchesSearch && matchesStatus && matchesResearcher;
  });

  return (
    <div className="space-y-5 animate-subtle-fade">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-custom">
            Experiment Registry
          </h1>
          <p className="text-xs sm:text-sm text-muted-custom mt-1">
            Institutional ledger of experimental protocols, physical sensor runs, and sealed evidence receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewExperiment}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Experiment
          </Button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search experiment ID, title, PI, or sample..."
        filterGroups={filterGroups}
      />

      {/* Experiments List / Table */}
      {filteredExperiments.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No experiments found"
          description="No experiments match your search or active filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setResearcherFilter('all');
          }}
        />
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-primary-custom">
              <thead className="bg-surface-elevated text-muted-custom font-medium border-b border-subtle">
                <tr>
                  <th className="px-4 py-3 font-semibold">Experiment ID</th>
                  <th className="px-4 py-3 font-semibold">Title & Protocol</th>
                  <th className="px-4 py-3 font-semibold">Principal Investigator</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Records</th>
                  <th className="px-4 py-3 font-semibold">Last Updated</th>
                  <th className="px-4 py-3 font-semibold text-right">Integrity</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filteredExperiments.map((exp) => {
                  const hasTamper = isTampered && exp.id === 'EXP-2026-0042';

                  return (
                    <tr
                      key={exp.id}
                      onClick={() => onNavigate('experiment-detail', { id: exp.id })}
                      className="hover:bg-surface-elevated transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-primary-custom whitespace-nowrap">
                        <span className="bg-surface-inset px-2 py-0.5 rounded border border-subtle">
                          {exp.id}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-primary-custom group-hover:text-accent-primary transition-colors truncate">
                          {exp.title}
                        </div>
                        <div className="text-[11px] text-muted-custom truncate mt-0.5">
                          Sample: {exp.sample}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-primary-custom">{exp.principalInvestigator}</div>
                        <div className="text-[11px] text-muted-custom">{exp.researchGroup}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant={hasTamper ? 'integrity_issue' : exp.status}>
                            {(hasTamper ? 'INTEGRITY MISMATCH' : exp.status).toUpperCase()}
                          </Badge>
                          {exp.correctionsCount > 0 && (
                            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-medium">
                              {exp.correctionsCount} correction{exp.correctionsCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center font-mono text-muted-custom whitespace-nowrap">
                        {exp.recordCount}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-muted-custom whitespace-nowrap">
                        {formatDate(exp.updatedAt)}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {hasTamper ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-rose-700 dark:text-rose-400 font-bold bg-danger-surface px-2 py-0.5 rounded border border-danger-border">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> MISMATCH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 dark:text-emerald-400 font-medium bg-success-surface px-2 py-0.5 rounded border border-success-border">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> VERIFIED
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right text-muted-custom">
                        <ChevronRight className="w-4 h-4 inline group-hover:text-primary-custom group-hover:translate-x-0.5 transition-transform" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
