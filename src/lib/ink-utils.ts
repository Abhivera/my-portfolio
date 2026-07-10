import type { InkData, InkStroke } from "../../lib/notepad/types";

export const DEFAULT_STROKE_WIDTH = 2.5;
export const MIN_STROKE_WIDTH = 1;
export const MAX_STROKE_WIDTH = 12;

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
  return (stroke.width * (0.3 + mapped * 2.2) * canvasMinDim) / 100;
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

  ctx.save();
  if (stroke.eraser) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length === 1) {
    const point = points[0];
    const radius = strokeWidthPx(stroke, point.p, canvasMinDim, pressureSensitivity) / 2;
    ctx.fillStyle = stroke.eraser ? "rgba(0,0,0,1)" : color;
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
    ctx.lineWidth = strokeWidthPx(stroke, pressure, canvasMinDim, pressureSensitivity);

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

const OCR_EXPORT_WIDTH = 1200;
const OCR_EXPORT_HEIGHT = 1600;
const OCR_CROP_PADDING_PX = 24;
const OCR_SCALE = 2;

type PixelBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function findDarkPixelBounds(
  imageData: ImageData,
  threshold = 240,
): PixelBounds | null {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const luminance =
        data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      if (luminance < threshold) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
}

/** Renders ink strokes to a cropped, high-contrast PNG data URL for OCR. */
export function exportInkImageForOcr(data: InkData): string | null {
  if (data.strokes.length === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = OCR_EXPORT_WIDTH;
  canvas.height = OCR_EXPORT_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OCR_EXPORT_WIDTH, OCR_EXPORT_HEIGHT);
  renderInkData(ctx, data, OCR_EXPORT_WIDTH, OCR_EXPORT_HEIGHT, "#000000");

  const bounds = findDarkPixelBounds(
    ctx.getImageData(0, 0, OCR_EXPORT_WIDTH, OCR_EXPORT_HEIGHT),
  );
  if (!bounds) return null;

  const cropX = Math.max(0, bounds.minX - OCR_CROP_PADDING_PX);
  const cropY = Math.max(0, bounds.minY - OCR_CROP_PADDING_PX);
  const cropW = Math.min(
    OCR_EXPORT_WIDTH - cropX,
    bounds.maxX - bounds.minX + OCR_CROP_PADDING_PX * 2,
  );
  const cropH = Math.min(
    OCR_EXPORT_HEIGHT - cropY,
    bounds.maxY - bounds.minY + OCR_CROP_PADDING_PX * 2,
  );

  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.floor(cropW * OCR_SCALE));
  output.height = Math.max(1, Math.floor(cropH * OCR_SCALE));

  const outputCtx = output.getContext("2d");
  if (!outputCtx) return null;

  outputCtx.fillStyle = "#ffffff";
  outputCtx.fillRect(0, 0, output.width, output.height);
  outputCtx.imageSmoothingEnabled = false;
  outputCtx.drawImage(
    canvas,
    cropX,
    cropY,
    cropW,
    cropH,
    0,
    0,
    output.width,
    output.height,
  );

  return output.toDataURL("image/png");
}
