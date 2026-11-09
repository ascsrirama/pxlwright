/** Geometry for the canvas: resize handles and working out what the mouse is over. */
import { bounds, resizeMode } from '../../core/elements';
import type { El } from '../../core/types';

/** css px margin around the panel (room for handles) */
export const MARGIN = 20;
/** half the size of a resize handle, in css px */
export const HANDLE = 5;

export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'p1' | 'p2';

export const CURSORS: Record<HandleId, string> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  p1: 'crosshair',
  p2: 'crosshair'
};

/** Resize handle positions (in display pixels) for an element. */
export function handlesFor(e: El): { id: HandleId; x: number; y: number }[] {
  const mode = resizeMode(e);
  if (!mode) return [];
  if (mode === 'line' && e.type === 'line') {
    return [
      { id: 'p1', x: e.x + 0.5, y: e.y + 0.5 },
      { id: 'p2', x: e.x2 + 0.5, y: e.y2 + 0.5 }
    ];
  }
  const b = bounds(e);
  const l = b.x;
  const r = b.x + b.w;
  const t = b.y;
  const bt = b.y + b.h;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const corners: { id: HandleId; x: number; y: number }[] = [
    { id: 'nw', x: l, y: t },
    { id: 'ne', x: r, y: t },
    { id: 'se', x: r, y: bt },
    { id: 'sw', x: l, y: bt }
  ];
  if (mode === 'square') return corners;
  return [...corners, { id: 'n', x: cx, y: t }, { id: 'e', x: r, y: cy }, { id: 's', x: cx, y: bt }, { id: 'w', x: l, y: cy }];
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** The front-most visible, unlocked element under (px, py), if any. */
export function hitElement(elements: El[], px: number, py: number, zoom: number): El | null {
  const tol = 4 / zoom;
  for (let i = elements.length - 1; i >= 0; i--) {
    const e = elements[i];
    if (!e.visible || e.locked) continue;
    if (e.type === 'line') {
      if (distToSegment(px, py, e.x + 0.5, e.y + 0.5, e.x2 + 0.5, e.y2 + 0.5) <= Math.max(1.2, tol)) return e;
      continue;
    }
    const b = bounds(e);
    if (px >= b.x - tol && px <= b.x + b.w + tol && py >= b.y - tol && py <= b.y + b.h + tol) return e;
  }
  return null;
}

/** Which resize handle of the selected element is under (px, py), if any. */
export function hitHandle(selected: El | null, px: number, py: number, zoom: number): HandleId | null {
  if (!selected || selected.locked || !selected.visible) return null;
  const tol = (HANDLE + 3) / zoom;
  for (const h of handlesFor(selected)) if (Math.abs(px - h.x) <= tol && Math.abs(py - h.y) <= tol) return h.id;
  return null;
}
