import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil,
  Eraser,
  Minus,
  Square,
  Circle,
  ArrowRight,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
} from 'lucide-react';

const COLORS = [
  { id: '#ffffff', label: 'White' },
  { id: '#94a3b8', label: 'Slate' },
  { id: '#3b82f6', label: 'Blue' },
  { id: '#a855f7', label: 'Purple' },
  { id: '#10b981', label: 'Emerald' },
  { id: '#f59e0b', label: 'Amber' },
  { id: '#f43f5e', label: 'Rose' },
  { id: '#06b6d4', label: 'Cyan' },
];

const STROKE_WIDTHS = [
  { id: 2, label: 'Thin', dotSize: 3 },
  { id: 4, label: 'Medium', dotSize: 5 },
  { id: 8, label: 'Thick', dotSize: 8 },
];

export default function Whiteboard({
  whiteboard,
  isActive = true,
  isExpanded = false,
  onToggleExpand,
}) {
  const {
    objects,
    remoteCursors,
    canUndo,
    canRedo,
    addObject,
    deleteObject,
    clearBoard,
    sendCursor,
    undo,
    redo,
  } = whiteboard;

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Active Tool State
  const [activeTool, setActiveTool] = useState('pen'); // 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'pan'
  const [activeColor, setActiveColor] = useState('#3b82f6');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(3);

  // Zoom & Pan transformation state
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // In-progress drawing state
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const currentPointsRef = useRef([]);
  const shapeStartRef = useRef({ x: 0, y: 0 });

  // Text tool inline input state
  const [textInput, setTextInput] = useState(null); // { x, y, canvasX, canvasY, value }
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  /**
   * Convert Screen / Viewport coordinates to Canvas virtual coordinates
   */
  const screenToCanvas = useCallback(
    (screenX, screenY) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: screenX, y: screenY };

      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - panOffset.x) / scale;
      const y = (screenY - rect.top - panOffset.y) / scale;
      return { x, y };
    },
    [panOffset, scale]
  );

  /**
   * Helper: draw an arrow head on 2D context
   */
  const drawArrowHead = (ctx, startX, startY, endX, endY, headLength = 12) => {
    const angle = Math.atan2(endY - startY, endX - startX);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  /**
   * Render all committed whiteboard objects onto canvas
   */
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Dark grid background
    ctx.fillStyle = '#0f141f';
    ctx.fillRect(0, 0, width, height);

    // Apply scale and pan transform
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr * scale, dpr * scale);
    ctx.translate(panOffset.x / scale, panOffset.y / scale);

    // Draw subtle grid dots
    const dotSpacing = 32;
    const startX = Math.floor(-panOffset.x / scale / dotSpacing) * dotSpacing;
    const startY = Math.floor(-panOffset.y / scale / dotSpacing) * dotSpacing;
    const endX = startX + (width / (dpr * scale)) + dotSpacing * 2;
    const endY = startY + (height / (dpr * scale)) + dotSpacing * 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let gx = startX; gx < endX; gx += dotSpacing) {
      for (let gy = startY; gy < endY; gy += dotSpacing) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render committed drawing objects
    for (const obj of objects) {
      ctx.strokeStyle = obj.color || '#ffffff';
      ctx.fillStyle = obj.color || '#ffffff';
      ctx.lineWidth = obj.strokeWidth || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (obj.type === 'pen' && obj.points?.length > 0) {
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        ctx.stroke();
      } else if (obj.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(obj.startX, obj.startY);
        ctx.lineTo(obj.endX, obj.endY);
        ctx.stroke();
      } else if (obj.type === 'rectangle') {
        const x = Math.min(obj.startX, obj.endX);
        const y = Math.min(obj.startY, obj.endY);
        const w = Math.abs(obj.endX - obj.startX);
        const h = Math.abs(obj.endY - obj.startY);
        ctx.strokeRect(x, y, w, h);
      } else if (obj.type === 'circle') {
        const centerX = (obj.startX + obj.endX) / 2;
        const centerY = (obj.startY + obj.endY) / 2;
        const radiusX = Math.abs(obj.endX - obj.startX) / 2;
        const radiusY = Math.abs(obj.endY - obj.startY) / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.max(radiusX, 1), Math.max(radiusY, 1), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (obj.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(obj.startX, obj.startY);
        ctx.lineTo(obj.endX, obj.endY);
        ctx.stroke();
        drawArrowHead(ctx, obj.startX, obj.startY, obj.endX, obj.endY, Math.max(12, (obj.strokeWidth || 2) * 3));
      } else if (obj.type === 'text') {
        const fontSize = obj.fontSize || 16;
        ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`;
        ctx.textBaseline = 'top';
        const lines = (obj.text || '').split('\n');
        lines.forEach((line, idx) => {
          ctx.fillText(line, obj.x, obj.y + idx * (fontSize * 1.3));
        });
      }
    }

    ctx.restore();
  }, [objects, panOffset, scale]);

  // Sync canvas size on mount / window resize
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        handleResize();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, [handleResize]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  /**
   * Check if a point hits an object (for Eraser tool)
   */
  const findObjectAtPoint = (pt) => {
    const threshold = 12;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      if (obj.type === 'pen' && obj.points) {
        for (const p of obj.points) {
          if (Math.hypot(p.x - pt.x, p.y - pt.y) <= threshold) {
            return obj.id;
          }
        }
      } else if (obj.type === 'line' || obj.type === 'arrow') {
        // Line distance check
        const { startX, startY, endX, endY } = obj;
        const dist = distToSegment(pt.x, pt.y, startX, startY, endX, endY);
        if (dist <= threshold) return obj.id;
      } else if (obj.type === 'rectangle') {
        const minX = Math.min(obj.startX, obj.endX);
        const maxX = Math.max(obj.startX, obj.endX);
        const minY = Math.min(obj.startY, obj.endY);
        const maxY = Math.max(obj.startY, obj.endY);

        if (
          pt.x >= minX - threshold &&
          pt.x <= maxX + threshold &&
          pt.y >= minY - threshold &&
          pt.y <= maxY + threshold
        ) {
          return obj.id;
        }
      } else if (obj.type === 'circle') {
        const cx = (obj.startX + obj.endX) / 2;
        const cy = (obj.startY + obj.endY) / 2;
        const rx = Math.abs(obj.endX - obj.startX) / 2;
        const ry = Math.abs(obj.endY - obj.startY) / 2;
        const normDist = Math.hypot((pt.x - cx) / Math.max(rx, 1), (pt.y - cy) / Math.max(ry, 1));
        if (Math.abs(normDist - 1) <= 0.25 || normDist <= 1) {
          return obj.id;
        }
      } else if (obj.type === 'text') {
        if (
          pt.x >= obj.x - 10 &&
          pt.x <= obj.x + 200 &&
          pt.y >= obj.y - 10 &&
          pt.y <= obj.y + 40
        ) {
          return obj.id;
        }
      }
    }
    return null;
  };

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  // ── Mouse & Touch Event Handlers ──────────────────────────────
  const handlePointerDown = (e) => {
    if (!isActive) return;

    // Pan with space or Hand tool or middle mouse click
    if (activeTool === 'pan' || e.button === 1 || e.spaceKey) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (e.button !== 0) return; // Only primary mouse button

    const canvasPt = screenToCanvas(e.clientX, e.clientY);

    // Eraser Tool
    if (activeTool === 'eraser') {
      const hitId = findObjectAtPoint(canvasPt);
      if (hitId) {
        deleteObject(hitId);
      }
      return;
    }

    // Text Tool: open inline text input
    if (activeTool === 'text') {
      const containerRect = containerRef.current.getBoundingClientRect();
      setTextInput({
        screenX: e.clientX - containerRect.left,
        screenY: e.clientY - containerRect.top,
        canvasX: canvasPt.x,
        canvasY: canvasPt.y,
        value: '',
      });
      return;
    }

    // Start drawing
    isDrawingRef.current = true;
    shapeStartRef.current = canvasPt;

    if (activeTool === 'pen') {
      currentPointsRef.current = [canvasPt];
    }
  };

  const handlePointerMove = (e) => {
    const canvasPt = screenToCanvas(e.clientX, e.clientY);

    // Emit live cursor coordinates
    sendCursor(canvasPt.x, canvasPt.y);

    // Handle Panning
    if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (!isDrawingRef.current || !isActive) return;

    // Eraser continuous dragging
    if (activeTool === 'eraser') {
      const hitId = findObjectAtPoint(canvasPt);
      if (hitId) {
        deleteObject(hitId);
      }
      return;
    }

    if (activeTool === 'pen') {
      currentPointsRef.current.push(canvasPt);
    }

    // Render live active drawing preview on canvas
    renderCanvas();
    drawLivePreview(canvasPt);
  };

  const handlePointerUp = (e) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (!isDrawingRef.current || !isActive) return;
    isDrawingRef.current = false;

    const canvasPt = screenToCanvas(e.clientX, e.clientY);

    if (activeTool === 'pen' && currentPointsRef.current.length > 1) {
      addObject({
        type: 'pen',
        points: currentPointsRef.current,
        color: activeColor,
        strokeWidth: activeStrokeWidth,
      });
      currentPointsRef.current = [];
    } else if (['line', 'rectangle', 'circle', 'arrow'].includes(activeTool)) {
      const start = shapeStartRef.current;
      const end = canvasPt;
      // Minimum drag check
      if (Math.hypot(end.x - start.x, end.y - start.y) > 3) {
        addObject({
          type: activeTool,
          startX: start.x,
          startY: start.y,
          endX: end.x,
          endY: end.y,
          color: activeColor,
          strokeWidth: activeStrokeWidth,
        });
      }
    }

    renderCanvas();
  };

  /**
   * Draw temporary live preview of in-progress stroke / shape
   */
  const drawLivePreview = (currentPt) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.scale(dpr * scale, dpr * scale);
    ctx.translate(panOffset.x / scale, panOffset.y / scale);

    ctx.strokeStyle = activeColor;
    ctx.fillStyle = activeColor;
    ctx.lineWidth = activeStrokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'pen' && currentPointsRef.current.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentPointsRef.current[0].x, currentPointsRef.current[0].y);
      for (let i = 1; i < currentPointsRef.current.length; i++) {
        ctx.lineTo(currentPointsRef.current[i].x, currentPointsRef.current[i].y);
      }
      ctx.stroke();
    } else if (activeTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(shapeStartRef.current.x, shapeStartRef.current.y);
      ctx.lineTo(currentPt.x, currentPt.y);
      ctx.stroke();
    } else if (activeTool === 'rectangle') {
      const x = Math.min(shapeStartRef.current.x, currentPt.x);
      const y = Math.min(shapeStartRef.current.y, currentPt.y);
      const w = Math.abs(currentPt.x - shapeStartRef.current.x);
      const h = Math.abs(currentPt.y - shapeStartRef.current.y);
      ctx.strokeRect(x, y, w, h);
    } else if (activeTool === 'circle') {
      const cx = (shapeStartRef.current.x + currentPt.x) / 2;
      const cy = (shapeStartRef.current.y + currentPt.y) / 2;
      const rx = Math.abs(currentPt.x - shapeStartRef.current.x) / 2;
      const ry = Math.abs(currentPt.y - shapeStartRef.current.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (activeTool === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(shapeStartRef.current.x, shapeStartRef.current.y);
      ctx.lineTo(currentPt.x, currentPt.y);
      ctx.stroke();
      drawArrowHead(ctx, shapeStartRef.current.x, shapeStartRef.current.y, currentPt.x, currentPt.y);
    }

    ctx.restore();
  };

  /**
   * Commit typed text annotation
   */
  const handleCommitText = () => {
    if (textInput && textInput.value.trim() && isActive) {
      addObject({
        type: 'text',
        x: textInput.canvasX,
        y: textInput.canvasY,
        text: textInput.value.trim(),
        color: activeColor,
        fontSize: 16,
      });
    }
    setTextInput(null);
  };

  /**
   * Zoom Controls
   */
  const handleZoom = (delta) => {
    setScale((prev) => Math.max(0.25, Math.min(3, prev + delta)));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  /**
   * Download Canvas as PNG
   */
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `codesync-whiteboard-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0c1017] border-l border-white/[0.08] relative overflow-hidden select-none">
      {/* ── Whiteboard Sub-Header / Tool Controls ────────────── */}
      <div className="h-11 shrink-0 border-b border-white/[0.08] bg-[#0c1017] px-3 sm:px-4 flex items-center justify-between gap-2 z-20">
        {/* Left: Tools Selection */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* Hand / Pan */}
          <button
            type="button"
            onClick={() => setActiveTool('pan')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === 'pan'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
            }`}
            title="Pan Hand Tool"
          >
            <Hand className="h-3.5 w-3.5" />
          </button>

          {/* Pen */}
          <button
            type="button"
            onClick={() => setActiveTool('pen')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === 'pen'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
            }`}
            title="Pen / Freehand Draw"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          {/* Eraser */}
          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === 'eraser'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
            }`}
            title="Eraser"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

          {/* Line */}
          <button
            type="button"
            onClick={() => setActiveTool('line')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === 'line'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
            }`}
            title="Line Tool"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          {/* Rectangle */}
          <button
            type="button"
            onClick={() => setActiveTool('rectangle')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === 'rectangle'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
            }`}
            title="Rectangle Tool"
          >
            <Square className="h-3.5 w-3.5" />
          </button>

          {/* Circle */}
          <button
            type="button"
            onClick={() => setActiveTool('circle')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === 'circle'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
            }`}
            title="Circle Tool"
          >
            <Circle className="h-3.5 w-3.5" />
          </button>

          {/* Arrow */}
          <button
            type="button"
            onClick={() => setActiveTool('arrow')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === 'arrow'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
            }`}
            title="Arrow Tool"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* Text */}
          <button
            type="button"
            onClick={() => setActiveTool('text')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === 'text'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
            }`}
            title="Text Tool"
          >
            <Type className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Center: Color & Stroke Selectors */}
        <div className="hidden xl:flex items-center gap-2">
          {/* Colors */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-light/40 border border-white/[0.06]">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveColor(c.id)}
                style={{ backgroundColor: c.id }}
                className={`h-4 w-4 rounded-full transition transform hover:scale-110 ${
                  activeColor === c.id ? 'ring-2 ring-white ring-offset-1 ring-offset-bg scale-110' : ''
                }`}
                title={c.label}
              />
            ))}
          </div>

          {/* Stroke Widths */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-light/40 border border-white/[0.06]">
            {STROKE_WIDTHS.map((sw) => (
              <button
                key={sw.id}
                type="button"
                onClick={() => setActiveStrokeWidth(sw.id)}
                className={`h-5 w-5 rounded flex items-center justify-center transition ${
                  activeStrokeWidth === sw.id
                    ? 'bg-white/20 text-white'
                    : 'text-text-muted hover:text-text'
                }`}
                title={`${sw.label} stroke`}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: sw.dotSize, height: sw.dotSize }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Undo/Redo, Zoom, Clear, Export, Fullscreen */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Undo */}
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.06] transition disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.06] transition disabled:opacity-30 disabled:hover:bg-transparent"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-white/[0.08] mx-0.5 hidden sm:block" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => handleZoom(-0.1)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.06] transition hidden sm:inline-flex"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>

          {/* Zoom Percentage */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted hover:text-text transition hidden sm:inline-flex"
            title="Click to Reset Zoom (100%)"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => handleZoom(0.1)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.06] transition hidden sm:inline-flex"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

          {/* Clear Board */}
          {isActive && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
              title="Clear Whiteboard"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExportPNG}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.06] transition"
            title="Export Whiteboard as Image (PNG)"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Toggle Expand / Fullscreen */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className={`p-1.5 rounded-lg transition ${
                isExpanded
                  ? 'bg-primary/20 text-primary-light'
                  : 'text-text-muted hover:text-text hover:bg-white/[0.06]'
              }`}
              title={isExpanded ? 'Restore Split View' : 'Expand Whiteboard Fullscreen'}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Canvas Container ──────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`flex-1 relative overflow-hidden bg-[#0f141f] ${
          activeTool === 'pan'
            ? 'cursor-grab active:cursor-grabbing'
            : activeTool === 'eraser'
            ? 'cursor-cell'
            : activeTool === 'text'
            ? 'cursor-text'
            : 'cursor-crosshair'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <canvas ref={canvasRef} className="block absolute inset-0 touch-none" />

        {/* Inline Text Input Overlay (when text tool is clicked) */}
        {textInput && (
          <div
            className="absolute z-30"
            style={{ left: textInput.screenX, top: textInput.screenY }}
          >
            <div className="flex flex-col gap-1 p-1 rounded-lg bg-surface/95 border border-primary/50 shadow-2xl backdrop-blur-xl">
              <input
                autoFocus
                type="text"
                placeholder="Type label & press Enter..."
                value={textInput.value}
                onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitText();
                  if (e.key === 'Escape') setTextInput(null);
                }}
                className="bg-transparent text-white px-2.5 py-1 text-xs outline-none font-mono min-w-[180px]"
              />
              <div className="flex items-center justify-between px-2 pb-1 text-[10px] text-text-muted">
                <span>Enter ↵ to place</span>
                <button
                  type="button"
                  onClick={handleCommitText}
                  className="text-primary-light hover:underline font-semibold"
                >
                  Place
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remote Live Cursors Overlay */}
        {remoteCursors.map((cursor, idx) => {
          const screenX = cursor.x * scale + panOffset.x;
          const screenY = cursor.y * scale + panOffset.y;

          return (
            <div
              key={cursor.userId || idx}
              className="absolute pointer-events-none transition-all duration-75 z-20"
              style={{
                transform: `translate(${screenX}px, ${screenY}px)`,
              }}
            >
              {/* Cursor SVG */}
              <svg
                className="h-4 w-4 text-primary fill-primary drop-shadow-md"
                viewBox="0 0 24 24"
              >
                <path d="M4 4l7 17 2-7 7-2L4 4z" />
              </svg>
              {/* User Name Tag */}
              <span className="inline-block mt-0.5 ml-3 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/90 text-white shadow-md">
                {cursor.userName}
              </span>
            </div>
          );
        })}

        {/* Floating Controls Overlay (Color palette on smaller screens) */}
        <div className="xl:hidden absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-surface/90 border border-white/[0.08] backdrop-blur-xl shadow-xl">
          {COLORS.slice(0, 5).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveColor(c.id)}
              style={{ backgroundColor: c.id }}
              className={`h-4 w-4 rounded-full transition transform ${
                activeColor === c.id ? 'ring-2 ring-white ring-offset-1 ring-offset-bg scale-110' : ''
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Clear Board Confirmation Modal ────────────────────── */}
      {showClearConfirm && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full rounded-2xl border border-rose-500/30 bg-surface/95 p-6 space-y-4 shadow-2xl backdrop-blur-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text">Clear Whiteboard?</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                This will delete all drawing strokes, shapes, and annotations on the canvas for all participants in this room.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs font-medium text-text hover:bg-white/[0.04] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearBoard();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-semibold text-white shadow-md transition"
              >
                Clear for All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
