import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { Measurement } from '../../types';
import { useTheme } from '../../context/useTheme';

interface MeasurementChartProps {
  measurements: Measurement[];
  parameter: string;
  unit: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  parameter: string;
  unit: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, parameter, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface border border-default shadow-elevated p-2.5 rounded text-xs font-mono text-primary-custom">
        <div className="text-primary-custom font-sans font-semibold border-b border-subtle pb-1 mb-1">
          Trial {data.trialNum}
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-custom">{parameter}:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {data.value} {unit}
          </span>
        </div>
        {data.secondary !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-custom">Resistance:</span>
            <span className="text-primary-custom">{data.secondary} mΩ</span>
          </div>
        )}
        {data.isCorrected && (
          <div className="text-amber-600 dark:text-amber-400 text-[10px] mt-1 pt-1 border-t border-subtle font-sans">
            * Corrected with calibration audit trail
          </div>
        )}
        <div className="text-muted-custom text-[9px] mt-1 pt-0.5 border-t border-subtle truncate max-w-[200px]">
          Receipt: {data.receipt}
        </div>
      </div>
    );
  }
  return null;
};

export const MeasurementChart: React.FC<MeasurementChartProps> = ({
  measurements,
  parameter,
  unit,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = measurements.map((m) => ({
    trial: `T-${m.trialNumber}`,
    trialNum: m.trialNumber,
    value: m.value,
    secondary: m.secondaryValue,
    isCorrected: m.status === 'corrected',
    receipt: m.evidenceId,
    timestamp: m.timestamp,
  }));

  if (!measurements || measurements.length === 0) {
    return (
      <div className="w-full h-44 bg-surface-inset p-4 rounded border border-subtle flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold text-primary-custom">No telemetry data available for {parameter}</span>
        <span className="text-[11px] text-muted-custom mt-1">Record the first measurement trial to populate continuous sensor curves.</span>
      </div>
    );
  }

  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDark ? '#475569' : '#cbd5e1';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const lineColor = isDark ? '#38bdf8' : '#0f2b48';

  return (
    <div className="w-full h-64 bg-surface p-3 rounded border border-default shadow-card">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-primary-custom">
          Continuous In-situ {parameter} Curve
        </span>
        <div className="flex items-center gap-4 text-[11px] text-muted-custom font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 inline-block" style={{ backgroundColor: lineColor }} /> Measured {unit}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Corrected Point
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" stroke={gridStroke} />
          <XAxis
            dataKey="trial"
            tick={{ fontSize: 10, fill: tickColor, fontFamily: 'IBM Plex Mono' }}
            stroke={axisStroke}
          />
          <YAxis
            tick={{ fontSize: 10, fill: tickColor, fontFamily: 'IBM Plex Mono' }}
            stroke={axisStroke}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip parameter={parameter} unit={unit} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.isCorrected) {
                return (
                  <circle
                    key={`dot-${props.key}`}
                    cx={cx}
                    cy={cy}
                    r={4.5}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                );
              }
              return (
                <circle
                  key={`dot-${props.key}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={lineColor}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
