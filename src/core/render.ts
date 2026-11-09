import type { DisplayConfig, El, Op } from './types';
import { FB } from './gfx';
import { bounds, opsFor } from './elements';
import { insideDisplay } from './displays';

export function parseHex(hex: string): number {
  const h = hex.replace('#', '');
  const v = parseInt(h.length === 3 ? [...h].map((ch) => ch + ch).join('') : h, 16);
  return Number.isNaN(v) ? 0xffffff : v;
}

export function luminance(rgb: number): number {
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Is this colour "on" for a monochrome panel? */
export function monoOn(hex: string): boolean {
  return luminance(parseHex(hex)) > 127;
}

/** Colour as it will appear on the panel (mono panels collapse to tint/black). */
export function resolveColor(hex: string, d: DisplayConfig): number {
  if (d.color === 'rgb') {
    // quantise to RGB565 like the real hardware would
    const v = parseHex(hex);
    const r = (v >> 16) & 255;
    const g = (v >> 8) & 255;
    const b = v & 255;
    const r5 = r >> 3;
    const g6 = g >> 2;
    const b5 = b >> 3;
    return (((r5 << 3) | (r5 >> 2)) << 16) | (((g6 << 2) | (g6 >> 4)) << 8) | ((b5 << 3) | (b5 >> 2));
  }
  return monoOn(hex) ? parseHex(d.tint) : 0x000000;
}

export function rgb565(hex: string): number {
  const v = parseHex(hex);
  return (((v >> 19) & 0x1f) << 11) | (((v >> 10) & 0x3f) << 5) | ((v >> 3) & 0x1f);
}

export function runOp(fb: FB, op: Op, d: DisplayConfig) {
  const col = (h: string) => resolveColor(h, d);
  switch (op.k) {
    case 'line':
      fb.line(op.x0, op.y0, op.x1, op.y1, col(op.c));
      break;
    case 'rect':
      if (op.r > 0) {
        if (op.fill) fb.fillRoundRect(op.x, op.y, op.w, op.h, op.r, col(op.c));
        else fb.roundRect(op.x, op.y, op.w, op.h, op.r, col(op.c));
      } else if (op.fill) fb.fillRect(op.x, op.y, op.w, op.h, col(op.c));
      else fb.rect(op.x, op.y, op.w, op.h, col(op.c));
      break;
    case 'circle':
      if (op.fill) fb.fillCircle(op.x, op.y, op.r, col(op.c));
      else fb.circle(op.x, op.y, op.r, col(op.c));
      break;
    case 'text':
      fb.text(op.x, op.y, op.size, op.str, col(op.c), op.bg === null ? null : col(op.bg));
      break;
    case 'bitmap':
      fb.bitmap(op.x, op.y, op.bits, op.w, op.h, col(op.c), op.bg === null ? null : col(op.bg));
      break;
    case 'arc':
      fb.arc(op.cx, op.cy, op.r0, op.r1, op.a0, op.a1, col(op.c));
      break;
  }
}

/** Render every visible element in order, the way the generated sketch draws them. */
export function renderElements(elements: El[], d: DisplayConfig): FB {
  const fb = new FB(d.width, d.height, 0);
  for (const e of elements) for (const op of opsFor(e)) runOp(fb, op, d);
  return fb;
}

/**
 * Convert a framebuffer to RGBA. On round displays, pixels outside the circle
 * are made transparent-black (the real panel simply doesn't show them).
 */
export function toImageData(fb: FB, d: DisplayConfig): ImageData {
  const img = new ImageData(fb.w, fb.h);
  const out = img.data;
  for (let y = 0; y < fb.h; y++) {
    for (let x = 0; x < fb.w; x++) {
      const i = y * fb.w + x;
      const v = fb.data[i];
      const o = i * 4;
      out[o] = (v >> 16) & 255;
      out[o + 1] = (v >> 8) & 255;
      out[o + 2] = v & 255;
      // Outside a round panel nothing is physically visible; keep a faint ghost so
      // the designer can still see what sticks out.
      out[o + 3] = insideDisplay(d, x, y) ? 255 : 70;
    }
  }
  return img;
}

/**
 * Pixels an element draws that fall outside the visible area, for warnings.
 * Cheap approach: render the element alone and look at what lands outside.
 */
export function clippedPixels(e: El, d: DisplayConfig): number {
  // Fast exit: bounding box fully inside the visible area
  const b = bounds(e);
  const x0 = b.x - 1;
  const y0 = b.y - 1;
  const x1 = b.x + b.w;
  const y1 = b.y + b.h;
  if (
    insideDisplay(d, x0, y0) &&
    insideDisplay(d, x1, y0) &&
    insideDisplay(d, x0, y1) &&
    insideDisplay(d, x1, y1)
  )
    return 0;

  // Render onto a padded buffer so off-screen pixels are not discarded
  const pad = Math.max(8, -x0, -y0, x1 - d.width, y1 - d.height) + 8;
  const big: DisplayConfig = { ...d, width: d.width + pad * 2, height: d.height + pad * 2 };
  const fb = new FB(big.width, big.height, 0);
  const shifted = JSON.parse(JSON.stringify(e)) as El;
  shifted.x += pad;
  shifted.y += pad;
  if (shifted.type === 'line') {
    shifted.x2 += pad;
    shifted.y2 += pad;
  }
  // use a mono-ish check: any non-zero pixel is "drawn"
  const probe: DisplayConfig = { ...big, color: 'rgb' };
  for (const op of opsFor(shifted)) runOp(fb, op, probe);
  let outside = 0;
  for (let y = 0; y < fb.h; y++)
    for (let x = 0; x < fb.w; x++)
      if (fb.data[y * fb.w + x] !== 0 && !insideDisplay(d, x - pad, y - pad)) outside++;
  return outside;
}
