/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { RowData, TableConfig } from "../types";
import { 
  X, Search, ZoomIn, ZoomOut, RotateCcw, Play, Pause, 
  Layers, Network, Share2, Sparkles, Filter, Info, ArrowUpRight,
  Sliders, Maximize2, CheckCircle2, BarChart2, Eye, MapPin, Globe, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DEFAULT_REGIONAL_SEED, RegionalData } from "./StudentGeography";

interface StudentSourceForceGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: RowData[];
  config?: TableConfig;
  selectedDate: string;
  isDarkMode: boolean;
}

export interface ForceNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: "channel" | "major" | "region";
  totalStudents: number;
  color: string;
  channelCount?: number;
  majorCount?: number;
  regionCount?: number;
}

export interface ForceLink extends d3.SimulationLinkDatum<ForceNode> {
  id: string;
  source: string | ForceNode;
  target: string | ForceNode;
  value: number; // Student count
  channelName?: string;
  majorName?: string;
  regionName?: string;
}

// Preset modern color palette for majors
const MAJOR_PALETTE = [
  "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4",
  "#8b5cf6", "#f97316", "#14b8a6", "#84cc16", "#d946ef",
  "#3b82f6", "#eab308", "#ef4444", "#64748b", "#22c55e"
];

// Distinct styling palette for channel hubs
const CHANNEL_PALETTE = [
  "#4f46e5", "#0284c7", "#059669", "#d97706", "#7c3aed", "#c026d3", "#475569"
];

// Distinct styling palette for regional hubs (Provinces)
const REGION_PALETTE = [
  "#f59e0b", "#06b6d4", "#ec4899", "#10b981", "#8b5cf6", "#3b82f6", "#f97316", "#d946ef"
];

export default function StudentSourceForceGraphModal({
  isOpen,
  onClose,
  rows,
  config,
  selectedDate,
  isDarkMode
}: StudentSourceForceGraphModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<ForceNode, ForceLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [zoomScale, setZoomScale] = useState<number>(1);

  // Canvas Zoom Handlers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.25);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.8);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
      setZoomScale(1);
    }
  };

  const handleSliderZoomChange = (newScale: number) => {
    setZoomScale(newScale);
    if (svgRef.current && zoomBehaviorRef.current) {
      const svg = d3.select(svgRef.current);
      const width = containerRef.current?.clientWidth || 900;
      const height = containerRef.current?.clientHeight || 600;

      const newTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(newScale)
        .translate(-width / 2, -height / 2);

      svg.call(zoomBehaviorRef.current.transform, newTransform);
    }
  };

  // Hierarchy Switch: Channel ↔ Major vs Region ↔ Major ("生源地域归属"层级)
  const [hierarchyMode, setHierarchyMode] = useState<"channel_major" | "region_major">("channel_major");

  // Time scope filter inside modal
  const [timeScope, setTimeScope] = useState<"selected_date" | "current_month" | "all_history">("current_month");

  // Physics Simulation Controls
  const [chargeStrength, setChargeStrength] = useState<number>(-240);
  const [linkDistance, setLinkDistance] = useState<number>(120);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [minStudentThreshold, setMinStudentThreshold] = useState<number>(1);

  // Interactive Focus State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ForceNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract month string e.g. "2026-06"
  const currentMonthStr = useMemo(() => {
    return selectedDate && selectedDate.includes("-") ? selectedDate.substring(0, 7) : "2026-06";
  }, [selectedDate]);

  // Load regional data from localStorage or fallback to default seed
  const regionalDataList = useMemo<RegionalData[]>(() => {
    try {
      const saved = localStorage.getItem("recruitment_geography_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load recruitment geography data", e);
    }
    return DEFAULT_REGIONAL_SEED;
  }, [isOpen]);

  // 1. Process Raw Rows / Regional Data into Force Graph Nodes and Links
  const { nodes, links, majorColorMap, hubList, majorList, totalMappedStudents, topPair } = useMemo(() => {
    const graphNodes: ForceNode[] = [];
    const graphLinks: ForceLink[] = [];
    const linkMap = new Map<string, number>();
    const majorTotals = new Map<string, number>();
    const hubTotals = new Map<string, number>();

    if (hierarchyMode === "channel_major") {
      const channelNames = config?.channels || [
        "线上推广", "线下宣讲", "转介绍", "高中合作", "社媒引流", "招生简章", "其它/补录"
      ];

      // Filter rows based on time scope
      let filteredRows = rows;
      if (timeScope === "selected_date") {
        filteredRows = rows.filter(r => r.date === selectedDate);
      } else if (timeScope === "current_month") {
        filteredRows = rows.filter(r => r.date.startsWith(currentMonthStr));
      }

      filteredRows.forEach(row => {
        const majorName = row.name;
        if (!majorName) return;

        if (row.channels && Array.isArray(row.channels)) {
          row.channels.forEach((ch, idx) => {
            const cName = channelNames[idx] || `渠道${idx + 1}`;
            const actualVal = typeof ch.actual === "number" ? ch.actual : Number(ch.actual) || 0;

            if (actualVal > 0) {
              const key = `${cName}|||${majorName}`;
              linkMap.set(key, (linkMap.get(key) || 0) + actualVal);
              majorTotals.set(majorName, (majorTotals.get(majorName) || 0) + actualVal);
              hubTotals.set(cName, (hubTotals.get(cName) || 0) + actualVal);
            }
          });
        }

        const otherVal = typeof row.other === "number" ? row.other : Number(row.other) || 0;
        if (otherVal > 0) {
          const cName = "其它/补录";
          const key = `${cName}|||${majorName}`;
          linkMap.set(key, (linkMap.get(key) || 0) + otherVal);
          majorTotals.set(majorName, (majorTotals.get(majorName) || 0) + otherVal);
          hubTotals.set(cName, (hubTotals.get(cName) || 0) + otherVal);
        }
      });

      // Build Major Nodes Color Mapping
      const uniqueMajors = Array.from(majorTotals.keys());
      const mColorMap = new Map<string, string>();
      uniqueMajors.forEach((mName, idx) => {
        mColorMap.set(mName, MAJOR_PALETTE[idx % MAJOR_PALETTE.length]);
      });

      // Channel Hub Nodes
      const uniqueHubs = Array.from(new Set([...channelNames, "其它/补录"])).filter(
        c => (hubTotals.get(c) || 0) >= minStudentThreshold
      );

      uniqueHubs.forEach((cName, idx) => {
        graphNodes.push({
          id: `ch-${cName}`,
          name: cName,
          type: "channel",
          totalStudents: hubTotals.get(cName) || 0,
          color: CHANNEL_PALETTE[idx % CHANNEL_PALETTE.length],
          majorCount: Array.from(linkMap.keys()).filter(k => k.startsWith(`${cName}|||`)).length
        });
      });

      // Major Nodes
      uniqueMajors.forEach((mName) => {
        const tot = majorTotals.get(mName) || 0;
        if (tot >= minStudentThreshold) {
          graphNodes.push({
            id: `maj-${mName}`,
            name: mName,
            type: "major",
            totalStudents: tot,
            color: mColorMap.get(mName) || "#10b981",
            channelCount: Array.from(linkMap.keys()).filter(k => k.endsWith(`|||${mName}`)).length
          });
        }
      });

      // Links
      let grandTotal = 0;
      let maxVal = 0;
      let topPairStr = "";

      linkMap.forEach((val, key) => {
        if (val >= minStudentThreshold) {
          const [cName, mName] = key.split("|||");
          const sourceId = `ch-${cName}`;
          const targetId = `maj-${mName}`;

          if (graphNodes.some(n => n.id === sourceId) && graphNodes.some(n => n.id === targetId)) {
            graphLinks.push({
              id: `link-${cName}-${mName}`,
              source: sourceId,
              target: targetId,
              value: val,
              channelName: cName,
              majorName: mName
            });

            grandTotal += val;
            if (val > maxVal) {
              maxVal = val;
              topPairStr = `${cName} → ${mName} (${val}人)`;
            }
          }
        }
      });

      return {
        nodes: graphNodes,
        links: graphLinks,
        majorColorMap: mColorMap,
        hubList: uniqueHubs,
        majorList: uniqueMajors,
        totalMappedStudents: grandTotal,
        topPair: topPairStr || "暂无显著映射"
      };

    } else {
      // hierarchyMode === "region_major" (生源地域归属层级)
      const regionTotals = new Map<string, number>();
      const regionMajorsMap = new Map<string, { majorName: string; count: number }[]>();

      regionalDataList.forEach(reg => {
        const prov = reg.province;
        if (!prov) return;

        if (Array.isArray(reg.majors)) {
          reg.majors.forEach(m => {
            if (m.count > 0) {
              const key = `${prov}|||${m.name}`;
              linkMap.set(key, (linkMap.get(key) || 0) + m.count);
              majorTotals.set(m.name, (majorTotals.get(m.name) || 0) + m.count);
              hubTotals.set(prov, (hubTotals.get(prov) || 0) + m.count);
            }
          });
        }
      });

      const uniqueMajors = Array.from(majorTotals.keys());
      const mColorMap = new Map<string, string>();
      uniqueMajors.forEach((mName, idx) => {
        mColorMap.set(mName, MAJOR_PALETTE[idx % MAJOR_PALETTE.length]);
      });

      const uniqueProvinces = Array.from(hubTotals.keys()).filter(
        p => (hubTotals.get(p) || 0) >= minStudentThreshold
      );

      // Region Nodes
      uniqueProvinces.forEach((pName, idx) => {
        graphNodes.push({
          id: `reg-${pName}`,
          name: pName,
          type: "region",
          totalStudents: hubTotals.get(pName) || 0,
          color: REGION_PALETTE[idx % REGION_PALETTE.length],
          majorCount: Array.from(linkMap.keys()).filter(k => k.startsWith(`${pName}|||`)).length
        });
      });

      // Major Nodes
      uniqueMajors.forEach((mName) => {
        const tot = majorTotals.get(mName) || 0;
        if (tot >= minStudentThreshold) {
          graphNodes.push({
            id: `maj-${mName}`,
            name: mName,
            type: "major",
            totalStudents: tot,
            color: mColorMap.get(mName) || "#10b981",
            regionCount: Array.from(linkMap.keys()).filter(k => k.endsWith(`|||${mName}`)).length
          });
        }
      });

      // Links
      let grandTotal = 0;
      let maxVal = 0;
      let topPairStr = "";

      linkMap.forEach((val, key) => {
        if (val >= minStudentThreshold) {
          const [pName, mName] = key.split("|||");
          const sourceId = `reg-${pName}`;
          const targetId = `maj-${mName}`;

          if (graphNodes.some(n => n.id === sourceId) && graphNodes.some(n => n.id === targetId)) {
            graphLinks.push({
              id: `link-${pName}-${mName}`,
              source: sourceId,
              target: targetId,
              value: val,
              regionName: pName,
              majorName: mName
            });

            grandTotal += val;
            if (val > maxVal) {
              maxVal = val;
              topPairStr = `${pName} → ${mName} (${val}人)`;
            }
          }
        }
      });

      return {
        nodes: graphNodes,
        links: graphLinks,
        majorColorMap: mColorMap,
        hubList: uniqueProvinces,
        majorList: uniqueMajors,
        totalMappedStudents: grandTotal,
        topPair: topPairStr || "暂无显著映射"
      };
    }
  }, [rows, config, selectedDate, currentMonthStr, timeScope, minStudentThreshold, hierarchyMode, regionalDataList]);

  // Selected Node Details Calculations for Right Drawer
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node) return null;

    if (node.type === "channel") {
      const connected = links.filter(l => {
        const sId = typeof l.source === "object" ? l.source.id : l.source;
        return sId === node.id;
      }).map(l => {
        const tId = typeof l.target === "object" ? l.target.id : l.target;
        const targetNode = nodes.find(n => n.id === tId);
        return {
          majorName: l.majorName,
          count: l.value,
          color: targetNode?.color || "#10b981",
          percentage: node.totalStudents > 0 ? ((l.value / node.totalStudents) * 100).toFixed(1) : "0"
        };
      }).sort((a, b) => b.count - a.count);

      return {
        node,
        connected,
        total: node.totalStudents,
        subTitle: "生源主要分流专业"
      };
    } else if (node.type === "region") {
      const connected = links.filter(l => {
        const sId = typeof l.source === "object" ? l.source.id : l.source;
        return sId === node.id;
      }).map(l => {
        const tId = typeof l.target === "object" ? l.target.id : l.target;
        const targetNode = nodes.find(n => n.id === tId);
        return {
          majorName: l.majorName,
          count: l.value,
          color: targetNode?.color || "#10b981",
          percentage: node.totalStudents > 0 ? ((l.value / node.totalStudents) * 100).toFixed(1) : "0"
        };
      }).sort((a, b) => b.count - a.count);

      return {
        node,
        connected,
        total: node.totalStudents,
        subTitle: "该地域报考各专业生源分布"
      };
    } else {
      // node.type === "major"
      const connected = links.filter(l => {
        const tId = typeof l.target === "object" ? l.target.id : l.target;
        return tId === node.id;
      }).map(l => {
        const sId = typeof l.source === "object" ? l.source.id : l.source;
        const sourceNode = nodes.find(n => n.id === sId);
        return {
          hubName: sourceNode?.name || l.channelName || l.regionName,
          count: l.value,
          color: sourceNode?.color || "#6366f1",
          percentage: node.totalStudents > 0 ? ((l.value / node.totalStudents) * 100).toFixed(1) : "0"
        };
      }).sort((a, b) => b.count - a.count);

      return {
        node,
        connected,
        total: node.totalStudents,
        subTitle: hierarchyMode === "channel_major" ? "主要贡献引流渠道" : "主要生源来源省份/地域"
      };
    }
  }, [selectedNodeId, nodes, links, hierarchyMode]);

  // Hover node connected metrics for hovering HUD card
  const hoverMetrics = useMemo(() => {
    if (!hoveredNode) return null;
    const connectedLinks = links.filter(l => {
      const sId = typeof l.source === "object" ? l.source.id : l.source;
      const tId = typeof l.target === "object" ? l.target.id : l.target;
      return sId === hoveredNode.id || tId === hoveredNode.id;
    });

    const connectedCount = connectedLinks.length;
    let topConnectedName = "";
    let topConnectedCount = 0;

    connectedLinks.forEach(l => {
      if (l.value > topConnectedCount) {
        topConnectedCount = l.value;
        const sId = typeof l.source === "object" ? l.source.id : l.source;
        const targetNode = nodes.find(n => n.id === (sId === hoveredNode.id ? (typeof l.target === "object" ? l.target.id : l.target) : sId));
        topConnectedName = targetNode?.name || "";
      }
    });

    return {
      connectedCount,
      topConnectedName,
      topConnectedCount,
      share: totalMappedStudents > 0 ? ((hoveredNode.totalStudents / totalMappedStudents) * 100).toFixed(1) : "0"
    };
  }, [hoveredNode, links, nodes, totalMappedStudents]);

  // 2. Render D3 Force Directed Graph Simulation
  const renderD3Graph = useCallback(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 600;

    svg.attr("width", width).attr("height", height);

    // Root Group for Zoom & Pan
    const g = svg.append("g").attr("class", "force-graph-container");

    // Defs for Glow Filters and Line Gradients
    const defs = svg.append("defs");

    // Glow Filter
    const filter = defs.append("filter")
      .attr("id", "glowFilter")
      .attr("x", "-50%").attr("y", "-50%")
      .attr("width", "200%").attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "5")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow marker definition
    defs.append("marker")
      .attr("id", "linkArrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", isDarkMode ? "#64748b" : "#cbd5e1");

    // Zoom setup
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        const k = event.transform.k;
        setZoomScale(prev => (Math.abs(prev - k) > 0.01 ? k : prev));
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    // Copy nodes and links to prevent mutating state directly
    const nodesCopy: ForceNode[] = nodes.map(n => ({ ...n }));
    const linksCopy: ForceLink[] = links.map(l => ({ ...l }));

    // Scale for node radius
    const maxStudents = d3.max(nodesCopy, n => n.totalStudents) || 10;
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxStudents])
      .range([14, 38]);

    // Scale for link stroke width
    const maxLinkValue = d3.max(linksCopy, l => l.value) || 1;
    const linkWidthScale = d3.scaleLinear()
      .domain([1, maxLinkValue])
      .range([1.8, 8]);

    // D3 Force Simulation Setup
    const simulation = d3.forceSimulation<ForceNode, ForceLink>(nodesCopy)
      .force("link", d3.forceLink<ForceNode, ForceLink>(linksCopy)
        .id(d => d.id)
        .distance(linkDistance)
      )
      .force("charge", d3.forceManyBody().strength(chargeStrength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<ForceNode>().radius(d => radiusScale(d.totalStudents) + 14));

    simulationRef.current = simulation;

    // Render Links
    const linkGroup = g.append("g").attr("class", "links-group");
    const linkElements = linkGroup.selectAll<SVGLineElement, ForceLink>("line")
      .data(linksCopy)
      .enter()
      .append("line")
      .attr("class", "force-link-line transition-all duration-150")
      .attr("stroke", isDarkMode ? "#334155" : "#e2e8f0")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => linkWidthScale(d.value))
      .attr("stroke-linecap", "round");

    // Render Nodes Group
    const nodeGroup = g.append("g").attr("class", "nodes-group");
    const nodeElements = nodeGroup.selectAll<SVGGElement, ForceNode>("g")
      .data(nodesCopy)
      .enter()
      .append("g")
      .attr("class", "node-item transition-all duration-150")
      .style("cursor", "grab")
      .call(
        d3.drag<SVGGElement, ForceNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // 1) Channel Nodes (Squares rx=8)
    nodeElements.filter(d => d.type === "channel")
      .append("rect")
      .attr("width", d => radiusScale(d.totalStudents) * 2)
      .attr("height", d => radiusScale(d.totalStudents) * 2)
      .attr("x", d => -radiusScale(d.totalStudents))
      .attr("y", d => -radiusScale(d.totalStudents))
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", d => d.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2.5)
      .attr("filter", "url(#glowFilter)");

    // 2) Region Nodes (Pill / Rounded Diamond / Hexagon)
    nodeElements.filter(d => d.type === "region")
      .append("rect")
      .attr("width", d => radiusScale(d.totalStudents) * 2.2)
      .attr("height", d => radiusScale(d.totalStudents) * 1.8)
      .attr("x", d => -radiusScale(d.totalStudents) * 1.1)
      .attr("y", d => -radiusScale(d.totalStudents) * 0.9)
      .attr("rx", 14)
      .attr("ry", 14)
      .attr("fill", d => d.color)
      .attr("stroke", "#fbbf24")
      .attr("stroke-width", 2.5)
      .attr("filter", "url(#glowFilter)");

    // 3) Major Nodes (Circles)
    nodeElements.filter(d => d.type === "major")
      .append("circle")
      .attr("r", d => radiusScale(d.totalStudents))
      .attr("fill", d => d.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("filter", "url(#glowFilter)");

    // Node Labels
    nodeElements.append("text")
      .text(d => d.name)
      .attr("dy", d => radiusScale(d.totalStudents) + (d.type === "region" ? 16 : 14))
      .attr("text-anchor", "middle")
      .attr("fill", isDarkMode ? "#f8fafc" : "#1e293b")
      .attr("font-size", d => d.type === "major" ? "11px" : "12px")
      .attr("font-weight", "800")
      .attr("pointer-events", "none")
      .style("text-shadow", isDarkMode ? "0 2px 4px rgba(0,0,0,0.9)" : "0 1px 3px rgba(255,255,255,0.9)");

    // Student Count Badge on Node
    nodeElements.append("text")
      .text(d => `${d.totalStudents}人`)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", d => `${Math.max(9, radiusScale(d.totalStudents) * 0.45)}px`)
      .attr("font-weight", "900")
      .attr("font-family", "monospace")
      .attr("pointer-events", "none");

    // Apply Node Selection Highlighting Helper
    function applyHighlight(focusedId: string | null, isHover: boolean) {
      if (!focusedId) {
        linkElements
          .attr("stroke", isDarkMode ? "#334155" : "#cbd5e1")
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", l => linkWidthScale(l.value))
          .attr("filter", "none");

        nodeElements
          .style("opacity", 1)
          .attr("filter", "url(#glowFilter)");

        nodeElements.selectAll("rect, circle")
          .attr("stroke", d => (d as ForceNode).type === "region" ? "#fbbf24" : "#ffffff")
          .attr("stroke-width", d => (d as ForceNode).type === "region" ? 2.5 : 2);
        return;
      }

      // Find connected link targets/sources
      const connectedNodeIds = new Set<string>([focusedId]);
      
      linkElements
        .attr("stroke", l => {
          const sId = typeof l.source === "object" ? l.source.id : l.source;
          const tId = typeof l.target === "object" ? l.target.id : l.target;
          const isConn = sId === focusedId || tId === focusedId;
          if (isConn) {
            connectedNodeIds.add(sId);
            connectedNodeIds.add(tId);
            return isHover ? "#10b981" : "#6366f1";
          }
          return isDarkMode ? "#1e293b" : "#f1f5f9";
        })
        .attr("stroke-opacity", l => {
          const sId = typeof l.source === "object" ? l.source.id : l.source;
          const tId = typeof l.target === "object" ? l.target.id : l.target;
          return (sId === focusedId || tId === focusedId) ? 1 : 0.05;
        })
        .attr("stroke-width", l => {
          const sId = typeof l.source === "object" ? l.source.id : l.source;
          const tId = typeof l.target === "object" ? l.target.id : l.target;
          return (sId === focusedId || tId === focusedId) ? linkWidthScale(l.value) + 3.5 : 1;
        })
        .attr("filter", l => {
          const sId = typeof l.source === "object" ? l.source.id : l.source;
          const tId = typeof l.target === "object" ? l.target.id : l.target;
          return (sId === focusedId || tId === focusedId) ? "url(#glowFilter)" : "none";
        });

      nodeElements
        .style("opacity", n => connectedNodeIds.has(n.id) ? 1 : 0.15)
        .attr("filter", n => connectedNodeIds.has(n.id) ? "url(#glowFilter)" : "none");

      nodeElements.selectAll("rect, circle")
        .attr("stroke", d => {
          const node = d as ForceNode;
          if (node.id === focusedId) return "#38bdf8";
          if (connectedNodeIds.has(node.id)) return "#f59e0b";
          return node.type === "region" ? "#fbbf24" : "#ffffff";
        })
        .attr("stroke-width", d => {
          const node = d as ForceNode;
          if (node.id === focusedId) return 4;
          if (connectedNodeIds.has(node.id)) return 3;
          return 2;
        });
    }

    // Node Mouse Events (Hover & Click)
    nodeElements
      .on("mouseenter", (event, d) => {
        setHoveredNode(d);
        applyHighlight(d.id, true);
      })
      .on("mouseleave", () => {
        setHoveredNode(null);
        applyHighlight(selectedNodeId, false);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNodeId(d.id);
        applyHighlight(d.id, false);
      });

    // Canvas click clears selection
    svg.on("click", () => {
      setSelectedNodeId(null);
      setHoveredNode(null);
      applyHighlight(null, false);
    });

    // Simulation Ticks
    simulation.on("tick", () => {
      linkElements
        .attr("x1", d => (d.source as ForceNode).x!)
        .attr("y1", d => (d.source as ForceNode).y!)
        .attr("x2", d => (d.target as ForceNode).x!)
        .attr("y2", d => (d.target as ForceNode).y!);

      nodeElements.attr("transform", d => `translate(${d.x},${d.y})`);
    });

  }, [nodes, links, chargeStrength, linkDistance, isDarkMode, selectedNodeId]);

  // Trigger render on dependencies change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        renderD3Graph();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, renderD3Graph]);

  // Handle Simulation Pause/Play
  const toggleSimulation = () => {
    if (!simulationRef.current) return;
    if (isSimRunning) {
      simulationRef.current.stop();
      setIsSimRunning(false);
    } else {
      simulationRef.current.alpha(0.3).restart();
      setIsSimRunning(true);
    }
  };

  // Search Node and Highlight
  const handleSearchFocus = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSelectedNodeId(null);
      return;
    }
    const clean = query.trim().toLowerCase();
    const match = nodes.find(n => n.name.toLowerCase().includes(clean));
    if (match) {
      setSelectedNodeId(match.id);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div key="student-source-force-graph-overlay" className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden Network">
        
        {/* Backdrop Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative z-10 w-[96vw] h-[93vh] max-w-7xl rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
            isDarkMode 
              ? "bg-slate-950 border-slate-800 text-slate-100 shadow-black/80" 
              : "bg-white border-slate-200 text-slate-800 shadow-slate-300/80"
          }`}
        >
          {/* Header Bar */}
          <div className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 transition-colors ${
            isDarkMode ? "border-slate-800/80 bg-slate-900/60" : "border-slate-150 bg-slate-50/80"
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 shadow-xs">
                <Network className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>{hierarchyMode === "channel_major" ? "各专业与渠道引流力导向图" : "各专业生源地域归属流向图"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 font-mono font-bold">
                    D3 FORCE GRAPH
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {hierarchyMode === "channel_major" 
                    ? "全景剖析招生渠道 (方形节点) 与生源专业 (圆形节点) 之间的引流映射与网络拓扑"
                    : "全景剖析生源地域/省份 (胶囊/菱形节点) 与报考专业 (圆形节点) 之间的流向关联与分布维度"
                  }
                </p>
              </div>
            </div>

            {/* Quick KPI Bar & Close */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="hidden lg:flex items-center gap-4 text-xs font-mono px-3 py-1.5 rounded-xl border dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-sm ${hierarchyMode === "channel_major" ? "bg-indigo-600" : "bg-amber-500"}`} />
                  <span className="text-slate-400">{hierarchyMode === "channel_major" ? "渠道:" : "地域/省份:"}</span>
                  <span className={`font-bold ${hierarchyMode === "channel_major" ? "text-indigo-500" : "text-amber-500"}`}>{hubList.length}个</span>
                </div>
                <div className="flex items-center gap-1.5 border-l pl-3 dark:border-slate-800 border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">专业:</span>
                  <span className="font-bold text-emerald-500">{majorList.length}个</span>
                </div>
                <div className="flex items-center gap-1.5 border-l pl-3 dark:border-slate-800 border-slate-200">
                  <span className="text-slate-400">映射生源总数:</span>
                  <span className="font-bold text-indigo-500">{totalMappedStudents}人</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300" 
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600"
                }`}
                title="关闭窗口 (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className={`px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
            isDarkMode ? "border-slate-800/60 bg-slate-900/30" : "border-slate-150 bg-slate-50/40"
          }`}>
            
            {/* Hierarchy Level Switcher ("生源地域归属"层级开关) */}
            <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-300 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setHierarchyMode("channel_major");
                  setSelectedNodeId(null);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                  hierarchyMode === "channel_major"
                    ? "bg-indigo-600 text-white shadow-md font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>渠道 ↔ 专业拓扑</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHierarchyMode("region_major");
                  setSelectedNodeId(null);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer ${
                  hierarchyMode === "region_major"
                    ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>生源地域归属拓扑</span>
              </button>
            </div>

            {/* Time Scope Tabs (In channel mode) */}
            {hierarchyMode === "channel_major" && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTimeScope("current_month")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    timeScope === "current_month"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  本月 ({currentMonthStr})
                </button>
                <button
                  type="button"
                  onClick={() => setTimeScope("selected_date")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    timeScope === "selected_date"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  单日 ({selectedDate})
                </button>
                <button
                  type="button"
                  onClick={() => setTimeScope("all_history")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    timeScope === "all_history"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  历史全量
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchFocus(e.target.value)}
                placeholder={hierarchyMode === "channel_major" ? "搜索定位专业/渠道节点..." : "搜索定位专业/地域节点..."}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border outline-none font-bold text-xs transition-all ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 focus:border-indigo-500 text-slate-200" 
                    : "bg-white border-slate-200 focus:border-indigo-500 text-slate-800"
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => handleSearchFocus("")} 
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Simulation Physics Controls & Zoom Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Zoom Control Slider in Header */}
              <div className="hidden sm:flex items-center gap-1.5 border-r pr-3 dark:border-slate-800 border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <ZoomIn className="w-3 h-3 text-indigo-500" />
                  <span>缩放控制:</span>
                </span>
                <input 
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={zoomScale}
                  onChange={(e) => handleSliderZoomChange(Number(e.target.value))}
                  className="w-16 sm:w-24 accent-indigo-500 cursor-pointer"
                  title="手动调节图谱缩放，避免大数据节点重叠密集"
                />
                <span className="font-mono font-extrabold text-[11px] text-indigo-500 min-w-[32px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">排斥力:</span>
                <input 
                  type="range"
                  min="-500"
                  max="-50"
                  value={chargeStrength}
                  onChange={(e) => setChargeStrength(Number(e.target.value))}
                  className="w-16 accent-indigo-500 cursor-pointer"
                  title="调节力导向图中节点间排斥距离"
                />
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">连线距离:</span>
                <input 
                  type="range"
                  min="50"
                  max="250"
                  value={linkDistance}
                  onChange={(e) => setLinkDistance(Number(e.target.value))}
                  className="w-16 accent-indigo-500 cursor-pointer"
                  title="调节节点间默认物理长度"
                />
              </div>

              <button
                type="button"
                onClick={toggleSimulation}
                className={`px-2.5 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSimRunning
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                }`}
              >
                {isSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isSimRunning ? "冻结物理" : "启动物理"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-indigo-400" 
                    : "bg-white border-slate-200 hover:bg-slate-50 text-indigo-600"
                }`}
                title="快速回到初始展示位置与100%缩放"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置视图</span>
              </button>
            </div>
          </div>

          {/* Graph Content Body */}
          <div className="flex-1 relative overflow-hidden flex">
            
            {/* Main D3 SVG Canvas Area */}
            <div ref={containerRef} className="flex-1 h-full relative">
              <svg ref={svgRef} className="w-full h-full overflow-visible select-none" />

              {/* Floating Legend Overlay */}
              <div className={`absolute left-4 bottom-4 p-3 rounded-2xl border shadow-lg text-[11px] space-y-2 pointer-events-auto backdrop-blur-md ${
                isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-300" : "bg-white/90 border-slate-200 text-slate-700"
              }`}>
                <div className="font-extrabold text-xs border-b pb-1 dark:border-slate-800 border-slate-100 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>图例与节点说明</span>
                </div>
                {hierarchyMode === "channel_major" ? (
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 border border-white" />
                    <span>招生渠道 (Channel Hub 方形)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-3 rounded-xl bg-amber-500 border border-amber-300" />
                    <span>生源地域/省份 (Region Hub 胶囊/菱形)</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white" />
                  <span>报考专业 (Major Node 圆形)</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t dark:border-slate-800 border-slate-100">
                  💡 鼠标悬停任意节点可实时高亮全网络拓扑路径与明细数据。
                </div>
              </div>

              {/* Floating Canvas Zoom Toolbar */}
              <div className={`absolute right-4 bottom-4 px-3 py-2 rounded-2xl border shadow-xl flex items-center gap-2 z-20 backdrop-blur-md ${
                isDarkMode ? "bg-slate-900/90 border-slate-800 text-slate-300" : "bg-white/90 border-slate-200 text-slate-700"
              }`}>
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">缩放控制:</span>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-100 text-slate-800"
                  }`}
                  title="缩小视图 (-20%)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <input 
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={zoomScale}
                  onChange={(e) => handleSliderZoomChange(Number(e.target.value))}
                  className="w-20 accent-indigo-500 cursor-pointer"
                  title="手动拖动滑块缩放网络图谱"
                />

                <button
                  type="button"
                  onClick={handleZoomIn}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    isDarkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-100 text-slate-800"
                  }`}
                  title="放大视图 (+25%)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <span className="font-mono font-extrabold text-xs text-indigo-500 min-w-[36px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

                <button
                  type="button"
                  onClick={handleResetZoom}
                  className={`px-2.5 py-1 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer border ${
                    isDarkMode 
                      ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-indigo-300" 
                      : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700"
                  }`}
                  title="重置缩放与全图居中位置"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">重置视图</span>
                </button>
              </div>

              {/* Floating Hover Tooltip Card (Mouse Hover HUD) */}
              {hoveredNode && hoverMetrics && (
                <div 
                  className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-3 rounded-2xl border shadow-2xl text-xs backdrop-blur-xl transition-all duration-150 animate-in fade-in zoom-in-95 ${
                    isDarkMode 
                      ? "bg-slate-900/95 border-indigo-500/30 text-slate-100 shadow-indigo-950/40" 
                      : "bg-white/95 border-indigo-200 text-slate-800 shadow-slate-300/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 animate-ping" style={{ backgroundColor: hoveredNode.color }} />
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm tracking-tight">{hoveredNode.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          {hoveredNode.type === "channel" ? "招生渠道" : hoveredNode.type === "region" ? "生源地域/省份" : "报考专业"}
                        </span>
                      </div>
                      
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-0.5 font-mono">
                        <span>对应总人数: <strong className="text-emerald-500 font-extrabold text-xs">{hoveredNode.totalStudents} 人</strong></span>
                        <span>全盘占比: <strong className="text-amber-500 font-extrabold text-xs">{hoverMetrics.share}%</strong></span>
                      </div>
                    </div>

                    <div className="border-l pl-3 dark:border-slate-800 border-slate-200 text-right space-y-0.5 font-mono">
                      <div className="text-[10px] text-slate-400">
                        关联{hoveredNode.type === "major" ? (hierarchyMode === "channel_major" ? "渠道" : "地域") : "专业"}: <strong className="text-indigo-500 font-bold">{hoverMetrics.connectedCount} 个</strong>
                      </div>
                      {hoverMetrics.topConnectedName && (
                        <div className="text-[10px] text-slate-400">
                          峰值对接: <strong className="text-emerald-500">{hoverMetrics.topConnectedName} ({hoverMetrics.topConnectedCount}人)</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Detail Drawer */}
            <div className={`w-80 sm:w-96 border-l h-full p-5 overflow-y-auto shrink-0 flex flex-col justify-between transition-colors ${
              isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-slate-50/90 border-slate-200"
            }`}>
              {selectedNodeDetails ? (
                <div className="space-y-4">
                  {/* Selected Node Header */}
                  <div className="space-y-1 pb-3 border-b dark:border-slate-800 border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {selectedNodeDetails.node.type === "channel" 
                          ? "招生渠道节点详情" 
                          : selectedNodeDetails.node.type === "region" 
                          ? "生源地域/省份节点详情"
                          : "报考专业节点详情"
                        }
                      </span>
                      <button 
                        onClick={() => setSelectedNodeId(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        清空选中
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-md shrink-0 shadow-xs" style={{ backgroundColor: selectedNodeDetails.node.color }} />
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 truncate">
                        {selectedNodeDetails.node.name}
                      </h3>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs font-mono font-extrabold">
                      <span className="text-slate-400">对应招生总量:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 text-sm">
                        {selectedNodeDetails.total} 人
                      </span>
                    </div>
                  </div>

                  {/* Connected Nodes List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>{selectedNodeDetails.subTitle}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({selectedNodeDetails.connected.length} 项映射)
                      </span>
                    </h4>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1 thin-scrollbar">
                      {selectedNodeDetails.connected.map((item: any, idx: number) => (
                        <div 
                          key={`conn-${item.majorName || item.hubName || 'item'}-${idx}`}
                          className={`p-2.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                            isDarkMode ? "bg-slate-950/70 border-slate-800" : "bg-white border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-2 truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="truncate">{item.majorName || item.hubName}</span>
                            </span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0">
                              {item.count} 人 ({item.percentage}%)
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${item.percentage}%`,
                                backgroundColor: item.color 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
                  <div className="p-4 rounded-3xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <Share2 className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold">点击或悬停任意节点深入分析</h4>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      在左侧力导向网络拓扑图中悬停或点击节点，即可高亮全路径网络拓扑并穿透查看分流占比明细。
                    </p>
                  </div>
                </div>
              )}

              {/* Sidebar Footer Hint */}
              <div className="pt-4 border-t dark:border-slate-800 border-slate-200 text-[10px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-500 dark:text-slate-400">
                  <span>峰值引流连线:</span>
                  <span className="font-mono text-indigo-500">{topPair}</span>
                </div>
                <p className="leading-tight">
                  提示: 拖拽节点可调整物理布局，使用鼠标滚轮可缩放画布视图。
                </p>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
