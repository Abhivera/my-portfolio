import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Eraser,
  Lock,
  Minus,
  Pen,
  Plus,
  Redo2,
  RotateCcw,
  Trash2,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InkData, InkPoint, InkStroke } from "../../../lib/notepad/types";
import {
  DEFAULT_INK_COLOR,
  DEFAULT_STROKE_WIDTH,
  INK_STROKE_COLORS,
  STROKE_WIDTH_PRESETS,
  drawStroke,
  parseInkData,
  renderInkData,
  serializeInkData,
} from "@/lib/ink-utils";
import {
  DEFAULT_PRESSURE_SENSITIVITY,
  MAX_PRESSURE_SENSITIVITY,
  MIN_PRESSURE_SENSITIVITY,
  collectCoalescedPoints,
  isDrawablePointer,
  isPenEraserButton,
  normalizePointerPoint,
} from "@/lib/stylus-utils";

type StylusCanvasProps = {
  inkData?: string;
  onInkChange?: (inkData: string | undefined) => void;
  className?: string;
  readOnly?: boolean;
  fillHeight?: boolean;
};

type DrawTool = "pen" | "eraser";

const POINT_EPSILON = 0.0008;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

/** Excalidraw-like active accent */
const ACTIVE_BG = "bg-[#e7e5ff]";
const ACTIVE_TEXT = "text-[#5b57d1]";

function isNearDuplicate(a: InkPoint, b: InkPoint): boolean {
  return Math.abs(a.x - b.x) < POINT_EPSILON && Math.abs(a.y - b.y) < POINT_EPSILON;
}

function ToolButton({
  active,
  onClick,
  label,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        active
          ? cn(ACTIVE_BG, ACTIVE_TEXT)
          : "text-[#1b1b1f]/70 hover:bg-black/[0.04] hover:text-[#1b1b1f]",
      )}
    >
      {children}
    </button>
  );
}

function PanelSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-[#1b1b1f]/55">{label}</p>
      {children}
    </div>
  );
}

export function StylusCanvas({
  inkData,
  onInkChange,
  className,
  readOnly = false,
  fillHeight = false,
}: StylusCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<InkData>(parseInkData(inkData));
  const redoStackRef = useRef<InkStroke[][]>([]);
  const activeStrokeRef = useRef<InkStroke | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const penRecentlyUsedRef = useRef(false);
  const penCooldownRef = useRef<number | null>(null);
  const rawUpdateSupportedRef = useRef(false);
  const stylusOnlyRef = useRef(true);
  const strokeWidthRef = useRef(DEFAULT_STROKE_WIDTH);
  const strokeColorRef = useRef(DEFAULT_INK_COLOR);
  const opacityRef = useRef(1);
  const toolRef = useRef<DrawTool>("pen");
  const pressureSensitivityRef = useRef(DEFAULT_PRESSURE_SENSITIVITY);
  const paintRafRef = useRef<number | null>(null);

  const [tool, setTool] = useState<DrawTool>("pen");
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [strokeColor, setStrokeColor] = useState(DEFAULT_INK_COLOR);
  const [opacity, setOpacity] = useState(100);
  const [stylusOnly, setStylusOnly] = useState(true);
  const [pressureSensitivity, setPressureSensitivity] = useState(
    DEFAULT_PRESSURE_SENSITIVITY,
  );
  const [hasInk, setHasInk] = useState(inkRef.current.strokes.length > 0);
  const [canRedo, setCanRedo] = useState(false);
  const [penSeen, setPenSeen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showProps, setShowProps] = useState(true);

  const onInkChangeRef = useRef(onInkChange);
  const lastEmittedInkRef = useRef<string | undefined>(inkData);
  const emitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onInkChangeRef.current = onInkChange;
  }, [onInkChange]);

  useEffect(() => {
    stylusOnlyRef.current = stylusOnly;
  }, [stylusOnly]);

  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);

  useEffect(() => {
    strokeColorRef.current = strokeColor;
  }, [strokeColor]);

  useEffect(() => {
    opacityRef.current = opacity / 100;
  }, [opacity]);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    pressureSensitivityRef.current = pressureSensitivity;
  }, [pressureSensitivity]);

  const flushInkToParent = useCallback((serialized: string | undefined) => {
    lastEmittedInkRef.current = serialized;
    onInkChangeRef.current?.(serialized);
  }, []);

  const commitInk = useCallback(
    (immediate = false) => {
      const serialized = serializeInkData(inkRef.current);
      setHasInk(inkRef.current.strokes.length > 0);
      lastEmittedInkRef.current = serialized;

      if (emitTimerRef.current !== null) {
        window.clearTimeout(emitTimerRef.current);
        emitTimerRef.current = null;
      }

      if (immediate) {
        flushInkToParent(serialized);
        return;
      }

      // Debounce parent/autosave updates so drawing stays smooth.
      emitTimerRef.current = window.setTimeout(() => {
        emitTimerRef.current = null;
        flushInkToParent(serialized);
      }, 350);
    },
    [flushInkToParent],
  );

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Use layout size (not getBoundingClientRect) so CSS zoom scale doesn't resize the buffer.
    const cssW = Math.max(1, container.clientWidth);
    const cssH = Math.max(1, container.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const width = Math.max(1, Math.floor(cssW * dpr));
    const height = Math.max(1, Math.floor(cssH * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const color = DEFAULT_INK_COLOR;
    const sensitivity = pressureSensitivityRef.current;
    renderInkData(ctx, inkRef.current, width, height, color, sensitivity);

    const activeStroke = activeStrokeRef.current;
    if (activeStroke) {
      drawStroke(ctx, activeStroke, width, height, color, sensitivity);
    }
  }, []);

  const schedulePaint = useCallback(() => {
    if (paintRafRef.current !== null) return;
    paintRafRef.current = window.requestAnimationFrame(() => {
      paintRafRef.current = null;
      paint();
    });
  }, [paint]);

  useEffect(() => {
    schedulePaint();
  }, [pressureSensitivity, schedulePaint]);

  useEffect(() => {
    // Ignore echoes of our own commits — re-parsing large ink freezes the UI.
    if (inkData === lastEmittedInkRef.current) return;
    if (activePointerRef.current !== null) return;
    lastEmittedInkRef.current = inkData;
    inkRef.current = parseInkData(inkData);
    redoStackRef.current = [];
    setCanRedo(false);
    setHasInk(inkRef.current.strokes.length > 0);
    paint();
  }, [inkData, paint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => paint());
    observer.observe(container);
    return () => observer.disconnect();
  }, [paint]);

  useEffect(() => {
    return () => {
      if (penCooldownRef.current !== null) {
        window.clearTimeout(penCooldownRef.current);
      }
      if (paintRafRef.current !== null) {
        window.cancelAnimationFrame(paintRafRef.current);
      }
      if (emitTimerRef.current !== null) {
        window.clearTimeout(emitTimerRef.current);
        // Flush pending ink so we don't lose the last strokes.
        flushInkToParent(serializeInkData(inkRef.current));
      }
    };
  }, [flushInkToParent]);

  const markPenUsed = useCallback(() => {
    penRecentlyUsedRef.current = true;
    setPenSeen((seen) => (seen ? seen : true));
    if (penCooldownRef.current !== null) {
      window.clearTimeout(penCooldownRef.current);
    }
    penCooldownRef.current = window.setTimeout(() => {
      penRecentlyUsedRef.current = false;
      penCooldownRef.current = null;
    }, 900);
  }, []);

  const pushPoints = useCallback(
    (points: InkPoint[]) => {
      const stroke = activeStrokeRef.current;
      if (!stroke || points.length === 0) return;

      for (const point of points) {
        const last = stroke.points[stroke.points.length - 1];
        if (last && isNearDuplicate(last, point)) continue;
        stroke.points.push(point);
      }

      schedulePaint();
    },
    [schedulePaint],
  );

  const startStroke = useCallback(
    (event: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      event.preventDefault();
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Some Android WebViews throw if capture is already set.
      }
      activePointerRef.current = event.pointerId;

      const rect = canvas.getBoundingClientRect();
      const useEraser = toolRef.current === "eraser" || isPenEraserButton(event);
      const point = normalizePointerPoint(
        event.clientX,
        event.clientY,
        rect,
        event.pressure,
      );

      activeStrokeRef.current = {
        points: [point],
        width: strokeWidthRef.current,
        eraser: useEraser,
        color: useEraser ? undefined : strokeColorRef.current,
        opacity: useEraser ? undefined : opacityRef.current,
      };
      schedulePaint();
    },
    [schedulePaint],
  );

  const finishStroke = useCallback(() => {
    const stroke = activeStrokeRef.current;
    if (stroke && stroke.points.length > 0) {
      inkRef.current = {
        ...inkRef.current,
        strokes: [...inkRef.current.strokes, stroke],
      };
      redoStackRef.current = [];
      setCanRedo(false);
      commitInk(false);
    }
    activeStrokeRef.current = null;
    activePointerRef.current = null;
    schedulePaint();
  }, [commitInk, schedulePaint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || readOnly) return;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "pen") {
        markPenUsed();
      } else if (
        stylusOnlyRef.current &&
        event.pointerType === "touch" &&
        penRecentlyUsedRef.current
      ) {
        event.preventDefault();
        return;
      }

      if (!isDrawablePointer(event.pointerType, stylusOnlyRef.current)) {
        return;
      }

      startStroke(event);
    };

    const onMove = (event: PointerEvent) => {
      if (activePointerRef.current !== event.pointerId) return;
      if (rawUpdateSupportedRef.current && event.pointerType === "pen") return;

      if (event.pointerType === "pen") markPenUsed();
      event.preventDefault();

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      pushPoints(collectCoalescedPoints(event, rect));
    };

    const onRawUpdate = (event: Event) => {
      if (!(event instanceof PointerEvent)) return;
      rawUpdateSupportedRef.current = true;
      if (activePointerRef.current !== event.pointerId) return;
      if (event.pointerType === "pen") markPenUsed();

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      pushPoints(collectCoalescedPoints(event, rect));
    };

    const onUp = (event: PointerEvent) => {
      if (activePointerRef.current !== event.pointerId) return;
      event.preventDefault();
      finishStroke();
    };

    const onCancel = (event: PointerEvent) => {
      if (activePointerRef.current !== event.pointerId) return;
      finishStroke();
    };

    canvas.addEventListener("pointerdown", onDown, { passive: false });
    canvas.addEventListener("pointermove", onMove, { passive: false });
    canvas.addEventListener("pointerup", onUp, { passive: false });
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("pointerrawupdate", onRawUpdate);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("pointerrawupdate", onRawUpdate);
    };
  }, [finishStroke, markPenUsed, pushPoints, readOnly, startStroke]);

  const handleUndo = () => {
    if (readOnly || inkRef.current.strokes.length === 0) return;
    const strokes = inkRef.current.strokes;
    const removed = strokes[strokes.length - 1];
    redoStackRef.current = [...redoStackRef.current, [removed]];
    setCanRedo(true);
    inkRef.current = {
      ...inkRef.current,
      strokes: strokes.slice(0, -1),
    };
    commitInk(true);
    schedulePaint();
  };

  const handleRedo = () => {
    if (readOnly || redoStackRef.current.length === 0) return;
    const stack = redoStackRef.current;
    const next = stack[stack.length - 1];
    redoStackRef.current = stack.slice(0, -1);
    setCanRedo(redoStackRef.current.length > 0);
    inkRef.current = {
      ...inkRef.current,
      strokes: [...inkRef.current.strokes, ...next],
    };
    commitInk(true);
    schedulePaint();
  };

  const handleClear = () => {
    if (readOnly || inkRef.current.strokes.length === 0) return;
    if (!window.confirm("Clear all ink on this canvas?")) return;
    redoStackRef.current = [];
    setCanRedo(false);
    inkRef.current = { version: 1, strokes: [] };
    commitInk(true);
    schedulePaint();
  };

  const setZoomClamped = (next: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 100) / 100)));
  };

  const floatingChrome = !readOnly;

  return (
    <div
      className={cn(
        "relative min-h-0 overflow-hidden bg-white",
        fillHeight ? "flex-1" : "min-h-[32vh] md:min-h-[36vh]",
        className,
      )}
    >
      {/* Drawing surface */}
      <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 touch-none select-none",
            readOnly ? "pointer-events-none" : "cursor-crosshair",
          )}
          style={{
            touchAction: "none",
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        />
      </div>

      {!readOnly && !hasInk && (
        <div className="pointer-events-none absolute inset-x-0 top-[22%] flex justify-center">
          <p className="text-sm text-[#1b1b1f]/35">
            Draw with pen or finger — release when finished
          </p>
        </div>
      )}

      {floatingChrome && (
        <>
          {/* Top-center tool bar */}
          <div className="pointer-events-none absolute inset-x-0 top-3 z-50 flex justify-center px-3">
            <div className="pointer-events-auto flex items-center gap-0.5 rounded-xl border border-black/[0.08] bg-white px-1.5 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
              <ToolButton
                active={stylusOnly}
                onClick={() => setStylusOnly((v) => !v)}
                label={stylusOnly ? "Stylus only (locked)" : "Finger allowed"}
                title={
                  stylusOnly
                    ? "Stylus only — unlock to allow finger"
                    : "Finger OK — lock for stylus only"
                }
              >
                {stylusOnly ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </ToolButton>

              <div className="mx-0.5 h-6 w-px bg-black/[0.08]" aria-hidden />

              <ToolButton
                active={tool === "pen"}
                onClick={() => {
                  setTool("pen");
                  setShowProps(true);
                }}
                label="Pen"
              >
                <Pen className="h-4 w-4" />
              </ToolButton>

              <ToolButton
                active={tool === "eraser"}
                onClick={() => {
                  setTool("eraser");
                  setShowProps(true);
                }}
                label="Eraser"
              >
                <Eraser className="h-4 w-4" />
              </ToolButton>

              <div className="mx-0.5 h-6 w-px bg-black/[0.08]" aria-hidden />

              <ToolButton
                onClick={handleClear}
                label="Clear canvas"
                active={false}
              >
                <Trash2 className="h-4 w-4" />
              </ToolButton>
            </div>
          </div>

          {/* Left properties panel */}
          {showProps && tool === "pen" && (
            <div className="absolute left-3 top-16 z-50 w-[200px] rounded-xl border border-black/[0.08] bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
              <PanelSection label="Stroke">
                <div className="flex flex-wrap gap-1.5">
                  {INK_STROKE_COLORS.map((color) => {
                    const selected = strokeColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setStrokeColor(color)}
                        aria-label={`Stroke color ${color}`}
                        aria-pressed={selected}
                        className={cn(
                          "h-6 w-6 rounded-md border border-black/10 transition-shadow",
                          selected && "ring-2 ring-[#5b57d1] ring-offset-1",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    );
                  })}
                </div>
              </PanelSection>

              <div className="my-3 h-px bg-black/[0.06]" />

              <PanelSection label="Stroke width">
                <div className="flex gap-1.5">
                  {STROKE_WIDTH_PRESETS.map((preset, index) => {
                    const selected = strokeWidth === preset;
                    const lineH = index === 0 ? 1 : index === 1 ? 1.75 : 3;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setStrokeWidth(preset)}
                        aria-label={`Stroke width ${preset}`}
                        aria-pressed={selected}
                        className={cn(
                          "flex h-8 flex-1 items-center justify-center rounded-lg border transition-colors",
                          selected
                            ? cn("border-transparent", ACTIVE_BG)
                            : "border-black/[0.08] hover:bg-black/[0.03]",
                        )}
                      >
                        <span
                          className="block w-5 rounded-full bg-[#1b1b1f]"
                          style={{ height: lineH }}
                        />
                      </button>
                    );
                  })}
                </div>
              </PanelSection>

              <div className="my-3 h-px bg-black/[0.06]" />

              <PanelSection label="Pressure">
                <input
                  type="range"
                  min={MIN_PRESSURE_SENSITIVITY}
                  max={MAX_PRESSURE_SENSITIVITY}
                  step={0.1}
                  value={pressureSensitivity}
                  onChange={(e) => setPressureSensitivity(Number(e.target.value))}
                  className="excal-slider h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e8e8ec]"
                  style={{
                    background: `linear-gradient(to right, #5b57d1 ${
                      ((pressureSensitivity - MIN_PRESSURE_SENSITIVITY) /
                        (MAX_PRESSURE_SENSITIVITY - MIN_PRESSURE_SENSITIVITY)) *
                      100
                    }%, #e8e8ec 0%)`,
                  }}
                />
              </PanelSection>

              <div className="my-3 h-px bg-black/[0.06]" />

              <PanelSection label="Opacity">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="excal-slider h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e8e8ec]"
                    style={{
                      background: `linear-gradient(to right, #5b57d1 ${opacity}%, #e8e8ec 0%)`,
                    }}
                  />
                  <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-[#1b1b1f]/55">
                    {opacity}
                  </span>
                </div>
              </PanelSection>

              {stylusOnly && !penSeen && (
                <button
                  type="button"
                  className="mt-3 text-left text-[11px] text-[#5b57d1] underline-offset-2 hover:underline"
                  onClick={() => setStylusOnly(false)}
                >
                  Not drawing? Allow finger
                </button>
              )}
            </div>
          )}

          {/* Eraser tip panel */}
          {showProps && tool === "eraser" && (
            <div className="absolute left-3 top-16 z-50 w-[200px] rounded-xl border border-black/[0.08] bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
              <PanelSection label="Eraser size">
                <div className="flex gap-1.5">
                  {STROKE_WIDTH_PRESETS.map((preset, index) => {
                    const selected = strokeWidth === preset;
                    const lineH = index === 0 ? 1 : index === 1 ? 1.75 : 3;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setStrokeWidth(preset)}
                        aria-label={`Eraser size ${preset}`}
                        aria-pressed={selected}
                        className={cn(
                          "flex h-8 flex-1 items-center justify-center rounded-lg border transition-colors",
                          selected
                            ? cn("border-transparent", ACTIVE_BG)
                            : "border-black/[0.08] hover:bg-black/[0.03]",
                        )}
                      >
                        <span
                          className="block w-5 rounded-full bg-[#1b1b1f]"
                          style={{ height: lineH }}
                        />
                      </button>
                    );
                  })}
                </div>
              </PanelSection>
              <p className="mt-3 text-[11px] leading-relaxed text-[#1b1b1f]/45">
                Drag over ink to erase. Stylus eraser button also works.
              </p>
            </div>
          )}

          {/* Bottom-left zoom + undo/redo */}
          <div className="absolute bottom-3 left-3 z-50 flex items-center gap-1.5">
            <div className="flex items-center rounded-xl border border-black/[0.08] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <button
                type="button"
                onClick={() => setZoomClamped(zoom - ZOOM_STEP)}
                disabled={zoom <= MIN_ZOOM}
                className="flex h-9 w-9 items-center justify-center rounded-l-xl text-[#1b1b1f]/70 transition-colors hover:bg-black/[0.04] disabled:opacity-35"
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="min-w-[3.25rem] px-1 text-center text-xs font-medium tabular-nums text-[#1b1b1f]/80"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoomClamped(zoom + ZOOM_STEP)}
                disabled={zoom >= MAX_ZOOM}
                className="flex h-9 w-9 items-center justify-center rounded-r-xl text-[#1b1b1f]/70 transition-colors hover:bg-black/[0.04] disabled:opacity-35"
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center rounded-xl border border-black/[0.08] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!hasInk}
                className="flex h-9 w-9 items-center justify-center rounded-l-xl text-[#1b1b1f]/70 transition-colors hover:bg-black/[0.04] disabled:opacity-35"
                aria-label="Undo"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex h-9 w-9 items-center justify-center rounded-r-xl text-[#1b1b1f]/70 transition-colors hover:bg-black/[0.04] disabled:opacity-35"
                aria-label="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .excal-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #5b57d1;
          box-shadow: 0 1px 2px rgba(0,0,0,0.12);
          cursor: pointer;
        }
        .excal-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #5b57d1;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
