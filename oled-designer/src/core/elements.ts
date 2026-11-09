import type { DisplayConfig, El, ElType, Op } from './types';
import { iconById } from './icons';
import { scaleBits } from './gfx';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ELEMENT_LABELS: Record<ElType, string> = {
  text: 'Text',
  rect: 'Rectangle',
  circle: 'Circle',
  line: 'Line',
  image: 'Image',
  icon: 'Icon',
  progress: 'Progress bar',
  battery: 'Battery',
  signal: 'Signal bars',
  toggle: 'Toggle',
  menu: 'Menu list',
  gauge: 'Arc gauge'
};

let counter = 0;
export function newId(): string {
  counter++;
  return `e${Date.now().toString(36)}${counter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

export function defaultColor(d: DisplayConfig): string {
  return d.color === 'mono' ? '#ffffff' : '#33d6ff';
}

export function createElement(type: ElType, d: DisplayConfig, x = 0, y = 0, nameIndex = 1): El {
  const base = {
    id: newId(),
    name: `${ELEMENT_LABELS[type]} ${nameIndex}`,
    x: Math.round(x),
    y: Math.round(y),
    visible: true,
    locked: false,
    color: defaultColor(d)
  };
  switch (type) {
    case 'text':
      return { ...base, type, text: 'Hello', size: d.width >= 200 ? 3 : 1, bg: null };
    case 'rect':
      return { ...base, type, w: 32, h: 16, radius: 0, fill: false };
    case 'circle':
      return { ...base, type, r: 10, fill: false };
    case 'line':
      return { ...base, type, x2: base.x + 30, y2: base.y + 12 };
    case 'image':
      return { ...base, type, w: 32, h: 32, assetId: '', threshold: 128, invert: false, dither: false, bits: [], bg: null };
    case 'icon':
      return { ...base, type, iconId: 'heart', scale: d.width >= 200 ? 2 : 1, bg: null };
    case 'progress':
      return { ...base, type, w: 60, h: 10, value: 60, radius: 0 };
    case 'battery':
      return { ...base, type, scale: 1, level: 75 };
    case 'signal':
      return { ...base, type, scale: 1, level: 3 };
    case 'toggle':
      return { ...base, type, scale: 1, on: true };
    case 'menu':
      return { ...base, type, items: ['Start', 'Settings', 'About'], selected: 0, size: 1, w: 70 };
    case 'gauge':
      return { ...base, type, r: Math.max(8, Math.min(60, Math.floor(Math.min(d.width, d.height) / 4))), thickness: d.width >= 200 ? 8 : 4, value: 65, startAngle: 135, sweep: 270 };
  }
}

/* ---------- geometry ---------- */

const MAXLEN = (lines: string[]) => lines.reduce((m, s) => Math.max(m, s.length), 0);

export function menuRowHeight(size: number) {
  return 8 * size + 2;
}

export function bounds(e: El): Rect {
  switch (e.type) {
    case 'text': {
      const lines = e.text.split('\n');
      return {
        x: e.x,
        y: e.y,
        w: Math.max(1, MAXLEN(lines) * 6 * e.size - e.size),
        h: Math.max(1, lines.length * 8 * e.size - e.size)
      };
    }
    case 'rect':
    case 'progress':
    case 'image':
      return { x: e.x, y: e.y, w: e.w, h: e.h };
    case 'circle':
    case 'gauge':
      return { x: e.x, y: e.y, w: 2 * e.r + 1, h: 2 * e.r + 1 };
    case 'line': {
      const x = Math.min(e.x, e.x2);
      const y = Math.min(e.y, e.y2);
      return { x, y, w: Math.abs(e.x2 - e.x) + 1, h: Math.abs(e.y2 - e.y) + 1 };
    }
    case 'icon':
      return { x: e.x, y: e.y, w: 16 * e.scale, h: 16 * e.scale };
    case 'battery':
      return { x: e.x, y: e.y, w: 22 * e.scale, h: 10 * e.scale };
    case 'signal':
      return { x: e.x, y: e.y, w: 15 * e.scale, h: 9 * e.scale };
    case 'toggle':
      return { x: e.x, y: e.y, w: 24 * e.scale, h: 12 * e.scale };
    case 'menu': {
      // text may be wider than the highlight bar; include it so clipping checks are honest
      const textW = 2 + MAXLEN(e.items) * 6 * e.size - e.size;
      return { x: e.x, y: e.y, w: Math.max(1, e.w, textW), h: Math.max(1, e.items.length * menuRowHeight(e.size)) };
    }
  }
}

/** Which kind of resize handles an element supports. */
export function resizeMode(e: El): 'box' | 'square' | 'line' | null {
  switch (e.type) {
    case 'rect':
    case 'progress':
    case 'image':
      return 'box';
    case 'circle':
    case 'gauge':
      return 'square';
    case 'line':
      return 'line';
    default:
      return null;
  }
}

export function moveBy(e: El, dx: number, dy: number) {
  e.x += dx;
  e.y += dy;
  if (e.type === 'line') {
    e.x2 += dx;
    e.y2 += dy;
  }
}

/** Apply a new bounding box to a resizable element. */
export function setBox(e: El, r: Rect) {
  const w = Math.max(1, Math.round(r.w));
  const h = Math.max(1, Math.round(r.h));
  switch (e.type) {
    case 'rect':
    case 'progress':
    case 'image':
      e.x = Math.round(r.x);
      e.y = Math.round(r.y);
      e.w = w;
      e.h = h;
      break;
    case 'circle':
    case 'gauge': {
      const d = Math.max(3, Math.min(w, h));
      e.r = Math.floor((d - 1) / 2);
      e.x = Math.round(r.x);
      e.y = Math.round(r.y);
      break;
    }
  }
}

/* ---------- draw ops ---------- */

const BLACK = '#000000';

function thickRect(ops: Op[], x: number, y: number, w: number, h: number, t: number, c: string) {
  for (let k = 0; k < t; k++) {
    const ww = w - 2 * k;
    const hh = h - 2 * k;
    if (ww < 1 || hh < 1) break;
    ops.push({ k: 'rect', x: x + k, y: y + k, w: ww, h: hh, r: 0, fill: false, c });
  }
}

const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));

function rectOp(ops: Op[], x: number, y: number, w: number, h: number, radius: number, fill: boolean, c: string) {
  if (w < 1 || h < 1) return;
  // keep w-2r and h-2r >= 1 so Adafruit_GFX never gets a zero/negative span
  const r = clampInt(radius, 0, Math.floor((Math.min(w, h) - 1) / 2));
  ops.push({ k: 'rect', x, y, w, h, r, fill, c });
}

export function opsFor(e: El): Op[] {
  const ops: Op[] = [];
  if (!e.visible) return ops;
  const c = e.color;

  switch (e.type) {
    case 'text': {
      e.text.split('\n').forEach((line, i) => {
        if (line.length) ops.push({ k: 'text', x: e.x, y: e.y + i * 8 * e.size, size: e.size, str: line, c, bg: e.bg });
      });
      break;
    }
    case 'rect':
      rectOp(ops, e.x, e.y, e.w, e.h, e.radius, e.fill, c);
      break;
    case 'circle':
      ops.push({ k: 'circle', x: e.x + e.r, y: e.y + e.r, r: e.r, fill: e.fill, c });
      break;
    case 'line':
      ops.push({ k: 'line', x0: e.x, y0: e.y, x1: e.x2, y1: e.y2, c });
      break;
    case 'image':
      if (e.bits.length) ops.push({ k: 'bitmap', x: e.x, y: e.y, w: e.w, h: e.h, bits: e.bits, name: e.name, c, bg: e.bg });
      break;
    case 'icon': {
      const ic = iconById(e.iconId);
      ops.push({
        k: 'bitmap',
        x: e.x,
        y: e.y,
        w: ic.w * e.scale,
        h: ic.h * e.scale,
        bits: scaleBits(ic.bits, ic.w, ic.h, e.scale),
        name: `icon_${e.iconId}${e.scale > 1 ? 'x' + e.scale : ''}`,
        c,
        bg: e.bg
      });
      break;
    }
    case 'progress': {
      rectOp(ops, e.x, e.y, e.w, e.h, e.radius, false, c);
      const iw = e.w - 4;
      const ih = e.h - 4;
      const fw = Math.round((iw * clampInt(e.value, 0, 100)) / 100);
      if (fw > 0 && ih > 0) ops.push({ k: 'rect', x: e.x + 2, y: e.y + 2, w: fw, h: ih, r: 0, fill: true, c });
      break;
    }
    case 'battery': {
      const s = e.scale;
      thickRect(ops, e.x, e.y, 20 * s, 10 * s, s, c);
      ops.push({ k: 'rect', x: e.x + 20 * s, y: e.y + 3 * s, w: 2 * s, h: 4 * s, r: 0, fill: true, c });
      const fw = Math.round((16 * s * clampInt(e.level, 0, 100)) / 100);
      if (fw > 0) ops.push({ k: 'rect', x: e.x + 2 * s, y: e.y + 2 * s, w: fw, h: 6 * s, r: 0, fill: true, c });
      break;
    }
    case 'signal': {
      const s = e.scale;
      for (let i = 0; i < 4; i++) {
        const bh = (3 + 2 * i) * s;
        const bx = e.x + 4 * i * s;
        const by = e.y + 9 * s - bh;
        if (i < clampInt(e.level, 0, 4)) ops.push({ k: 'rect', x: bx, y: by, w: 3 * s, h: bh, r: 0, fill: true, c });
        else ops.push({ k: 'rect', x: bx, y: e.y + 8 * s, w: 3 * s, h: s, r: 0, fill: true, c });
      }
      break;
    }
    case 'toggle': {
      const s = e.scale;
      if (e.on) {
        rectOp(ops, e.x, e.y, 24 * s, 12 * s, 6 * s, true, c);
        ops.push({ k: 'circle', x: e.x + 18 * s, y: e.y + 6 * s, r: 4 * s, fill: true, c: BLACK });
      } else {
        rectOp(ops, e.x, e.y, 24 * s, 12 * s, 6 * s, false, c);
        ops.push({ k: 'circle', x: e.x + 6 * s, y: e.y + 6 * s, r: 4 * s, fill: true, c });
      }
      break;
    }
    case 'menu': {
      const rh = menuRowHeight(e.size);
      e.items.forEach((item, i) => {
        const y = e.y + i * rh;
        const sel = i === e.selected;
        if (sel) ops.push({ k: 'rect', x: e.x, y, w: e.w, h: rh, r: 0, fill: true, c });
        if (item.length) ops.push({ k: 'text', x: e.x + 2, y: y + 1, size: e.size, str: item, c: sel ? BLACK : c, bg: null });
      });
      break;
    }
    case 'gauge': {
      const cx = e.x + e.r;
      const cy = e.y + e.r;
      const t = clampInt(e.thickness, 1, e.r);
      ops.push({ k: 'arc', cx, cy, r0: e.r, r1: e.r, a0: e.startAngle, a1: e.startAngle + e.sweep, c });
      const v = clampInt(e.value, 0, 100);
      if (v > 0) ops.push({ k: 'arc', cx, cy, r0: e.r - t + 1, r1: e.r, a0: e.startAngle, a1: e.startAngle + (e.sweep * v) / 100, c });
      break;
    }
  }
  return ops;
}
