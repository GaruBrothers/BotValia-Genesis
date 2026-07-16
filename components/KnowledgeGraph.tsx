'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, GitCommit, Network, Zap, ZoomIn, ZoomOut, Maximize2, Eye, EyeOff, Minimize2 } from 'lucide-react';

export interface GraphNode {
  id: string;
  name: string;
  type: 'product' | 'service' | 'policy' | 'contact' | 'concept' | 'metric';
  description: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onSelectNode?: (node: GraphNode) => void;
}

export default function KnowledgeGraph({ nodes = [], links = [], onSelectNode }: KnowledgeGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom, Pan & Drag States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    if (target.tagName === 'svg' || target.id === 'bg-click-surface') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const scaleFactor = 0.05;
    const direction = e.deltaY < 0 ? 1 : -1;
    setZoom(prev => {
      const next = prev + direction * scaleFactor;
      return Math.min(Math.max(next, 0.4), 3.0);
    });
  };

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      const width = containerRef.current?.clientWidth || 600;
      const height = containerRef.current?.clientHeight || 400;
      setDimensions({ width, height: Math.max(height, 350) });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute node coordinates in a beautiful circular or radial arrangement using useMemo
  const coords = React.useMemo(() => {
    if (nodes.length === 0) return {};

    const newCoords: Record<string, { x: number; y: number }> = {};
    const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
    
    // Hub-and-Spoke structure: find central concept node or default to the first node
    const hubNode = nodes.find(n => n.type === 'concept') || nodes[0];
    newCoords[hubNode.id] = { x: center.x, y: center.y };

    // Radial placement for spokes
    const spokeNodes = nodes.filter(n => n.id !== hubNode.id);
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    spokeNodes.forEach((node, idx) => {
      const angle = (idx / spokeNodes.length) * 2 * Math.PI;
      newCoords[node.id] = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
    });

    return newCoords;
  }, [nodes, dimensions]);

  // Hidden nodes (for collapsing children)
  const [hiddenNodeIds, setHiddenNodeIds] = useState<Set<string>>(new Set());

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: GraphNode | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    node: null
  });

  // Automatically close context menu on external clicks
  useEffect(() => {
    const handleWindowClick = () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Context Menu handlers
  const handleNodeContextMenu = (e: React.MouseEvent, node: GraphNode) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setContextMenu({
      visible: true,
      x,
      y,
      node
    });
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setContextMenu({
      visible: true,
      x,
      y,
      node: null
    });
  };

  // Node operations
  const handleCenterView = (node: GraphNode) => {
    const pos = coords[node.id];
    if (!pos) return;

    // Center on node under current zoom
    const targetX = -zoom * (pos.x - dimensions.width / 2);
    const targetY = -zoom * (pos.y - dimensions.height / 2);

    setPan({ x: targetX, y: targetY });
  };

  const handleCollapseChildren = (nodeId: string) => {
    const hubNode = nodes.find(n => n.type === 'concept') || nodes[0];
    const hubId = hubNode?.id;

    const childrenToHide = links
      .filter(link => link.source === nodeId || link.target === nodeId)
      .map(link => link.source === nodeId ? link.target : link.source)
      .filter(id => id !== nodeId && id !== hubId);

    setHiddenNodeIds(prev => {
      const next = new Set(prev);
      childrenToHide.forEach(id => next.add(id));
      return next;
    });
  };

  const handleExpandNodeRelationships = (nodeId: string) => {
    const childrenToShow = links
      .filter(link => link.source === nodeId || link.target === nodeId)
      .map(link => link.source === nodeId ? link.target : link.source);

    setHiddenNodeIds(prev => {
      const next = new Set(prev);
      childrenToShow.forEach(id => next.delete(id));
      return next;
    });
  };

  const handleExpandAll = () => {
    setHiddenNodeIds(new Set());
  };

  const getNodeColor = (type: string, isHoveredOrSelected: boolean) => {
    const opacity = isHoveredOrSelected ? '1' : '0.85';
    switch (type) {
      case 'product':
        return `rgba(6, 182, 212, ${opacity})`; // Cyan
      case 'service':
        return `rgba(168, 85, 247, ${opacity})`; // Purple
      case 'policy':
        return `rgba(234, 179, 8, ${opacity})`; // Amber
      case 'contact':
        return `rgba(16, 185, 129, ${opacity})`; // Emerald
      case 'concept':
        return `rgba(236, 72, 153, ${opacity})`; // Rose
      default:
        return `rgba(59, 130, 246, ${opacity})`; // Blue
    }
  };

  const getGlowColor = (type: string) => {
    switch (type) {
      case 'product': return 'rgba(6, 182, 212, 0.4)';
      case 'service': return 'rgba(168, 85, 247, 0.4)';
      case 'policy': return 'rgba(234, 179, 8, 0.4)';
      case 'contact': return 'rgba(16, 185, 129, 0.4)';
      case 'concept': return 'rgba(236, 72, 153, 0.4)';
      default: return 'rgba(59, 130, 246, 0.4)';
    }
  };

  const selectedNode = selectedNodeId && !hiddenNodeIds.has(selectedNodeId)
    ? nodes.find(n => n.id === selectedNodeId)
    : undefined;

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-950/80 border border-slate-800 rounded-xl">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Floating Sparkles Ambient */}
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none ambient-blue" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none ambient-purple" />

      {/* Main Canvas Area */}
      <div className="relative flex-1 h-[380px] md:h-auto min-h-[350px]">
        {Object.keys(coords).length > 0 && (
          <svg
            width="100%"
            height="100%"
            className={`absolute inset-0 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onWheel={handleWheel}
            onContextMenu={handleBackgroundContextMenu}
          >
            {/* Filters for neon drop shadow glow */}
            <defs>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Click Surface for panning & deselecting */}
            <rect
              id="bg-click-surface"
              width="100%"
              height="100%"
              fill="transparent"
              onClick={() => setSelectedNodeId(null)}
            />

            {/* Render with Zoom and Pan transforms */}
            <g transform={`translate(${dimensions.width / 2 + pan.x}, ${dimensions.height / 2 + pan.y}) scale(${zoom}) translate(${-dimensions.width / 2}, ${-dimensions.height / 2})`}>

            {/* Render Links / Connections */}
            {links.map((link, idx) => {
              if (hiddenNodeIds.has(link.source) || hiddenNodeIds.has(link.target)) return null;
              const start = coords[link.source];
              const end = coords[link.target];
              if (!start || !end) return null;

              const isHighlighted = 
                selectedNodeId === link.source || selectedNodeId === link.target ||
                hoveredNodeId === link.source || hoveredNodeId === link.target;

              return (
                <g key={`link-${idx}`}>
                  {/* Glowing background line on hover/select */}
                  {isHighlighted && (
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="rgba(6, 182, 212, 0.25)"
                      strokeWidth={5}
                      className="transition-all duration-300"
                    />
                  )}
                  {/* Standard connection line */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={isHighlighted ? "rgba(6, 182, 212, 0.6)" : "rgba(255, 255, 255, 0.08)"}
                    strokeWidth={isHighlighted ? 1.5 : 1}
                    strokeDasharray={link.label === 'governed_by' ? "4,4" : "0"}
                    className="transition-all duration-300"
                  />
                  {/* Animated traveling particles along active lines */}
                  {isHighlighted && (
                    <circle r="3" fill="#22d3ee" className="glow-particle">
                      <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                      />
                    </circle>
                  )}
                  {/* Line labels at midpoints */}
                  {isHighlighted && (
                    <g transform={`translate(${(start.x + end.x) / 2}, ${(start.y + end.y) / 2 - 6})`}>
                      <rect
                        x="-45"
                        y="-8"
                        width="90"
                        height="16"
                        rx="4"
                        fill="rgba(15, 23, 42, 0.85)"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        className="text-[9px] font-mono fill-slate-300 font-medium select-none"
                        y="3"
                      >
                        {link.label.toUpperCase()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {nodes.map((node) => {
              if (hiddenNodeIds.has(node.id)) return null;
              const pos = coords[node.id];
              if (!pos) return null;

              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isRelated = 
                selectedNodeId && 
                links.some(l => 
                  (l.source === selectedNodeId && l.target === node.id) ||
                  (l.target === selectedNodeId && l.source === node.id)
                );

              const color = getNodeColor(node.type, isSelected || isHovered);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
                    if (onSelectNode) onSelectNode(node);
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onContextMenu={(e) => handleNodeContextMenu(e, node)}
                >
                  {/* Pulse Ring under selected or central nodes */}
                  {(isSelected || node.type === 'concept') && (
                    <circle
                      r={isSelected ? 26 : 22}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      opacity="0.3"
                    >
                      <animate
                        attributeName="r"
                        values={`${isSelected ? 26 : 22}; ${isSelected ? 44 : 36}; ${isSelected ? 26 : 22}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4; 0; 0.4"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Outer Glow Circle */}
                  <circle
                    r={isSelected ? 16 : 12}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={isSelected ? 4 : 2}
                    style={{
                      filter: isSelected || isHovered ? 'url(#glow-cyan)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />

                  {/* Core Circle */}
                  <circle
                    r={isSelected ? 10 : 8}
                    fill={color}
                    className="transition-all duration-300"
                  />

                  {/* Label background for readability */}
                  <g transform={`translate(0, ${isSelected ? 28 : 22})`}>
                    <rect
                      x={-(node.name.length * 3.5) - 6}
                      y="-10"
                      width={(node.name.length * 7) + 12}
                      height="18"
                      rx="6"
                      fill="rgba(15, 23, 42, 0.8)"
                      stroke={isSelected ? "rgba(6, 182, 212, 0.3)" : "rgba(255, 255, 255, 0.05)"}
                      strokeWidth="1"
                      className="transition-all duration-300"
                    />
                    <text
                      textAnchor="middle"
                      className={`text-[10px] font-sans font-semibold select-none transition-colors duration-300 ${
                        isSelected ? "fill-cyan-400" : isHovered ? "fill-slate-100" : "fill-slate-300"
                      }`}
                      y="2"
                    >
                      {node.name}
                    </text>
                  </g>
                </g>
              );
            })}
            </g>
          </svg>
        )}

        {/* Floating Zoom & Pan Controls overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg shadow-xl select-none z-10">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.15, 3))}
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors"
            title="Acercar (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.4))}
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors"
            title="Alejar (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors"
            title="Restablecer vista (Reset)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="text-[8px] font-mono text-slate-600 text-center mt-1 border-t border-slate-850 pt-1">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Legend in the corner */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 max-w-xs bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-[9px] font-mono select-none">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>PRODUCTO</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>SERVICIO</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>POLÍTICA</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>CONTACTO</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>NÚCLEO</span>
          </div>
        </div>

        {/* Instructive overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/40 px-2 py-1 rounded border border-slate-800/60 pointer-events-none">
          <Network className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>MAPA DE CONOCIMIENTO INTERACTIVO</span>
        </div>

        {/* Context Menu Overlay */}
        <AnimatePresence>
          {contextMenu.visible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
              className="absolute z-50 min-w-[220px] bg-slate-950/95 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 select-none font-mono"
            >
              {contextMenu.node ? (
                // NODE SPECIFIC OPTIONS
                <>
                  <div className="px-2.5 py-1.5 text-[9px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-900 mb-1">
                    Entidad: {contextMenu.node.name}
                  </div>
                  
                  <button
                    onClick={() => {
                      if (contextMenu.node) {
                        handleCenterView(contextMenu.node);
                        setSelectedNodeId(contextMenu.node.id);
                        if (onSelectNode) onSelectNode(contextMenu.node);
                      }
                      setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-cyan-400 hover:bg-slate-900/60 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Centrar vista en nodo</span>
                  </button>

                  <button
                    onClick={() => {
                      if (contextMenu.node) {
                        handleCollapseChildren(contextMenu.node.id);
                      }
                      setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-red-400" />
                    <span>Contraer dependientes</span>
                  </button>

                  <button
                    onClick={() => {
                      if (contextMenu.node) {
                        handleExpandNodeRelationships(contextMenu.node.id);
                      }
                      setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/5 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Expandir relaciones</span>
                  </button>
                </>
              ) : (
                // CANVAS GENERAL OPTIONS
                <>
                  <div className="px-2.5 py-1.5 text-[9px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-900 mb-1">
                    Acciones del Lienzo
                  </div>

                  <button
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                      setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-cyan-400 hover:bg-slate-900/60 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Restablecer vista</span>
                  </button>
                </>
              )}

              {/* COMMON OPTIONS */}
              <div className="border-t border-slate-900 my-1" />
              
              <button
                onClick={() => {
                  handleExpandAll();
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-purple-400 hover:bg-purple-500/5 rounded-lg transition-colors text-left cursor-pointer"
              >
                <Network className="w-3.5 h-3.5 text-purple-400" />
                <span>Mostrar todo el mapa</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Detail Inspector */}
      <AnimatePresence mode="wait">
        {selectedNode ? (
          <motion.div
            key={selectedNode.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider"
                  style={{
                    backgroundColor: `${getNodeColor(selectedNode.type, false)}20`,
                    color: getNodeColor(selectedNode.type, true),
                    border: `1px solid ${getNodeColor(selectedNode.type, false)}30`
                  }}
                >
                  {selectedNode.type === 'product' ? 'PRODUCTO' :
                   selectedNode.type === 'service' ? 'SERVICIO' :
                   selectedNode.type === 'policy' ? 'POLÍTICA' :
                   selectedNode.type === 'contact' ? 'CONTACTO' :
                   selectedNode.type === 'concept' ? 'NÚCLEO' :
                   selectedNode.type.toUpperCase()}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">ID: {selectedNode.id}</span>
              </div>
              <h4 className="text-sm font-display font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                {selectedNode.name}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {selectedNode.description}
              </p>
            </div>
            
            <div className="border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Info className="w-3 h-3 text-cyan-500" />
                <span>Haz clic en espacio vacío para deseleccionar</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-inspector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/40 p-4 flex flex-col items-center justify-center text-center text-xs text-slate-500 font-mono"
          >
            <GitCommit className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
            <p>Haz clic en cualquier nodo para inspeccionar propiedades semánticas y registros de entidad</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
