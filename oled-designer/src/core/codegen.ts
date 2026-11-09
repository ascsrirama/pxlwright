import type { DisplayConfig, DisplayPreset, El, Op, Project } from './types';
import { presetById } from './displays';
import { opsFor } from './elements';
import { clippedPixels, monoOn, rgb565 } from './render';

export interface GeneratedCode {
  /** Complete .ino sketch (or a usage stub for custom displays) */
  sketch: string;
  /** Just the drawing code, to paste into an existing project */
  snippet: string;
  warnings: string[];
}

const hex16 = (v: number) => '0x' + v.toString(16).toUpperCase().padStart(4, '0');
const hex8 = (v: number) => '0x' + v.toString(16).toUpperCase().padStart(2, '0');

function cString(s: string, warnings: string[], who: string): string {
  let bad = false;
  const out = [...s]
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (ch === '\\') return '\\\\';
      if (ch === '"') return '\\"';
      if (code < 32 || code > 126) {
        bad = true;
        return '?';
      }
      if (ch === '?') return '\\?'; // avoid accidental trigraphs
      return ch;
    })
    .join('');
  if (bad) warnings.push(`“${who}” contains characters outside ASCII 32–126; the built-in font can’t draw them, so they become “?”.`);
  return out;
}

function num(n: number): string {
  if (Number.isInteger(n)) return `${n}.0`;
  return String(parseFloat(n.toFixed(4)));
}

function sanitizeName(raw: string): string {
  const s = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return 'bmp_' + (s || 'image');
}

interface Ctx {
  d: DisplayConfig;
  preset: DisplayPreset;
  colorName: (hex: string) => string;
  bitmapName: (op: Extract<Op, { k: 'bitmap' }>) => string;
  usesArc: boolean;
  warnings: string[];
}

function opLines(op: Op, ctx: Ctx, st: { size: number; fg: string; bg: string }): string[] {
  const C = ctx.colorName;
  switch (op.k) {
    case 'line':
      return [`d.drawLine(${op.x0}, ${op.y0}, ${op.x1}, ${op.y1}, ${C(op.c)});`];
    case 'rect': {
      if (op.r > 0)
        return [`d.${op.fill ? 'fillRoundRect' : 'drawRoundRect'}(${op.x}, ${op.y}, ${op.w}, ${op.h}, ${op.r}, ${C(op.c)});`];
      return [`d.${op.fill ? 'fillRect' : 'drawRect'}(${op.x}, ${op.y}, ${op.w}, ${op.h}, ${C(op.c)});`];
    }
    case 'circle':
      return [`d.${op.fill ? 'fillCircle' : 'drawCircle'}(${op.x}, ${op.y}, ${op.r}, ${C(op.c)});`];
    case 'text': {
      const out: string[] = [];
      if (st.size !== op.size) {
        out.push(`d.setTextSize(${op.size});`);
        st.size = op.size;
      }
      const fg = C(op.c);
      const bg = op.bg === null ? '' : C(op.bg);
      if (st.fg !== fg || st.bg !== bg) {
        out.push(bg ? `d.setTextColor(${fg}, ${bg});` : `d.setTextColor(${fg});`);
        st.fg = fg;
        st.bg = bg;
      }
      out.push(`d.setCursor(${op.x}, ${op.y});`);
      out.push(`d.print(F("${cString(op.str, ctx.warnings, op.str)}"));`);
      return out;
    }
    case 'bitmap': {
      const bg = op.bg === null ? '' : `, ${C(op.bg)}`;
      return [`d.drawBitmap(${op.x}, ${op.y}, ${ctx.bitmapName(op)}, ${op.w}, ${op.h}, ${C(op.c)}${bg});`];
    }
    case 'arc':
      ctx.usesArc = true;
      return [`uiArc(d, ${op.cx}, ${op.cy}, ${op.r0}, ${op.r1}, ${num(op.a0)}, ${num(op.a1)}, ${C(op.c)});`];
  }
}

const ARC_HELPER = `// Thick arc drawn as radial lines. Angles in degrees: 0 = 3 o'clock, clockwise.
static void uiArc(Adafruit_GFX &d, int cx, int cy, int r0, int r1, double a0, double a1, uint16_t color) {
  const double RAD = 3.14159265358979323846 / 180.0;
  double span = a1 > a0 ? a1 - a0 : a0 - a1;
  int steps = (int)ceil(r1 * span * RAD * 1.5);
  if (steps < 2) steps = 2;
  for (int i = 0; i <= steps; i++) {
    double a = (a0 + (a1 - a0) * i / steps) * RAD;
    double co = cos(a), si = sin(a);
    d.drawLine(cx + (int)floor(co * r0 + 0.500001), cy + (int)floor(si * r0 + 0.500001),
               cx + (int)floor(co * r1 + 0.500001), cy + (int)floor(si * r1 + 0.500001), color);
  }
}`;

export function generate(project: Project): GeneratedCode {
  const d = project.display;
  const preset = presetById(d.presetId);
  const driver = preset.driver;
  const warnings: string[] = [];
  const mono = d.color === 'mono';

  /* ---- colour naming ---- */
  const palette: { name: string; hex: string; value: number }[] = [];
  const colorName = (hex: string): string => {
    if (mono) return monoOn(hex) ? 'UI_ON' : 'UI_OFF';
    const v = rgb565(hex);
    let f = palette.find((p) => p.value === v);
    if (!f) {
      f = { name: `UI_COLOR_${palette.length + 1}`, hex: hex.toLowerCase(), value: v };
      palette.push(f);
    }
    return f.name;
  };

  /* ---- bitmaps ---- */
  const bitmaps: { name: string; w: number; h: number; bits: number[]; key: string }[] = [];
  const usedNames = new Set<string>();
  const bitmapName = (op: Extract<Op, { k: 'bitmap' }>): string => {
    const key = `${op.w}x${op.h}:${op.bits.join(',')}`;
    const f = bitmaps.find((b) => b.key === key);
    if (f) return f.name;
    const base = sanitizeName(op.name);
    let name = base;
    for (let i = 2; usedNames.has(name); i++) name = `${base}_${i}`;
    usedNames.add(name);
    bitmaps.push({ name, w: op.w, h: op.h, bits: op.bits, key });
    return name;
  };

  const ctx: Ctx = { d, preset, colorName, bitmapName, usesArc: false, warnings };

  /* ---- body ---- */
  const body: string[] = [];
  const st = { size: -1, fg: '', bg: '\u0000' };
  for (const e of project.elements) {
    if (!e.visible) continue;
    const ops = opsFor(e);
    if (!ops.length) {
      if (e.type === 'image') warnings.push(`“${e.name}” has no image yet, so nothing is exported for it.`);
      continue;
    }
    body.push(`  // ${e.name.replace(/[\r\n]/g, ' ')}`);
    for (const op of ops) for (const l of opLines(op, ctx, st)) body.push('  ' + l);
    body.push('');

    const clip = clippedPixels(e, d);
    if (clip > 0)
      warnings.push(
        d.shape === 'round'
          ? `“${e.name}” draws ${clip} pixel${clip === 1 ? '' : 's'} outside the circular visible area.`
          : `“${e.name}” draws ${clip} pixel${clip === 1 ? '' : 's'} outside the screen.`
      );
  }
  if (body.length && body[body.length - 1] === '') body.pop();
  const bg = mono ? 'UI_OFF' : colorName('#000000');

  /* ---- assemble drawing code ---- */
  const parts: string[] = [];

  if (mono) {
    parts.push(
      `#ifndef UI_ON\n#define UI_ON  ${driver?.on ?? '1'}\n#define UI_OFF ${driver?.off ?? '0'}\n#endif`
    );
  } else if (palette.length) {
    parts.push(palette.map((p) => `#define ${p.name} ${hex16(p.value)}  // ${p.hex}`).join('\n'));
  }

  if (bitmaps.length) {
    parts.push(
      bitmaps
        .map((b) => {
          const lines: string[] = [];
          for (let i = 0; i < b.bits.length; i += 12)
            lines.push('  ' + b.bits.slice(i, i + 12).map(hex8).join(', '));
          return `// ${b.w}x${b.h}, 1 bit per pixel\nconst unsigned char ${b.name}[] PROGMEM = {\n${lines.join(',\n')}\n};`;
        })
        .join('\n\n')
    );
  }

  if (ctx.usesArc) parts.push(ARC_HELPER);

  const draw = [
    '// Draws the whole screen. Works with any Adafruit_GFX display.',
    'void drawUI(Adafruit_GFX &d) {',
    `  d.fillScreen(${bg});`,
    '  d.setTextWrap(false);',
    ...(body.length ? ['', ...body] : []),
    '}'
  ].join('\n');
  parts.push(draw);

  const snippet = [
    `// OLED Designer — ${preset.id === 'custom' ? `custom ${d.width}x${d.height}` : preset.name}, ${d.width}x${d.height}${d.shape === 'round' ? ' (round)' : ''}`,
    '// Needs: Adafruit GFX Library (include <Adafruit_GFX.h>; math.h is used for arcs)',
    '',
    parts.join('\n\n'),
    ''
  ].join('\n');

  /* ---- full sketch ---- */
  let sketch: string;
  if (driver) {
    const libs = [
      'Adafruit GFX Library',
      ...driver.includes
        .map((l) => /<Adafruit_(.+)\.h>/.exec(l)?.[1])
        .filter((n): n is string => !!n && n !== 'GFX')
        .map((n) => `Adafruit ${n}`)
    ];
    const header = [
      `/*`,
      ` * Generated by OLED Designer`,
      ` * Display: ${preset.name}${preset.note ? ` — ${preset.note}` : ''}`,
      ` * Libraries (Library Manager): ${libs.join(', ')}`,
      d.shape === 'round'
        ? ` * Round panel: the visible area is a circle centred at (${d.width / 2}, ${d.height / 2}) with radius ${Math.min(d.width, d.height) / 2}.`
        : null,
      ` */`
    ]
      .filter((l): l is string => l !== null)
      .join('\n');

    const needsMath = ctx.usesArc ? ['#include <math.h>'] : [];
    sketch = [
      header,
      [...driver.includes, ...needsMath].join('\n'),
      '',
      `#define SCREEN_WIDTH  ${d.width}`,
      `#define SCREEN_HEIGHT ${d.height}`,
      ...driver.defines,
      '',
      ...driver.declare,
      '',
      parts.join('\n\n'),
      '',
      'void setup() {',
      '  Serial.begin(115200);',
      ...driver.begin.map((l) => '  ' + l),
      '',
      '  drawUI(display);',
      ...(driver.needsFlush ? ['  display.display();  // push the buffer to the panel'] : []),
      '}',
      '',
      'void loop() {',
      '  // Static screen. To animate, call drawUI(display) again after changing values.',
      '}',
      ''
    ].join('\n');
  } else {
    sketch = [
      snippet,
      '// ---- usage ----',
      '// Create your display object with whichever Adafruit_GFX-compatible driver you use,',
      `// make sure it is ${d.width}x${d.height}, then:`,
      '//',
      '//   drawUI(display);',
      mono ? '//   display.display();   // if your driver buffers (SSD1306, SH110X, ...)' : null,
      ''
    ]
      .filter((l): l is string => l !== null)
      .join('\n');
  }

  return { sketch, snippet, warnings: [...new Set(warnings)] };
}
