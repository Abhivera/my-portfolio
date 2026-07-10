import { useCallback, useEffect, useRef, useState } from "react";
import {
  Eraser,
  Hand,
  Pen,
  PenLine,
  RotateCcw,
  ScanText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InkData, InkPoint, InkStroke } from "../../../lib/notepad/types";
import {
  DEFAULT_STROKE_WIDTH,
  MAX_STROKE_WIDTH,
  MIN_STROKE_WIDTH,
  drawStroke,
  exportInkImageForOcr,
  parseInkData,
  renderInkData,
  serializeInkData,
} from "@/lib/ink-utils";
import { recognizeHandwriting } from "@/lib/ink-ocr";
import {
  DEFAULT_PRESSURE_SENSITIVITY,
  MAX_PRESSURE_SENSITIVITY,
  MIN_PRESSURE_SENSITIVITY,
  collectCoalescedPoints,
  formatPenStatus,
  isDrawablePointer,
  isPenEraserButton,
  normalizePointerPoint,
} from "@/lib/stylus-utils";
import type { HandwritingMode } from "@/lib/handwriting-mode";
import { toast } from "sonner";

type StylusCanvasProps = {
  inkData?: string;
  handwritingMode?: HandwritingMode;
  onHandwritingModeChange?: (mode: HandwritingMode) => void;
  onInkChange?: (inkData: string | undefined) => void;
  onTextRecognized?: (text: string) => void;
  className?: string;
  readOnly?: boolean;
};

type DrawTool = "pen" | "eraser";

const POINT_EPSILON = 0.0008;

function isNearDuplicate(a: InkPoint, b: InkPoint): boolean {
  return Math.abs(a.x - b.x) < POINT_EPSILON && Math.abs(a.y - b.y) < POINT_EPSILON;
}

export function StylusCanvas({
  inkData,
  handwritingMode = "keep",
  onHandwritingModeChange,
  onInkChange,
  onTextRecognized,
  className,
  readOnly = false,
}: StylusCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<InkData>(parseInkData(inkData));
  const activeStrokeRef = useRef<InkStroke | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const penRecentlyUsedRef = useRef(false);
  const penCooldownRef = useRef<number | null>(null);
  const rawUpdateSupportedRef = useRef(false);
  const stylusOnlyRef = useRef(true);
  const strokeWidthRef = useRef(DEFAULT_STROKE_WIDTH);
  const toolRef = useRef<DrawTool>("pen");
  const pressureSensitivityRef = useRef(DEFAULT_PRESSURE_SENSITIVITY);
  const paintRafRef = useRef<number | null>(null);

  const [tool, setTool] = useState<DrawTool>("pen");
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [stylusOnly, setStylusOnly] = useState(true);
  const [pressureSensitivity, setPressureSensitivity] = useState(
    DEFAULT_PRESSURE_SENSITIVITY,
  );
  const [hasInk, setHasInk] = useState(inkRef.current.strokes.length > 0);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [penStatus, setPenStatus] = useState<string | null>(null);
  const [penSeen, setPenSeen] = useState(false);

  useEffect(() => {
    stylusOnlyRef.current = stylusOnly;
  }, [stylusOnly]);

  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    pressureSensitivityRef.current = pressureSensitivity;
  }, [pressureSensitivity]);

  const commitInk = useCallback(() => {
    const serialized = serializeInkData(inkRef.current);
    setHasInk(inkRef.current.strokes.length > 0);
    onInkChange?.(serialized);
  }, [onInkChange]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const color =
      getComputedStyle(container).getPropertyValue("--foreground").trim() || "#111";
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
    if (activePointerRef.current !== null) return;
    inkRef.current = parseInkData(inkData);
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
    };
  }, []);

  const markPenUsed = useCallback(() => {
    penRecentlyUsedRef.current = true;
    setPenSeen(true);
    if (penCooldownRef.current !== null) {
      window.clearTimeout(penCooldownRef.current);
    }
    penCooldownRef.current = window.setTimeout(() => {
      penRecentlyUsedRef.current = false;
      penCooldownRef.current = null;
    }, 900);
  }, []);

  const pushPoints = useCallback(
    (points: InkPoint[], pointerType: string, pressure: number) => {
      const stroke = activeStrokeRef.current;
      if (!stroke || points.length === 0) return;

      for (const point of points) {
        const last = stroke.points[stroke.points.length - 1];
        if (last && isNearDuplicate(last, point)) continue;
        stroke.points.push(point);
      }

      setPenStatus(formatPenStatus(pointerType, pressure));
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
      };
      setPenStatus(formatPenStatus(event.pointerType, event.pressure));
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
      commitInk();
    }
    activeStrokeRef.current = null;
    activePointerRef.current = null;
    setPenStatus(null);
    schedulePaint();
  }, [commitInk, schedulePaint]);

  // Native pointer listeners for reliable stylus on Android Chrome.
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
      // When raw updates are available, pointermove is lower-frequency — skip to avoid dupes.
      if (rawUpdateSupportedRef.current && event.pointerType === "pen") return;

      if (event.pointerType === "pen") markPenUsed();
      event.preventDefault();

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      pushPoints(collectCoalescedPoints(event, rect), event.pointerType, event.pressure);
    };

    const onRawUpdate = (event: Event) => {
      if (!(event instanceof PointerEvent)) return;
      rawUpdateSupportedRef.current = true;
      if (activePointerRef.current !== event.pointerId) return;
      if (event.pointerType === "pen") markPenUsed();

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      pushPoints(collectCoalescedPoints(event, rect), event.pointerType, event.pressure);
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
    inkRef.current = {
      ...inkRef.current,
      strokes: inkRef.current.strokes.slice(0, -1),
    };
    commitInk();
    schedulePaint();
  };

  const handleClear = () => {
    if (readOnly || inkRef.current.strokes.length === 0) return;
    if (!window.confirm("Clear all handwriting on this note?")) return;
    inkRef.current = { version: 1, strokes: [] };
    commitInk();
    schedulePaint();
  };

  const handleConvertToText = async () => {
    if (readOnly || isConverting || !onTextRecognized || handwritingMode !== "toText") {
      return;
    }
    if (inkRef.current.strokes.length === 0) {
      toast.error("Write something first");
      return;
    }

    const imageDataUrl = exportInkImageForOcr(inkRef.current);
    if (!imageDataUrl) {
      toast.error("Could not prepare handwriting for recognition");
      return;
    }

    setIsConverting(true);
    setOcrProgress(0);
    try {
      const text = await recognizeHandwriting(imageDataUrl, ({ progress }) => {
        setOcrProgress(Math.round(progress * 100));
      });

      if (!text) {
        toast.error("No text recognized. Try writing larger and clearer.");
        return;
      }

      onTextRecognized(text);
      toast.success("Handwriting converted to text");
    } catch {
      toast.error("Text recognition failed. Try again.");
    } finally {
      setIsConverting(false);
      setOcrProgress(null);
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}>
      {!readOnly && (
        <div className="flex shrink-0 flex-col gap-2">
          {onHandwritingModeChange && (
            <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => onHandwritingModeChange("keep")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  handwritingMode === "keep"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={handwritingMode === "keep"}
              >
                <PenLine className="h-4 w-4 shrink-0" />
                Keep ink
              </button>
              <button
                type="button"
                onClick={() => onHandwritingModeChange("toText")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  handwritingMode === "toText"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={handwritingMode === "toText"}
              >
                <ScanText className="h-4 w-4 shrink-0" />
                To text
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center rounded-lg border p-0.5">
              <button
                type="button"
                onClick={() => setTool("pen")}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  tool === "pen"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Pen"
                aria-pressed={tool === "pen"}
              >
                <Pen className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setTool("eraser")}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  tool === "eraser"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Eraser"
                aria-pressed={tool === "eraser"}
              >
                <Eraser className="h-4 w-4" />
              </button>
            </div>

            <label className="flex h-9 items-center gap-2 rounded-lg border px-2.5 text-xs text-muted-foreground">
              <span className="shrink-0">Size</span>
              <input
                type="range"
                min={MIN_STROKE_WIDTH}
                max={MAX_STROKE_WIDTH}
                step={0.5}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="h-1.5 w-16 accent-primary sm:w-20"
              />
            </label>

            <label className="flex h-9 items-center gap-2 rounded-lg border px-2.5 text-xs text-muted-foreground">
              <span className="shrink-0">Press</span>
              <input
                type="range"
                min={MIN_PRESSURE_SENSITIVITY}
                max={MAX_PRESSURE_SENSITIVITY}
                step={0.1}
                value={pressureSensitivity}
                onChange={(e) => setPressureSensitivity(Number(e.target.value))}
                className="h-1.5 w-16 accent-primary sm:w-20"
              />
            </label>

            <button
              type="button"
              onClick={() => setStylusOnly((value) => !value)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                stylusOnly
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={stylusOnly}
              title={
                stylusOnly
                  ? "Only stylus draws (palm rejection)"
                  : "Stylus and finger can draw"
              }
            >
              {stylusOnly ? (
                <Pen className="h-3.5 w-3.5" />
              ) : (
                <Hand className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {stylusOnly ? "Stylus only" : "Finger OK"}
              </span>
            </button>

            <div className="ml-auto flex items-center gap-1">
              {handwritingMode === "toText" && onTextRecognized && (
                <Button
                  type="button"
                  size="sm"
                  className="h-9"
                  onClick={() => void handleConvertToText()}
                  disabled={!hasInk || isConverting}
                >
                  <ScanText className="h-4 w-4 mr-1.5" />
                  {isConverting
                    ? ocrProgress !== null
                      ? `${ocrProgress}%`
                      : "…"
                    : "Convert"}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 px-2.5"
                onClick={handleUndo}
                disabled={!hasInk}
                aria-label="Undo"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 px-2.5 text-destructive hover:text-destructive"
                onClick={handleClear}
                disabled={!hasInk}
                aria-label="Clear"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex min-h-4 items-center justify-between gap-2 text-xs text-muted-foreground">
            <p aria-live="polite">
              {penStatus ??
                (handwritingMode === "keep"
                  ? "Ink stays on this note"
                  : "Write, then tap Convert")}
            </p>
            {stylusOnly && !penSeen && (
              <button
                type="button"
                className="shrink-0 underline-offset-2 hover:underline"
                onClick={() => setStylusOnly(false)}
              >
                Stylus not working? Allow finger
              </button>
            )}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden rounded-xl border bg-card",
          "bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--foreground)_8%,transparent)_1px,transparent_0)] [background-size:18px_18px]",
          readOnly ? "min-h-[200px] flex-none" : "min-h-[280px]",
        )}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 touch-none select-none",
            readOnly ? "pointer-events-none" : "cursor-crosshair",
          )}
          style={{ touchAction: "none" }}
        />
        {!readOnly && !hasInk && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
            <div className="max-w-sm rounded-xl bg-background/80 px-4 py-3 text-center text-sm text-muted-foreground backdrop-blur-sm">
              {handwritingMode === "keep" ? (
                <>
                  <p className="font-medium text-foreground">Write with your stylus</p>
                  <p className="mt-1 text-xs">
                    Handwriting is saved as ink. Use Stylus only for palm rejection.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">Write, then convert</p>
                  <p className="mt-1 text-xs">
                    Tap Convert when you finish a line or paragraph.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        {isConverting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
            <p className="rounded-lg border bg-background px-4 py-2 text-sm font-medium shadow-sm">
              Converting{ocrProgress !== null ? ` ${ocrProgress}%` : "…"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
