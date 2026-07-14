import type { InkData, InkStroke } from "../../lib/notepad/types";

export const DEFAULT_STROKE_WIDTH = 1;
export const MIN_STROKE_WIDTH = 0.4;
export const MAX_STROKE_WIDTH = 6;

/** Excalidraw-style stroke width presets (thin / regular / bold). */
export const STROKE_WIDTH_PRESETS = [0.6, 1, 1.75] as const;

export const DEFAULT_INK_COLOR = "#1e1e1e";
export const INK_STROKE_COLORS = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
  "#9c36b5",
] as const;

export function emptyInkData(): InkData {
  return { version: 1, strokes: [] };
}

export function parseInkData(raw?: string): InkData {
  if (!raw?.trim()) return emptyInkData();
  try {
    const parsed = JSON.parse(raw) as Partial<InkData>;
    if (parsed.version !== 1 || !Array.isArray(parsed.strokes)) {
      return emptyInkData();
    }
    return {
      version: 1,
      strokes: parsed.strokes.filter(
        (stroke): stroke is InkStroke =>
          Array.isArray(stroke?.points) &&
          typeof stroke.width === "number" &&
          stroke.points.length > 0,
      ),
    };
  } catch {
    return emptyInkData();
  }
}

export function serializeInkData(data: InkData): string | undefined {
  if (data.strokes.length === 0) return undefined;
  return JSON.stringify(data);
}

/** Maps raw pen pressure to line width with a visible curve for light strokes. */
export function mapPressure(raw: number, sensitivity = 1): number {
  const clamped = Math.min(1, Math.max(0, raw));
  const curved = Math.pow(clamped, 0.6);
  const neutral = 0.5;
  return Math.min(1, Math.max(0, neutral + (curved - neutral) * sensitivity));
}

function strokeWidthPx(
  stroke: InkStroke,
  pressure: number,
  canvasMinDim: number,
  pressureSensitivity: number,
): number {
  const mapped = mapPressure(pressure, pressureSensitivity);
  // Keep strokes pen-thin: width units map to ~0.6–2% of canvas min edge.
  return (stroke.width * (0.35 + mapped * 1.1) * canvasMinDim) / 100;
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: InkStroke,
  width: number,
  height: number,
  color: string,
  pressureSensitivity = 1,
) {
  const points = stroke.points;
  if (points.length === 0) return;

  const canvasMinDim = Math.min(width, height);
  const inkColor = stroke.color || color;
  const opacity =
    typeof stroke.opacity === "number"
      ? Math.min(1, Math.max(0, stroke.opacity))
      : 1;

  ctx.save();
  if (stroke.eraser) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.globalAlpha = 1;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = inkColor;
    ctx.globalAlpha = opacity;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length === 1) {
    const point = points[0];
    const radius =
      strokeWidthPx(stroke, point.p, canvasMinDim, pressureSensitivity) / 2;
    ctx.fillStyle = stroke.eraser ? "rgba(0,0,0,1)" : inkColor;
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, Math.max(radius, 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const current = points[i];
    const pressure = (previous.p + current.p) / 2;
    ctx.lineWidth = strokeWidthPx(
      stroke,
      pressure,
      canvasMinDim,
      pressureSensitivity,
    );

    ctx.beginPath();
    ctx.moveTo(previous.x * width, previous.y * height);
    ctx.lineTo(current.x * width, current.y * height);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderInkData(
  ctx: CanvasRenderingContext2D,
  data: InkData,
  width: number,
  height: number,
  color: string,
  pressureSensitivity = 1,
) {
  ctx.clearRect(0, 0, width, height);
  for (const stroke of data.strokes) {
    drawStroke(ctx, stroke, width, height, color, pressureSensitivity);
  }
}
