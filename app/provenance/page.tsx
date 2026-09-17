// Interactive Provenance Graph - scientific lineage visualization - V3 Redesign

"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageHeader,
  Card,
  Select,
  Button,
  VerificationIcon,
  Badge,
  Skeleton,
} from "@/components/ui";
import { formatDateTimeFull } from "@/lib/utils";
import type {
  ProvenanceNodeType,
  ProvenanceGraphNode,
  ProvenanceGraphEdge,
  ProvenanceGraphData,
  Experiment,
} from "@/types";
import {
  getProvenanceGraph,
  getAllProvenanceGraphs,
  getExperiments,
} from "@/services/api";
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
  Cpu,
  Award,
  Layers,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
} from "lucide-react";

function NodeIcon({ type }: { type: ProvenanceNodeType }) {
  const iconProps = { className: "w-4 h-4", strokeWidth: 2 };

  switch (type) {
    case "experiment":
      return <FlaskConical {...iconProps} />;
    case "measurement":
      return <Activity {...iconProps} />;
    case "instrument":
      return <Database {...iconProps} />;
    case "sample":
      return <Layers {...iconProps} />;
    case "correction":
      return <RotateCcw {...iconProps} />;
    case "dataset_version":
      return <Database {...iconProps} />;
    case "dataset":
      return <Database {...iconProps} />;
    case "processing":
      return <Cpu {...iconProps} />;
    case "analysis":
      return <GitBranch {...iconProps} />;
    case "result":
      return <Award {...iconProps} />;
    case "evidence":
      return <ShieldCheck {...iconProps} />;
    case "submission":
      return <Layers {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
}

const nodeTypeColors: Record<
  ProvenanceNodeType,
  { fill: string; stroke: string; label: string; textClass: string }
> = {
  experiment: {
    fill: "color-mix(in srgb, var(--color-success) 14%, var(--color-surface))",
    stroke: "var(--color-success)",
    label: "Experiment",
    textClass: "text-success",
  },
  measurement: {
    fill: "color-mix(in srgb, var(--color-primary) 14%, var(--color-surface))",
    stroke: "var(--color-primary)",
    label: "Measurement",
    textClass: "text-primary",
  },
  instrument: {
    fill: "color-mix(in srgb, var(--color-info) 14%, var(--color-surface))",
    stroke: "var(--color-info)",
    label: "Instrument",
    textClass: "text-info",
  },
  sample: {
    fill: "color-mix(in srgb, #a855f7 14%, var(--color-surface))",
    stroke: "#a855f7",
    label: "Sample",
    textClass: "text-purple-600 dark:text-purple-400",
  },
  correction: {
    fill: "color-mix(in srgb, var(--color-error) 14%, var(--color-surface))",
    stroke: "var(--color-error)",
    label: "Correction",
    textClass: "text-error",
  },
  dataset_version: {
    fill: "color-mix(in srgb, var(--color-warning) 14%, var(--color-surface))",
    stroke: "var(--color-warning)",
    label: "Dataset Version",
    textClass: "text-warning",
  },
  dataset: {
    fill: "color-mix(in srgb, var(--color-warning) 14%, var(--color-surface))",
    stroke: "var(--color-warning)",
    label: "Dataset",
    textClass: "text-warning",
  },
  processing: {
    fill: "color-mix(in srgb, #8b5cf6 15%, var(--color-surface))",
    stroke: "#8b5cf6",
    label: "Processing",
    textClass: "text-purple-600 dark:text-purple-400",
  },
  analysis: {
    fill: "color-mix(in srgb, var(--color-info) 14%, var(--color-surface))",
    stroke: "var(--color-info)",
    label: "Analysis",
    textClass: "text-info",
  },
  result: {
    fill: "color-mix(in srgb, #06b6d4 15%, var(--color-surface))",
    stroke: "#06b6d4",
    label: "Result",
    textClass: "text-cyan-600 dark:text-cyan-400",
  },
  evidence: {
    fill: "color-mix(in srgb, var(--color-error) 14%, var(--color-surface))",
    stroke: "var(--color-error)",
    label: "Evidence",
    textClass: "text-error",
  },
  submission: {
    fill: "color-mix(in srgb, #6366f1 15%, var(--color-surface))",
    stroke: "#6366f1",
    label: "Submission",
    textClass: "text-indigo-600 dark:text-indigo-400",
  },
};

function GraphNodeSvg({
  node,
  isSelected,
  isHighlighted,
  isDimmed,
  onClick,
  scale,
}: {
  node: ProvenanceGraphNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onClick: () => void;
  scale: number;
}) {
  const color = nodeTypeColors[node.type] ?? nodeTypeColors.experiment;
  const isFailed = !node.verified || node.status === "failed";
  const labelLines = node.label.length > 18
    ? [`${node.label.slice(0, 17)}...`, node.label.slice(17, 32)]
    : [node.label];

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isDimmed ? 0.25 : 1,
        scale: isSelected ? 1.08 : isHighlighted ? 1.04 : 1,
      }}
      transition={{ duration: 0.25 }}
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Outer focus / selection ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.circle
            cx={node.x}
            cy={node.y}
            r={48}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={3}
            strokeDasharray="4 2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Path highlight ring */}
      {isHighlighted && !isSelected && (
        <circle
          cx={node.x}
          cy={node.y}
          r={45}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2}
          opacity={0.6}
        />
      )}

      {/* Node Body Circle */}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={38}
        fill={color.fill}
        stroke={isFailed ? "var(--color-error)" : color.stroke}
        strokeWidth={isFailed ? 2.5 : 2}
        filter="url(#provenance-node-shadow)"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.15 }}
      />

      {/* Verification status badge marker */}
      {isFailed ? (
        <circle
          cx={node.x + 24}
          cy={node.y - 24}
          r={8}
          fill="var(--color-error)"
          stroke="var(--color-surface)"
          strokeWidth={2}
        />
      ) : (
        <circle
          cx={node.x + 24}
          cy={node.y - 24}
          r={6}
          fill="var(--color-success)"
          stroke="var(--color-surface)"
          strokeWidth={1.5}
        />
      )}

      {/* Node Icon inside SVG */}
      <foreignObject
        x={node.x - 9}
        y={node.y - 9}
        width={18}
        height={18}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="flex items-center justify-center w-full h-full"
          style={{ color: isFailed ? "var(--color-error)" : "var(--color-ink)" }}
        >
          <NodeIcon type={node.type} />
        </div>
      </foreignObject>

      {/* Node Label */}
      <text
        x={node.x}
        y={node.y + 54}
        textAnchor="middle"
        fill="var(--color-ink)"
        fontSize={11}
        fontWeight={isSelected ? "600" : "500"}
        stroke="var(--color-surface)"
        strokeWidth={4}
        strokeLinejoin="round"
        paintOrder="stroke fill"
        style={{ pointerEvents: "none" }}
      >
        <title>{node.label}</title>
        {labelLines.map((line, index) => (
          <tspan key={`${node.id}-label-${index}`} x={node.x} dy={index === 0 ? 0 : 13}>
            {line}
          </tspan>
        ))}
      </text>

      {/* Node Subtitle (Type) */}
      <text
        x={node.x}
        y={node.y + (labelLines.length > 1 ? 82 : 68)}
        textAnchor="middle"
        fill="var(--color-ink-muted)"
        fontSize={9}
        className="uppercase tracking-wider"
        stroke="var(--color-surface)"
        strokeWidth={3}
        strokeLinejoin="round"
        paintOrder="stroke fill"
        style={{ pointerEvents: "none" }}
      >
        {node.type}
      </text>
    </motion.g>
  );
}

function GraphEdgeSvg({
  edge,
  nodes,
  scale,
  isHighlighted,
  isDimmed,
}: {
  edge: ProvenanceGraphEdge;
  nodes: ProvenanceGraphNode[];
  scale: number;
  isHighlighted: boolean;
  isDimmed: boolean;
}) {
  const fromNode = nodes.find((n) => n.id === edge.from);
  const toNode = nodes.find((n) => n.id === edge.to);

  if (!fromNode || !toNode) return null;

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Offset slightly for smooth cubic bezier
  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;
  const curvature = Math.min(Math.abs(dx) * 0.15, 30);
  const ctrlX = midX;
  const ctrlY = midY - curvature;

  const strokeColor = isHighlighted
    ? "var(--color-primary)"
    : "color-mix(in srgb, var(--color-border) 70%, transparent)";

  const strokeWidth = isHighlighted ? 3 : 1.5;

  return (
    <g opacity={isDimmed ? 0.15 : 1}>
      {/* Edge path */}
      <motion.path
        d={`M ${fromNode.x} ${fromNode.y} Q ${ctrlX} ${ctrlY} ${toNode.x} ${toNode.y}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Small arrow / direction dot */}
      <circle
        cx={toNode.x - (dx / (dist || 1)) * 38}
        cy={toNode.y - (dy / (dist || 1)) * 38}
        r={3.5}
        fill={isHighlighted ? "var(--color-primary)" : "var(--color-ink-muted)"}
      />

      {/* Edge Relationship Label */}
      {isHighlighted && (
        <text
          x={ctrlX}
          y={ctrlY - 4}
          textAnchor="middle"
          fill="var(--color-primary)"
          fontSize={10}
          fontWeight="600"
          className="bg-surface px-1"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

export default function ProvenancePage() {
  const [loading, setLoading] = useState(true);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperimentId, setSelectedExperimentId] =
    useState<string>("EXP-2026-0042");
  const [graphData, setGraphData] = useState<ProvenanceGraphData | null>(null);
  const [selectedNode, setSelectedNode] =
    useState<ProvenanceGraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypeFilters, setActiveTypeFilters] = useState<
    Set<ProvenanceNodeType>
  >(
    new Set([
      "experiment",
      "instrument",
      "sample",
      "measurement",
      "correction",
      "dataset_version",
      "dataset",
      "processing",
      "analysis",
      "result",
      "evidence",
      "submission",
    ])
  );

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [pinchData, setPinchData] = useState<{
    distance: number;
    zoom: number;
    pan: { x: number; y: number };
    midpoint: { x: number; y: number };
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load experiments list
  useEffect(() => {
    async function init() {
      try {
        const [exps, data] = await Promise.all([
          getExperiments(),
          getProvenanceGraph("EXP-2026-0042"),
        ]);
        setExperiments(exps);
        setGraphData(data);
      } catch (err) {
        console.error("Failed to load provenance:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Handle experiment switch
  const handleExperimentChange = async (expId: string) => {
    setSelectedExperimentId(expId);
    setSelectedNode(null);
    setLoading(true);
    try {
      const data = await getProvenanceGraph(expId);
      setGraphData(data);
      handleResetView();
    } catch (err) {
      console.error("Failed to switch experiment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.25, 0.35));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // prevent page scroll
    const delta = e.deltaY;
    const zoomChange = Math.exp(-delta * 0.001); // base sensitivity
    let newZoom = zoom * zoomChange;
    newZoom = Math.min(Math.max(newZoom, 0.35), 3);
    if (newZoom === zoom) return;

    const svg = svgRef.current;
    if (!svg) return;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const screenCTM = svg.getScreenCTM();
    if (screenCTM) {
      const inverted = screenCTM.inverse();
      const svgPoint = point.matrixTransform(inverted);
      const { x: svgX, y: svgY } = svgPoint;
      const offsetX = 50;
      const offsetY = 20;
      const newPanX = e.clientX - (svgX * newZoom + offsetX);
      const newPanY = e.clientY - (svgY * newZoom + offsetY);
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === svgRef.current ||
      (e.target as SVGElement).tagName === "svg" ||
      (e.target as SVGElement).tagName === "rect"
    ) {
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

  // Touch support for mobile pan and pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (
      e.target === svgRef.current ||
      (e.target as SVGElement).tagName === "svg" ||
      (e.target as SVGElement).tagName === "rect"
    ) {
if (e.touches.length === 2) {
  e.preventDefault();
  setIsPinching(true);
  const t1 = e.touches[0];
  const t2 = e.touches[1];
  const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  const midpoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  setPinchData({ distance, zoom, pan: { x: pan.x, y: pan.y }, midpoint });
} else if (e.touches.length === 1) {
  e.preventDefault();
  setIsDragging(true);
  setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
}
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
if (isPinching && e.touches.length === 2) {
  e.preventDefault();
  const t1 = e.touches[0];
  const t2 = e.touches[1];
  const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  const pinch = pinchData!;
  const scaleFactor = distance / pinch.distance;
  let newZoom = Math.min(Math.max(pinch.zoom * scaleFactor, 0.35), 3);
  const midpoint = pinch.midpoint;
  const offsetX = 50;
  const offsetY = 20;
  const newPanX = midpoint.x - (midpoint.x * newZoom + offsetX);
  const newPanY = midpoint.y - (midpoint.y * newZoom + offsetY);
  setZoom(newZoom);
  setPan({ x: newPanX, y: newPanY });
} else if (isDragging && e.touches.length === 1) {
  e.preventDefault();
  setPan({
    x: e.touches[0].clientX - dragStart.x,
    y: e.touches[0].clientY - dragStart.y,
  });
}
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPinching(false);
    setPinchData(null);
  };

  const toggleTypeFilter = (type: ProvenanceNodeType) => {
    setActiveTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) {
          next.delete(type);
        }
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `provenance-${selectedExperimentId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter nodes based on type filters & search query
  const visibleNodes = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.filter((node) => {
      const matchesType = activeTypeFilters.has(node.type);
      const matchesSearch =
        !searchQuery.trim() ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(node.metadata).some((v) =>
          v.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesType && matchesSearch;
    });
  }, [graphData, activeTypeFilters, searchQuery]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.filter(
      (edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)
    );
  }, [graphData, visibleNodeIds]);

  // Compute upstream ancestors and downstream descendants for selected node
  const { highlightedNodeIds, highlightedEdgeKeys } = useMemo(() => {
    if (!selectedNode || !graphData) {
      return {
        highlightedNodeIds: new Set<string>(),
        highlightedEdgeKeys: new Set<string>(),
      };
    }

    const nodeIds = new Set<string>([selectedNode.id]);
    const edgeKeys = new Set<string>();

    // Traverse upstream (ancestors)
    const upstreamQueue = [selectedNode.id];
    while (upstreamQueue.length > 0) {
      const curr = upstreamQueue.shift()!;
      graphData.edges
        .filter((e) => e.to === curr)
        .forEach((e) => {
          edgeKeys.add(`${e.from}->${e.to}`);
          if (!nodeIds.has(e.from)) {
            nodeIds.add(e.from);
            upstreamQueue.push(e.from);
          }
        });
    }

    // Traverse downstream (descendants)
    const downstreamQueue = [selectedNode.id];
    while (downstreamQueue.length > 0) {
      const curr = downstreamQueue.shift()!;
      graphData.edges
        .filter((e) => e.from === curr)
        .forEach((e) => {
          edgeKeys.add(`${e.from}->${e.to}`);
          if (!nodeIds.has(e.to)) {
            nodeIds.add(e.to);
            downstreamQueue.push(e.to);
          }
        });
    }

    return {
      highlightedNodeIds: nodeIds,
      highlightedEdgeKeys: edgeKeys,
    };
  }, [selectedNode, graphData]);

  if (loading && !graphData) {
    return (
      <div>
        <PageHeader
          title="Provenance Graph"
          subtitle="Interactive visualization of experimental lineage, dataset evolution, and evidence relationships."
        />
        <Card className="p-8">
          <Skeleton className="h-[650px] w-full" />
        </Card>
      </div>
    );
  }

  const allNodes = graphData?.nodes || [];
  const verifiedCount = allNodes.filter(
    (n) => n.verified && n.status !== "failed"
  ).length;
  const issuesCount = allNodes.length - verifiedCount;

  return (
    <div className="space-y-6">
      {/* Header and Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Provenance Graph"
            subtitle="Interactive visualization of experimental lineage, dataset evolution, and evidence relationships."
          />
        </div>

        {/* Experiment Selector */}
        <div className="flex w-full items-center gap-3 sm:w-auto sm:self-start md:self-auto">
          <label className="shrink-0 text-xs font-medium text-ink-muted uppercase tracking-wide">
            Experiment:
          </label>
          {/* Fixed `w-72` below `sm` would set a ~393px min-content floor for the
              page (label + gap + 288px), zooming out every phone viewport. From
              `sm` up it is byte-for-byte the previous fixed width. */}
          <div className="min-w-0 flex-1 sm:w-72 sm:flex-none">
            <Select
              value={selectedExperimentId}
              onChange={(e) => handleExperimentChange(e.target.value)}
              options={experiments.map((exp) => ({
                value: exp.id,
                label: `${exp.id} - ${exp.title}`,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Node Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wide mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>
            {(
              [
                "experiment",
                "instrument",
                "sample",
                "measurement",
                "correction",
                "dataset_version",
                "dataset",
                "processing",
                "analysis",
                "result",
                "evidence",
                "submission",
              ] as ProvenanceNodeType[]
            ).map((type) => {
              const active = activeTypeFilters.has(type);
              const config = nodeTypeColors[type];
              return (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-colors ${
                    active
                      ? "bg-surface-elevated text-ink border-border shadow-xs"
                      : "bg-surface text-ink-muted border-transparent opacity-40 hover:opacity-75"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.stroke }}
                  />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search nodes or metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-surface border border-border text-ink focus:outline-hidden focus:border-primary placeholder:text-ink-faint"
            />
          </div>
        </div>
      </Card>

      {/* Main Graph Grid */}
      <AnimatePresence>
        {isGraphExpanded && (
          <motion.div
            key="graph-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsGraphExpanded(false)}
            className="fixed inset-0 z-[55] bg-background/75 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Graph Canvas Card */}
        <Card
          className={`lg:col-span-2 p-0 overflow-hidden relative border border-border ${
            isGraphExpanded
              ? "fixed inset-x-4 top-20 bottom-4 z-[60] w-auto shadow-2xl flex flex-col"
              : ""
          }`}
        >
          {isGraphExpanded && (
            <div className="absolute top-4 left-4 z-10 bg-surface/90 backdrop-blur-xs border border-border px-3 py-2 shadow-lg">
              <p className="text-xs font-semibold text-ink">Interactive Provenance Graph</p>
              <p className="text-[10px] text-ink-muted mt-0.5">Expanded canvas view</p>
            </div>
          )}
          {/* Canvas Floating Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-surface/90 backdrop-blur-xs p-1.5 rounded-lg border border-border shadow-lg ring-1 ring-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              title="Zoom In"
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetView}
              title="Reset View"
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsGraphExpanded((expanded) => !expanded)}
              title={isGraphExpanded ? "Close expanded graph" : "Open expanded graph"}
              className="h-8 w-8 p-0"
            >
              {isGraphExpanded ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportSvg}
              title="Export SVG"
              className="h-8 w-8 p-0"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* SVG Canvas Area */}
          <div
            className={`bg-surface overflow-hidden select-none relative h-[400px] sm:h-[500px] md:h-[650px] lg:h-[1040px] ${
              isGraphExpanded ? "h-full flex-1 min-h-0" : ""
            } touch-none overscroll-contain`}
            style={{
              background:
                "radial-gradient(circle at 52% 38%, color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)), var(--color-surface) 62%)",
              touchAction: "none",
              overscrollBehavior: "contain",
            }}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 1000 1040"
              preserveAspectRatio="xMidYMin meet"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => setSelectedNode(null)}
              style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none", overscrollBehavior: "contain" }}
            >
              {/* Background grid pattern */}
              <defs>
                <filter id="provenance-node-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="4"
                    floodColor="var(--color-background)"
                    floodOpacity="0.35"
                  />
                </filter>
                <pattern
                  id="provenance-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="1"
                    fill="var(--color-border)"
                    opacity="0.6"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="url(#provenance-grid)"
                pointerEvents="all"
              />

              {/* Pan & Zoom Container */}
              <g
                transform={`translate(${pan.x + 50}, ${pan.y + 20}) scale(${zoom})`}
              >
                {/* Render Edges */}
                {visibleEdges.map((edge, i) => {
                  const edgeKey = `${edge.from}->${edge.to}`;
                  const isHighlighted = highlightedEdgeKeys.has(edgeKey);
                  const isDimmed =
                    selectedNode !== null && !isHighlighted;
                  return (
                    <GraphEdgeSvg
                      key={`${edge.from}-${edge.to}-${i}`}
                      edge={edge}
                      nodes={allNodes}
                      scale={zoom}
                      isHighlighted={isHighlighted}
                      isDimmed={isDimmed}
                    />
                  );
                })}

                {/* Render Nodes */}
                {visibleNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isHighlighted = highlightedNodeIds.has(node.id);
                  const isDimmed =
                    selectedNode !== null &&
                    !isSelected &&
                    !isHighlighted;

                  return (
                    <GraphNodeSvg
                      key={node.id}
                      node={node}
                      isSelected={isSelected}
                      isHighlighted={isHighlighted}
                      isDimmed={isDimmed}
                      onClick={() => setSelectedNode(node)}
                      scale={zoom}
                    />
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Visual Node Types Legend */}
          <div className="hidden sm:block absolute bottom-3 left-3 bg-surface/95 backdrop-blur-xs rounded-lg border border-border p-3 shadow-lg ring-1 ring-border/30 max-w-xs">
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
              Lineage Node Types
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {(
                [
                  "experiment",
                  "instrument",
                  "sample",
                  "measurement",
                  "correction",
                  "dataset_version",
                  "dataset",
                  "processing",
                  "analysis",
                  "result",
                  "evidence",
                  "submission",
                ] as ProvenanceNodeType[]
              ).map((type) => {
                const config = nodeTypeColors[type];
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-xs border"
                      style={{
                        backgroundColor: config.fill,
                        borderColor: config.stroke,
                      }}
                    />
                    <span className="text-[11px] text-ink capitalize">
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="block sm:hidden border-t border-border bg-surface p-3">
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
              Lineage Node Types
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              {(
                [
                  "experiment",
                  "instrument",
                  "sample",
                  "measurement",
                  "correction",
                  "dataset_version",
                  "dataset",
                  "processing",
                  "analysis",
                  "result",
                  "evidence",
                  "submission",
                ] as ProvenanceNodeType[]
              ).map((type) => {
                const config = nodeTypeColors[type];
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-xs border"
                      style={{
                        backgroundColor: config.fill,
                        borderColor: config.stroke,
                      }}
                    />
                    <span className="text-[11px] text-ink capitalize">
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Node Inspection Details Panel */}
        <Card className="p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-border mb-3 sm:mb-4 gap-2">
              <h3 className="text-base font-semibold text-ink">
                Node Inspector
              </h3>
              {selectedNode && (
                <Badge
                  variant={
                    selectedNode.verified && selectedNode.status !== "failed"
                      ? "success"
                      : "error"
                  }
                >
                  {selectedNode.verified && selectedNode.status !== "failed"
                    ? "Verified"
                    : "Issue Detected"}
                </Badge>
              )}
            </div>

            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 sm:space-y-4"
                >
                  {/* Node Title & Identity */}
                  <div className="flex items-start gap-2 sm:gap-3 bg-surface-elevated p-2 sm:p-3 border border-border">
                    <div
                      className="w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor:
                          nodeTypeColors[selectedNode.type]?.fill,
                        borderColor: nodeTypeColors[selectedNode.type]?.stroke,
                      }}
                    >
                      <NodeIcon type={selectedNode.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-ink-muted">
                          {selectedNode.type} Node
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-ink truncate mt-0.5">
                        {selectedNode.label}
                      </p>
                      <p className="text-xs font-mono text-ink-muted mt-0.5 break-all">
                        ID: {selectedNode.id}
                      </p>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div>
                    <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">
                      Timestamp
                    </span>
                    <p className="text-xs text-ink mt-0.5 font-mono">
                      {formatDateTimeFull(selectedNode.timestamp)}
                    </p>
                  </div>

                  {/* Metadata Key-Values */}
                  <div>
                    <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wide mb-2 block">
                      Node Properties & Attributes
                    </span>
                    <div className="bg-surface border border-border divide-y divide-border text-xs">
                      {Object.entries(selectedNode.metadata).map(
                        ([key, val]) => (
                          <div
                            key={key}
                            className="p-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2"
                          >
                            <span className="text-ink-muted capitalize font-medium">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-ink font-mono text-right break-all">
                              {val}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Connections */}
                  <div>
                    <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wide mb-2 block">
                      Lineage Connections
                    </span>
                    <div className="space-y-1 sm:space-y-1.5 max-h-40 overflow-y-auto">
                      {/* Inputs (Upstream) */}
                      {graphData?.edges
                        .filter((e) => e.to === selectedNode.id)
                        .map((edge, i) => {
                          const src = allNodes.find((n) => n.id === edge.from);
                          return (
                            <button
                              key={`up-${i}`}
                              onClick={() => src && setSelectedNode(src)}
                              className="w-full text-left p-2 bg-surface hover:bg-surface-elevated border border-border text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 group transition-colors"
                            >
                              <div className="flex items-center gap-1">
                                <ArrowLeft className="w-3 h-3 text-ink-muted flex-shrink-0" />
                                <span className="text-ink-muted font-medium truncate">
                                  {edge.label}:
                                </span>
                                <span className="text-ink font-semibold truncate">
                                  {src?.label || edge.from}
                                </span>
                              </div>
                              <span className="text-[10px] text-ink-faint group-hover:text-primary hidden sm:inline">
                                Inspect
                              </span>
                            </button>
                          );
                        })}

                      {/* Outputs (Downstream) */}
                      {graphData?.edges
                        .filter((e) => e.from === selectedNode.id)
                        .map((edge, i) => {
                          const tgt = allNodes.find((n) => n.id === edge.to);
                          return (
                            <button
                              key={`down-${i}`}
                              onClick={() => tgt && setSelectedNode(tgt)}
                              className="w-full text-left p-2 bg-surface hover:bg-surface-elevated border border-border text-xs flex flex-col sm:flex-row sm:justify-between gap-1 group transition-colors"
                            >
                              <div className="flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 text-ink-muted flex-shrink-0" />
                                <span className="text-ink-muted font-medium truncate">
                                  {edge.label}:
                                </span>
                                <span className="text-ink font-semibold truncate">
                                  {tgt?.label || edge.to}
                                </span>
                              </div>
                              <span className="text-[10px] text-ink-faint group-hover:text-primary hidden sm:inline">
                                Inspect
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Actions & Deep Links */}
                  <div className="pt-2 sm:pt-3 border-t border-border space-y-2">
                    {selectedNode.recordId && (
                      <Link
                        href={`/evidence/${selectedNode.recordId}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-2 sm:px-3 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">View Evidence Record ({selectedNode.recordId})</span>
                        <span className="sm:hidden">View Evidence</span>
                      </Link>
                    )}

                    {selectedNode.type === "experiment" && (
                      <Link
                        href={`/experiments/${selectedNode.label}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-2 sm:px-3 text-xs font-semibold text-ink bg-surface-elevated hover:bg-surface border border-border transition-colors"
                      >
                        <FlaskConical className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Open Experiment Details</span>
                        <span className="sm:hidden">View Experiment</span>
                      </Link>
                    )}

                    {selectedNode.type === "submission" && (
                      <Link
                        href="/submissions"
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-2 sm:px-3 text-xs font-semibold text-ink bg-surface-elevated hover:bg-surface border border-border transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Open Research Submissions</span>
                        <span className="sm:hidden">View Submissions</span>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 sm:py-16 text-center"
                >
                  <GitBranch className="w-10 sm:w-12 h-10 sm:h-12 text-ink-muted mb-2 sm:mb-3 opacity-60" />
                  <p className="text-sm font-medium text-ink">
                    No Node Selected
                  </p>
                  <p className="text-xs text-ink-muted mt-1 max-w-xs">
                    Click any node on the canvas to inspect cryptographic
                    commitments, upstream inputs, and downstream results.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* Graph Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
            Total Pipeline Nodes
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-ink">{allNodes.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
            Lineage Connections
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-ink">
            {graphData?.edges.length || 0}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
            Verified Artifacts
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-success">{verifiedCount}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
            Integrity Issues
          </p>
          <p
            className={`text-xl sm:text-2xl font-semibold ${
              issuesCount > 0 ? "text-error" : "text-ink-muted"
            }`}
          >
            {issuesCount}
          </p>
        </Card>
      </div>
    </div>
  );
}