export type Shape = 'rect' | 'round';
export type ColorMode = 'mono' | 'rgb';

/** How the generated Arduino sketch talks to a given display. */
export interface DriverInfo {
  /** #include lines */
  includes: string[];
  /** Global declaration(s) that create the `display` object. May use PIN_* macros. */
  declare: string[];
  /** Lines placed in setup() to initialise the display. */
  begin: string[];
  /** Whether a display.display() call is needed to push the buffer. */
  needsFlush: boolean;
  /** Macro names for mono "on"/"off". Unused for RGB displays. */
  on?: string;
  off?: string;
  /** Pin / address #defines the user should check. */
  defines: string[];
}

export interface DisplayPreset {
  id: string;
  /** Human label, e.g. "SSD1306 128×64" */
  name: string;
  /** Controller part number shown in the picker, e.g. "SSD1306" */
  part: string;
  width: number;
  height: number;
  shape: Shape;
  color: ColorMode;
  note?: string;
  driver: DriverInfo | null; // null = custom / unknown driver
}

/** The display the user is currently designing for (preset values, possibly customised). */
export interface DisplayConfig {
  presetId: string;
  width: number;
  height: number;
  shape: Shape;
  color: ColorMode;
  /** Preview tint for mono panels (CSS hex). Not exported. */
  tint: string;
}

/* ---------------- Elements ---------------- */

interface Base {
  id: string;
  name: string;
  x: number;
  y: number;
  visible: boolean;
  locked: boolean;
  /** Foreground colour (#rrggbb). On mono displays anything bright means "on". */
  color: string;
}

export interface TextEl extends Base {
  type: 'text';
  text: string;
  size: number; // 1..8
  /** null = transparent background */
  bg: string | null;
}

export interface RectEl extends Base {
  type: 'rect';
  w: number;
  h: number;
  radius: number;
  fill: boolean;
}

export interface CircleEl extends Base {
  type: 'circle';
  /** x,y is the top-left of the bounding box; diameter = 2r+1 */
  r: number;
  fill: boolean;
}

export interface LineEl extends Base {
  type: 'line';
  x2: number;
  y2: number;
}

export interface ImageEl extends Base {
  type: 'image';
  w: number;
  h: number;
  assetId: string;
  threshold: number; // 0..255
  invert: boolean;
  dither: boolean;
  /** Packed 1bpp, MSB first, rows padded to whole bytes (Adafruit drawBitmap format) */
  bits: number[];
  bg: string | null;
}

export interface IconEl extends Base {
  type: 'icon';
  iconId: string;
  scale: number; // 1..6
  bg: string | null;
}

export interface ProgressEl extends Base {
  type: 'progress';
  w: number;
  h: number;
  value: number; // 0..100
  radius: number;
}

export interface BatteryEl extends Base {
  type: 'battery';
  scale: number; // 1..4
  level: number; // 0..100
}

export interface SignalEl extends Base {
  type: 'signal';
  scale: number; // 1..4
  level: number; // 0..4
}

export interface ToggleEl extends Base {
  type: 'toggle';
  scale: number; // 1..4
  on: boolean;
}

export interface MenuEl extends Base {
  type: 'menu';
  items: string[];
  selected: number;
  size: number; // text size 1..3
  w: number;
}

export interface GaugeEl extends Base {
  type: 'gauge';
  /** x,y is the top-left of the bounding square */
  r: number; // outer radius
  thickness: number;
  value: number; // 0..100
  startAngle: number; // degrees, 0 = 3 o'clock, clockwise positive
  sweep: number; // degrees
}

export type El =
  | TextEl
  | RectEl
  | CircleEl
  | LineEl
  | ImageEl
  | IconEl
  | ProgressEl
  | BatteryEl
  | SignalEl
  | ToggleEl
  | MenuEl
  | GaugeEl;

export type ElType = El['type'];

export interface Project {
  version: 1;
  display: DisplayConfig;
  elements: El[];
  /** assetId -> data URL of the (downscaled) source image */
  assets: Record<string, string>;
}

/* ---------------- Draw ops (shared by preview + code generator) ---------------- */

export type Op =
  | { k: 'line'; x0: number; y0: number; x1: number; y1: number; c: string }
  | { k: 'rect'; x: number; y: number; w: number; h: number; r: number; fill: boolean; c: string }
  | { k: 'circle'; x: number; y: number; r: number; fill: boolean; c: string }
  | { k: 'text'; x: number; y: number; size: number; str: string; c: string; bg: string | null }
  | {
      k: 'bitmap';
      x: number;
      y: number;
      w: number;
      h: number;
      bits: number[];
      name: string;
      c: string;
      bg: string | null;
    }
  | {
      k: 'arc';
      cx: number;
      cy: number;
      r0: number;
      r1: number;
      a0: number;
      a1: number;
      c: string;
    };
