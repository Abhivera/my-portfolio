import type { InkPoint } from "../../lib/notepad/types";

/** Bit 5 (32) = eraser end / barrel eraser on stylus pens. */
export const PEN_ERASER_BUTTON = 32;

export const MIN_PRESSURE_SENSITIVITY = 0.5;
export const MAX_PRESSURE_SENSITIVITY = 2;
export const DEFAULT_PRESSURE_SENSITIVITY = 1;

export function isDrawablePointer(pointerType: string, stylusOnly: boolean): boolean {
  if (pointerType === "pen") return true;
  if (stylusOnly) return false;
  return pointerType === "touch" || pointerType === "mouse";
}

export function isPenEraserButton(event: Pick<PointerEvent, "pointerType" | "buttons">): boolean {
  return event.pointerType === "pen" && (event.buttons & PEN_ERASER_BUTTON) !== 0;
}

export function normalizePointerPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  pressure: number,
): InkPoint {
  return {
    x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    // Browsers report 0 pressure for mouse; 0.5 is a neutral default.
    p: pressure > 0 ? pressure : 0.5,
  };
}

export function collectCoalescedPoints(
  event: PointerEvent,
  rect: DOMRect,
): InkPoint[] {
  let events: PointerEvent[] = [event];
  if (typeof event.getCoalescedEvents === "function") {
    const coalesced = event.getCoalescedEvents();
    if (coalesced.length > 0) events = coalesced;
  }

  return events.map((sample) =>
    normalizePointerPoint(sample.clientX, sample.clientY, rect, sample.pressure),
  );
}

export function formatPenStatus(
  pointerType: string | null,
  pressure: number | null,
): string | null {
  if (!pointerType) return null;
  if (pointerType === "pen" && pressure !== null) {
    return `Pen detected · pressure ${Math.round(pressure * 100)}%`;
  }
  if (pointerType === "pen") return "Pen detected";
  if (pointerType === "touch") return "Finger input";
  return null;
}

export function isTouchTablet(): boolean {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}
