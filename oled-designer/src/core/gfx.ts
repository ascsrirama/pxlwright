/**
 * A tiny software framebuffer that reproduces the drawing primitives of
 * Adafruit_GFX pixel-for-pixel (ported from the algorithms in Adafruit_GFX.cpp,
 * BSD licence, Copyright (c) 2012 Adafruit Industries), so what the designer
 * previews is what the generated sketch draws.
 */
import { FONT5X7 } from './font5x7';

export class FB {
  readonly data: Uint32Array;

  constructor(
    readonly w: number,
    readonly h: number,
    fill = 0
  ) {
    this.data = new Uint32Array(w * h).fill(fill);
  }

  px(x: number, y: number, c: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = c;
  }

  hline(x: number, y: number, w: number, c: number) {
    if (y < 0 || y >= this.h) return;
    for (let i = 0; i < w; i++) this.px(x + i, y, c);
  }

  vline(x: number, y: number, h: number, c: number) {
    if (x < 0 || x >= this.w) return;
    for (let j = 0; j < h; j++) this.px(x, y + j, c);
  }

  fillRect(x: number, y: number, w: number, h: number, c: number) {
    for (let j = 0; j < h; j++) this.hline(x, y + j, w, c);
  }

  rect(x: number, y: number, w: number, h: number, c: number) {
    this.hline(x, y, w, c);
    this.hline(x, y + h - 1, w, c);
    this.vline(x, y, h, c);
    this.vline(x + w - 1, y, h, c);
  }

  /** Bresenham, same as Adafruit_GFX::writeLine */
  line(x0: number, y0: number, x1: number, y1: number, c: number) {
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if (steep) {
      [x0, y0] = [y0, x0];
      [x1, y1] = [y1, x1];
    }
    if (x0 > x1) {
      [x0, x1] = [x1, x0];
      [y0, y1] = [y1, y0];
    }
    const dx = x1 - x0;
    const dy = Math.abs(y1 - y0);
    let err = Math.trunc(dx / 2);
    const ystep = y0 < y1 ? 1 : -1;
    for (; x0 <= x1; x0++) {
      if (steep) this.px(y0, x0, c);
      else this.px(x0, y0, c);
      err -= dy;
      if (err < 0) {
        y0 += ystep;
        err += dx;
      }
    }
  }

  circle(x0: number, y0: number, r: number, c: number) {
    let f = 1 - r;
    let ddFx = 1;
    let ddFy = -2 * r;
    let x = 0;
    let y = r;
    this.px(x0, y0 + r, c);
    this.px(x0, y0 - r, c);
    this.px(x0 + r, y0, c);
    this.px(x0 - r, y0, c);
    while (x < y) {
      if (f >= 0) {
        y--;
        ddFy += 2;
        f += ddFy;
      }
      x++;
      ddFx += 2;
      f += ddFx;
      this.px(x0 + x, y0 + y, c);
      this.px(x0 - x, y0 + y, c);
      this.px(x0 + x, y0 - y, c);
      this.px(x0 - x, y0 - y, c);
      this.px(x0 + y, y0 + x, c);
      this.px(x0 - y, y0 + x, c);
      this.px(x0 + y, y0 - x, c);
      this.px(x0 - y, y0 - x, c);
    }
  }

  circleHelper(x0: number, y0: number, r: number, corner: number, c: number) {
    let f = 1 - r;
    let ddFx = 1;
    let ddFy = -2 * r;
    let x = 0;
    let y = r;
    while (x < y) {
      if (f >= 0) {
        y--;
        ddFy += 2;
        f += ddFy;
      }
      x++;
      ddFx += 2;
      f += ddFx;
      if (corner & 0x4) {
        this.px(x0 + x, y0 + y, c);
        this.px(x0 + y, y0 + x, c);
      }
      if (corner & 0x2) {
        this.px(x0 + x, y0 - y, c);
        this.px(x0 + y, y0 - x, c);
      }
      if (corner & 0x8) {
        this.px(x0 - y, y0 + x, c);
        this.px(x0 - x, y0 + y, c);
      }
      if (corner & 0x1) {
        this.px(x0 - y, y0 - x, c);
        this.px(x0 - x, y0 - y, c);
      }
    }
  }

  fillCircle(x0: number, y0: number, r: number, c: number) {
    this.vline(x0, y0 - r, 2 * r + 1, c);
    this.fillCircleHelper(x0, y0, r, 3, 0, c);
  }

  fillCircleHelper(x0: number, y0: number, r: number, corners: number, delta: number, c: number) {
    let f = 1 - r;
    let ddFx = 1;
    let ddFy = -2 * r;
    let x = 0;
    let y = r;
    let px = x;
    let py = y;
    delta++;
    while (x < y) {
      if (f >= 0) {
        y--;
        ddFy += 2;
        f += ddFy;
      }
      x++;
      ddFx += 2;
      f += ddFx;
      if (x < y + 1) {
        if (corners & 1) this.vline(x0 + x, y0 - y, 2 * y + delta, c);
        if (corners & 2) this.vline(x0 - x, y0 - y, 2 * y + delta, c);
      }
      if (y !== py) {
        if (corners & 1) this.vline(x0 + py, y0 - px, 2 * px + delta, c);
        if (corners & 2) this.vline(x0 - py, y0 - px, 2 * px + delta, c);
        py = y;
      }
      px = x;
    }
  }

  roundRect(x: number, y: number, w: number, h: number, r: number, c: number) {
    const maxR = Math.trunc(Math.min(w, h) / 2);
    if (r > maxR) r = maxR;
    this.hline(x + r, y, w - 2 * r, c);
    this.hline(x + r, y + h - 1, w - 2 * r, c);
    this.vline(x, y + r, h - 2 * r, c);
    this.vline(x + w - 1, y + r, h - 2 * r, c);
    this.circleHelper(x + r, y + r, r, 1, c);
    this.circleHelper(x + w - r - 1, y + r, r, 2, c);
    this.circleHelper(x + w - r - 1, y + h - r - 1, r, 4, c);
    this.circleHelper(x + r, y + h - r - 1, r, 8, c);
  }

  fillRoundRect(x: number, y: number, w: number, h: number, r: number, c: number) {
    const maxR = Math.trunc(Math.min(w, h) / 2);
    if (r > maxR) r = maxR;
    this.fillRect(x + r, y, w - 2 * r, h, c);
    this.fillCircleHelper(x + w - r - 1, y + r, r, 1, h - 2 * r - 1, c);
    this.fillCircleHelper(x + r, y + r, r, 2, h - 2 * r - 1, c);
  }

  /** Classic 5x7 font glyph at integer scale. bg === null means transparent. */
  drawChar(x: number, y: number, ch: number, c: number, bg: number | null, size: number) {
    for (let i = 0; i < 5; i++) {
      let line = FONT5X7[ch * 5 + i];
      for (let j = 0; j < 8; j++, line >>= 1) {
        if (line & 1) this.fillRect(x + i * size, y + j * size, size, size, c);
        else if (bg !== null) this.fillRect(x + i * size, y + j * size, size, size, bg);
      }
    }
    if (bg !== null) this.fillRect(x + 5 * size, y, size, 8 * size, bg);
  }

  /** Mirrors setTextSize + setCursor + print for a single line, wrap disabled. */
  text(x: number, y: number, size: number, str: string, c: number, bg: number | null) {
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      if (code < 32 || code > 126) code = 63; // '?'
      this.drawChar(x, y, code, c, bg, size);
      x += 6 * size;
    }
  }

  /** Mirrors drawBitmap(x, y, bitmap, w, h, color[, bg]) */
  bitmap(x: number, y: number, bits: number[], w: number, h: number, c: number, bg: number | null) {
    const bw = (w + 7) >> 3;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const on = (bits[j * bw + (i >> 3)] & (0x80 >> (i & 7))) !== 0;
        if (on) this.px(x + i, y + j, c);
        else if (bg !== null) this.px(x + i, y + j, bg);
      }
    }
  }

  /**
   * Thick arc drawn as radial lines. The generated sketch contains the same
   * routine (uiArc) so the two stay in step. Angles in degrees, 0 = 3 o'clock,
   * positive = clockwise (screen coordinates).
   */
  arc(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, c: number) {
    const RAD = Math.PI / 180;
    const span = Math.abs(a1 - a0);
    let steps = Math.ceil(r1 * span * RAD * 1.5);
    if (steps < 2) steps = 2;
    // 0.500001 = round-half-up with a tiny bias so JS and C agree on exact .5 cases
    const rnd = (v: number) => Math.floor(v + 0.500001);
    for (let i = 0; i <= steps; i++) {
      const a = (a0 + ((a1 - a0) * i) / steps) * RAD;
      const co = Math.cos(a);
      const si = Math.sin(a);
      this.line(cx + rnd(co * r0), cy + rnd(si * r0), cx + rnd(co * r1), cy + rnd(si * r1), c);
    }
  }
}

/** Pack a row-major boolean image (w*h) into Adafruit's 1bpp MSB-first format. */
export function packBits(pixels: ArrayLike<number | boolean>, w: number, h: number): number[] {
  const bw = (w + 7) >> 3;
  const out = new Array<number>(bw * h).fill(0);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (pixels[j * w + i]) out[j * bw + (i >> 3)] |= 0x80 >> (i & 7);
    }
  }
  return out;
}

/** Nearest-neighbour integer upscale of a packed bitmap. */
export function scaleBits(bits: number[], w: number, h: number, s: number): number[] {
  if (s === 1) return bits.slice();
  const bw = (w + 7) >> 3;
  const px = new Uint8Array(w * s * h * s);
  const W = w * s;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++)
      if (bits[j * bw + (i >> 3)] & (0x80 >> (i & 7)))
        for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) px[(j * s + dy) * W + i * s + dx] = 1;
  return packBits(px, W, h * s);
}
