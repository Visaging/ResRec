// Interactive Provenance Graph - scientific lineage visualization - V3 Redesign

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageHeader,
  Card,
  Select,
  Button,
  VerificationIcon,
  Skeleton,
} from "@/components/ui";
import { formatDateTime, formatDateTimeFull } from "@/lib/utils";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  GitBranch,
  Database,
  FlaskConical,
  FileText,
  Activity,
} from "lucide-react";

type NodeType = "experiment" | "measurement" | "dataset" | "analysis" | "evidence";

interface ProvenanceNode {
  id: string;
  type: NodeType;
  label: string;
  timestamp: string;
  metadata: Record<string, string>;
  verified: boolean;
  x: number;
  y: number;
}

interface ProvenanceEdge {
  from: string;
  to: string;
  label: string;
}

// Mock provenance data
const mockNodes: ProvenanceNode[] = [
  {
    id: "exp-042",
    type: "experiment",
    label: "EXP-2026-0042",
    timestamp: "2026-09-01T08:00:00Z",
    metadata: {
      title: "Lithium-Ion Battery Thermal Cycling",
      researcher: "Dr. Sarah Chen",
    },
    verified: true,
    x: 200,
    y: 100,
  },
  {
    id: "meas-001",
    type: "measurement",
    label: "Trial 1",
    timestamp: "2026-09-01T09:15:00Z",
    metadata: {
      temperature: "25°C",
      sequence: "1",
    },
    verified: true,
    x: 100,
    y: 250,
  },
  {
    id: "meas-002",
    type: "measurement",
    label: "Trial 2",
    timestamp: "2026-09-01T10:30:00Z",
    metadata: {
      temperature: "45°C",
      sequence: "2",
    },
    verified: true,
    x: 200,
    y: 250,
  },
  {
    id: "meas-003",
    type: "measurement",
    label: "Trial 3",
    timestamp: "2026-09-01T11:45:00Z",
    metadata: {
      temperature: "65°C",
      sequence: "3",
    },
    verified: true,
    x: 300,
    y: 250,
  },
  {
    id: "dataset-v1",
    type: "dataset",
    label: "thermal-cycling-042 v1",
    timestamp: "2026-09-01T14:00:00Z",
    metadata: {
      records: "3",
      status: "finalized",
    },
    verified: true,
    x: 200,
    y: 400,
  },
  {
    id: "meas-004",
    type: "measurement",
    label: "Trial 4 (corrected)",
    timestamp: "2026-09-02T09:00:00Z",
    metadata: {
      temperature: "85°C",
      sequence: "4",
      correction: "true",
    },
    verified: false,
    x: 400,
    y: 250,
  },
  {
    id: "dataset-v2",
    type: "dataset",
    label: "thermal-cycling-042 v2",
    timestamp: "2026-09-02T11:00:00Z",
    metadata: {
      records: "4",
      status: "finalized",
    },
    verified: false,
    x: 350,
    y: 400,
  },
  {
    id: "analysis-001",
    type: "analysis",
    label: "Statistical Analysis",
    timestamp: "2026-09-02T15:00:00Z",
    metadata: {
      method: "Linear Regression",
      confidence: "95%",
    },
    verified: false,
    x: 350,
    y: 550,
  },
  {
    id: "evidence-001",
    type: "evidence",
    label: "REC-91A2C847",
    timestamp: "2026-09-02T15:30:00Z",
    metadata: {
      commitment: "7f3a91bd...",
      verified: "false",
    },
    verified: false,
    x: 350,
    y: 700,
  },
];

const mockEdges: ProvenanceEdge[] = [
  { from: "exp-042", to: "meas-001", label: "recorded" },
  { from: "exp-042", to: "meas-002", label: "recorded" },
  { from: "exp-042", to: "meas-003", label: "recorded" },
  { from: "meas-001", to: "dataset-v1", label: "included in" },
  { from: "meas-002", to: "dataset-v1", label: "included in" },
  { from: "meas-003", to: "dataset-v1", label: "included in" },
  { from: "exp-042", to: "meas-004", label: "recorded" },
  { from: "meas-004", to: "dataset-v2", label: "included in" },
  { from: "dataset-v1", to: "dataset-v2", label: "superseded by" },
  { from: "dataset-v2", to: "analysis-001", label: "analyzed" },
  { from: "analysis-001", to: "evidence-001", label: "generated" },
];

function NodeIcon({ type }: { type: NodeType }) {
  const iconProps = { className: "w-4 h-4", strokeWidth: 2 };

  switch (type) {
    case "experiment":
      return <FlaskConical {...iconProps} />;
    case "measurement":
      return <Activity {...iconProps} />;
    case "dataset":
      return <Database {...iconProps} />;
    case "analysis":
      return <GitBranch {...iconProps} />;
    case "evidence":
      return <FileText {...iconProps} />;
  }
}

function ProvenanceNode({
  node,
  isSelected,
  onClick,
  scale,
}: {
  node: ProvenanceNode;
  isSelected: boolean;
  onClick: () => void;
  scale: number;
}) {
  // SVG shapes are painted with fill/stroke, not Tailwind bg-*/border-*
  // utilities, so these are CSS variable references rather than classes.
  const colors: Record<string, { fill: string; stroke: string }> = {
    experiment: {
      fill: "color-mix(in srgb, var(--color-success) 12%, var(--color-surface))",
      stroke: "var(--color-success)",
    },
    measurement: {
      fill: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
      stroke: "var(--color-primary)",
    },
    dataset: {
      fill: "color-mix(in srgb, var(--color-warning) 12%, var(--color-surface))",
      stroke: "var(--color-warning)",
    },
    analysis: {
      fill: "color-mix(in srgb, var(--color-info) 12%, var(--color-surface))",
      stroke: "var(--color-info)",
    },
    evidence: {
      fill: "color-mix(in srgb, var(--color-error) 12%, var(--color-surface))",
      stroke: "var(--color-error)",
    },
  };

  const color = colors[node.type] ?? colors.experiment;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      {/* Selection ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.circle
            cx={node.x}
            cy={node.y}
            r={50 / scale}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={3 / scale}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Node circle */}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={40 / scale}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth={2 / scale}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.15 }}
      />

      {/* Verification indicator */}
      {!node.verified && (
        <circle
          cx={node.x + 25 / scale}
          cy={node.y - 25 / scale}
          r={8 / scale}
          fill="var(--color-error)"
          stroke="var(--color-background)"
          strokeWidth={2 / scale}
        />
      )}

      {/* Icon */}
      <foreignObject
        x={node.x - 8 / scale}
        y={node.y - 8 / scale}
        width={16 / scale}
        height={16 / scale}
        style={{ pointerEvents: "none" }}
      >
        <div style={{ color: "var(--color-ink)" }}>
          <NodeIcon type={node.type} />
        </div>
      </foreignObject>

      {/* Label */}
      <text
        x={node.x}
        y={node.y + 60 / scale}
        textAnchor="middle"
        fill="var(--color-ink)"
        fontSize={12 / scale}
        fontWeight="500"
        style={{ pointerEvents: "none" }}
      >
        {node.label}
      </text>
    </motion.g>
  );
}

function ProvenanceEdge({ edge, nodes, scale }: { edge: ProvenanceEdge; nodes: ProvenanceNode[]; scale: number }) {
  const fromNode = nodes.find((n) => n.id === edge.from);
  const toNode = nodes.find((n) => n.id === edge.to);

  if (!fromNode || !toNode) return null;

  // Calculate edge path with slight curve
  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;
  const offsetX = (toNode.y - fromNode.y) * 0.1;
  const offsetY = (fromNode.x - toNode.x) * 0.1;

  return (
    <g>
      {/* Animated path */}
      <motion.path
        d={`M ${fromNode.x} ${fromNode.y} Q ${midX + offsetX} ${midY + offsetY} ${toNode.x} ${toNode.y}`}
        fill="none"
        stroke="color-mix(in srgb, var(--color-border) 50%, transparent)"
        strokeWidth={2 / scale}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Arrowhead */}
      <motion.circle
        cx={toNode.x}
        cy={toNode.y}
        r={4 / scale}
        fill="var(--color-ink-muted)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
    </g>
  );
}

export default function ProvenancePage() {
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ProvenanceNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === "svg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Provenance Graph" />
        <Card className="p-8">
          <Skeleton className="h-[600px] w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Provenance Graph"
        subtitle="Interactive visualization of experimental lineage, dataset evolution, and evidence relationships."
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Graph Visualization */}
        <Card className="col-span-2 p-0 overflow-hidden relative">
          {/* Controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetView}
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" title="Export Graph">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* SVG Canvas */}
          <div className="bg-background h-[700px] overflow-hidden">
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Edges */}
                {mockEdges.map((edge, i) => (
                  <ProvenanceEdge
                    key={`${edge.from}-${edge.to}-${i}`}
                    edge={edge}
                    nodes={mockNodes}
                    scale={zoom}
                  />
                ))}

                {/* Nodes */}
                {mockNodes.map((node) => (
                  <ProvenanceNode
                    key={node.id}
                    node={node}
                    isSelected={selectedNode?.id === node.id}
                    onClick={() => setSelectedNode(node)}
                    scale={zoom}
                  />
                ))}
              </g>
            </svg>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-surface border border-border p-3">
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
              Node Types
            </p>
            <div className="space-y-1.5">
              {[
                { type: "experiment" as NodeType, label: "Experiment" },
                { type: "measurement" as NodeType, label: "Measurement" },
                { type: "dataset" as NodeType, label: "Dataset" },
                { type: "analysis" as NodeType, label: "Analysis" },
                { type: "evidence" as NodeType, label: "Evidence" },
              ].map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <NodeIcon type={item.type} />
                  </div>
                  <span className="text-xs text-ink">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Node Details Panel */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-ink mb-4">
            Node Details
          </h3>

          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Node Header */}
                <div className="pb-4 border-b border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-surface-elevated border border-border">
                      <NodeIcon type={selectedNode.type} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-ink-muted uppercase tracking-wide">
                        {selectedNode.type}
                      </p>
                      <p className="text-sm font-medium text-ink mt-0.5">
                        {selectedNode.label}
                      </p>
                    </div>
                    <VerificationIcon
                      status={selectedNode.verified ? "verified" : "failed"}
                      animate={false}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-3">
                    Metadata
                  </p>
                  <div className="space-y-2">
                    {Object.entries(selectedNode.metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-xs text-ink-faint capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <p className="text-sm text-ink mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timestamp */}
                <div>
                  <span className="text-xs text-ink-faint">Timestamp</span>
                  <p className="text-sm text-ink mt-0.5">
                    {formatDateTimeFull(selectedNode.timestamp)}
                  </p>
                </div>

                {/* Connections */}
                <div>
                  <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                    Connections
                  </p>
                  <div className="space-y-1.5">
                    {mockEdges
                      .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                      .map((edge, i) => {
                        const isOutgoing = edge.from === selectedNode.id;
                        const connectedId = isOutgoing ? edge.to : edge.from;
                        const connectedNode = mockNodes.find((n) => n.id === connectedId);

                        return (
                          <div
                            key={i}
                            className="text-xs text-ink-muted flex items-center gap-1.5"
                          >
                            <span className="text-xs text-ink-faint">
                              {isOutgoing ? "→" : "←"}
                            </span>
                            <span className="font-medium">{edge.label}</span>
                            <span className="text-xs text-ink-faint">
                              {connectedNode?.label}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border">
                  <Button variant="primary" size="sm" className="w-full">
                    View Full Details
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <GitBranch className="w-12 h-12 text-ink-muted mb-4" />
                <p className="text-sm text-ink-muted">
                  Select a node to view details
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Graph Statistics */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
            Total Nodes
          </p>
          <p className="text-2xl font-semibold text-ink">{mockNodes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
            Connections
          </p>
          <p className="text-2xl font-semibold text-ink">{mockEdges.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
            Verified
          </p>
          <p className="text-2xl font-semibold text-success">
            {mockNodes.filter((n) => n.verified).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
            Issues
          </p>
          <p className="text-2xl font-semibold text-error">
            {mockNodes.filter((n) => !n.verified).length}
          </p>
        </Card>
      </div>
    </div>
  );
}