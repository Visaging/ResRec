// Research Integrity Overview Dashboard - Complete Visual Redesign V3

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  PageHeader,
  Card,
  Section,
  StatusBadge,
  VerificationIcon,
  Skeleton,
} from "@/components/ui";
import type {
  DashboardMetrics,
  Experiment,
  EvidenceRecord,
  ResearchSubmission,
} from "@/types";
import {
  getDashboardMetrics,
  getExperiments,
  getRecentActivity,
  getSubmissions,
} from "@/services/api";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle, ArrowRight, FlaskConical } from "lucide-react";

// Semi-circular gauge. Arc length of a semicircle is PI * r, not 2 * PI * r —
// using the full-circle circumference makes the arc fill only half its range.
const GAUGE_RADIUS = 80;
const GAUGE_LENGTH = Math.PI * GAUGE_RADIUS;
const GAUGE_PATH = `M 10,90 A ${GAUGE_RADIUS},${GAUGE_RADIUS} 0 0,1 170,90`;

function IntegrityHealthGauge({ percentage }: { percentage: number }) {
  const offset = GAUGE_LENGTH - (percentage / 100) * GAUGE_LENGTH;
  const tone =
    percentage >= 99
      ? "var(--color-success)"
      : percentage >= 95
      ? "var(--color-warning)"
      : "var(--color-error)";

  return (
    <div className="relative w-full max-w-[280px]">
      <svg
        viewBox="0 0 180 100"
        className="w-full"
        role="img"
        aria-label={`${percentage} percent of evidence records verified`}
      >
        <path
          d={GAUGE_PATH}
          stroke="var(--color-surface-sunken)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        <motion.path
          d={GAUGE_PATH}
          stroke={tone}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={GAUGE_LENGTH}
          initial={{ strokeDashoffset: GAUGE_LENGTH }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-4xl font-semibold text-ink tabular-nums-sm"
        >
          {percentage}%
        </motion.div>
        <div className="text-xs text-ink-muted uppercase tracking-wide mt-1">
          Evidence Verified
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_DATA = [
  { name: "Mon", verified: 45, pending: 12, failed: 3 },
  { name: "Tue", verified: 52, pending: 8, failed: 1 },
  { name: "Wed", verified: 38, pending: 15, failed: 4 },
  { name: "Thu", verified: 61, pending: 5, failed: 2 },
  { name: "Fri", verified: 47, pending: 10, failed: 1 },
  { name: "Sat", verified: 29, pending: 20, failed: 3 },
  { name: "Sun", verified: 53, pending: 7, failed: 0 },
];

function VerificationActivityChart() {
  return (
    <div>
      <div className="h-[240px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ACTIVITY_DATA} barSize={18}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="var(--color-ink-faint)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              stroke="var(--color-ink-faint)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface-elevated)" }}
              contentStyle={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 0,
                fontSize: 12,
                color: "var(--color-ink)",
              }}
            />
            <Bar dataKey="verified" stackId="a" fill="var(--color-success)" />
            <Bar dataKey="pending" stackId="a" fill="var(--color-warning)" />
            <Bar dataKey="failed" stackId="a" fill="var(--color-error)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-ink-muted">
        <span>Last 7 days</span>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-success" />
            Verified
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-warning" />
            Pending
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-error" />
            Failed
          </span>
        </div>
      </div>
    </div>
  );
}

interface StatsProps {
  metrics: DashboardMetrics;
  submissionCount: number;
  lastAuditAt?: string;
}

function ResearchStatsGrid({ metrics, submissionCount, lastAuditAt }: StatsProps) {
  const verificationRate =
    metrics.evidenceRecords > 0
      ? Math.round(
          ((metrics.evidenceRecords - metrics.verificationIssues) /
            metrics.evidenceRecords) *
            100
        )
      : 100;

  const rows: { label: string; value: string; tone?: string }[] = [
    { label: "Active experiments", value: metrics.activeExperiments.toLocaleString() },
    { label: "Datasets", value: metrics.datasets.toLocaleString() },
    { label: "Evidence records", value: metrics.evidenceRecords.toLocaleString() },
    { label: "Submissions", value: submissionCount.toLocaleString() },
    {
      label: "Verification rate",
      value: `${verificationRate}%`,
      tone: verificationRate === 100 ? "text-success" : "text-warning",
    },
    {
      label: "Open issues",
      value: metrics.verificationIssues.toLocaleString(),
      tone: metrics.verificationIssues > 0 ? "text-error" : "text-ink",
    },
    {
      label: "Last audit",
      value: lastAuditAt ? formatDateTime(lastAuditAt) : "—",
    },
  ];

  return (
    <dl className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between py-2.5">
          <dt className="text-sm text-ink-muted">{row.label}</dt>
          <dd className={`text-sm font-medium tabular-nums-sm ${row.tone ?? "text-ink"}`}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EvidenceTimeline({ activity }: { activity: EvidenceRecord[] }) {
  if (activity.length === 0) {
    return (
      <p className="text-sm text-ink-muted py-8 text-center">
        No evidence has been recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border ml-1.5">
      {activity.map((record, index) => (
        <motion.li
          key={record.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.06 }}
          className="relative pl-6 pb-5 last:pb-0"
        >
          <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-primary" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                {record.eventType.replace(/\./g, " ")}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 font-mono">
                {record.experimentId} · seq {record.sequence}
              </p>
            </div>
            <time className="text-xs text-ink-faint whitespace-nowrap">
              {formatDateTime(record.issuedAt)}
            </time>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <VerificationIcon status={record.signatureVerification} animate={false} />
            <span className="text-xs text-ink-muted">
              signature {record.signatureVerification.replace(/_/g, " ")}
            </span>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentExperiments, setRecentExperiments] = useState<Experiment[]>([]);
  const [recentActivity, setRecentActivity] = useState<EvidenceRecord[]>([]);
  const [submissions, setSubmissions] = useState<ResearchSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, experimentsData, activityData, submissionsData] =
          await Promise.all([
            getDashboardMetrics(),
            getExperiments(),
            getRecentActivity(),
            getSubmissions(),
          ]);
        setMetrics(metricsData);
        setRecentExperiments(experimentsData.slice(0, 5));
        setRecentActivity(activityData);
        setSubmissions(submissionsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !metrics) {
    return (
      <div>
        <PageHeader
          title="Research Integrity Overview"
          subtitle="Evidence, provenance and verification across the research portfolio."
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 lg:col-span-1">
            <Skeleton className="h-[200px] w-full" />
          </Card>
          <Card className="p-6 lg:col-span-2">
            <Skeleton className="h-[200px] w-full" />
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Skeleton className="h-[240px] w-full" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-[240px] w-full" />
          </Card>
        </div>
      </div>
    );
  }

  const integrityPercentage =
    metrics.evidenceRecords > 0
      ? Math.round(
          ((metrics.evidenceRecords - metrics.verificationIssues) /
            metrics.evidenceRecords) *
            100
        )
      : 100;

  const lastAuditAt = recentActivity[0]?.issuedAt;

  return (
    <div>
      <PageHeader
        title="Research Integrity Overview"
        subtitle="Evidence, provenance and verification across the research portfolio."
        badge={
          metrics.verificationIssues > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-error/25 bg-error/10 text-error">
              <AlertTriangle className="w-3.5 h-3.5" />
              {metrics.verificationIssues} open{" "}
              {metrics.verificationIssues === 1 ? "issue" : "issues"}
            </span>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 flex flex-col items-center justify-center">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-4 self-start">
            Integrity Health
          </h2>
          <IntegrityHealthGauge percentage={integrityPercentage} />
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-4">
            Verification Activity
          </h2>
          <VerificationActivityChart />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
            Research Portfolio
          </h2>
          <ResearchStatsGrid
            metrics={metrics}
            submissionCount={submissions.length}
            lastAuditAt={lastAuditAt}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-4">
            Recent Evidence Activity
          </h2>
          <EvidenceTimeline activity={recentActivity} />
        </Card>
      </div>

      <Section
        title="Recent Experiments"
        action={
          <Link
            href="/experiments"
            className="text-sm text-primary hover:text-primary-hover inline-flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <Card className="p-0 overflow-hidden">
          {recentExperiments.length === 0 ? (
            <p className="text-sm text-ink-muted py-10 text-center">
              No experiments recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentExperiments.map((exp, index) => (
                <motion.li
                  key={exp.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    href={`/experiments/${exp.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-elevated transition-colors"
                  >
                    <FlaskConical className="w-4 h-4 text-ink-faint flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-ink-muted">{exp.id}</p>
                      <p className="text-sm font-medium text-ink truncate">{exp.title}</p>
                    </div>
                    <span className="text-sm text-ink-muted hidden md:block">
                      {exp.researcher}
                    </span>
                    <span className="text-sm text-ink-muted tabular-nums-sm hidden sm:block">
                      {exp.evidenceCount} records
                    </span>
                    <StatusBadge status={exp.status} />
                    <VerificationIcon status={exp.integrityStatus} animate={false} />
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </Section>
    </div>
  );
}
