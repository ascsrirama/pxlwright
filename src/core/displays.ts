import type { DisplayConfig, DisplayPreset, DriverInfo } from './types';

const ssd1306 = (addr = '0x3C'): DriverInfo => ({
  includes: ['#include <Wire.h>', '#include <Adafruit_GFX.h>', '#include <Adafruit_SSD1306.h>'],
  declare: ['Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);'],
  begin: [
    'Wire.begin();',
    `if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {`,
    '  Serial.println(F("SSD1306 allocation failed"));',
    '  for (;;) {}',
    '}'
  ],
  needsFlush: true,
  on: 'SSD1306_WHITE',
  off: 'SSD1306_BLACK',
  defines: [`#define OLED_ADDRESS ${addr}  // I2C address (0x3C or 0x3D); 0x3C for most modules`]
});

const sh110x = (cls: string, addr = '0x3C'): DriverInfo => ({
  includes: ['#include <Wire.h>', '#include <Adafruit_GFX.h>', '#include <Adafruit_SH110X.h>'],
  declare: [`${cls} display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire);`],
  begin: ['Wire.begin();', 'display.begin(OLED_ADDRESS, true);'],
  needsFlush: true,
  on: 'SH110X_WHITE',
  off: 'SH110X_BLACK',
  defines: [`#define OLED_ADDRESS ${addr}  // I2C address`]
});

const spiPins = (): string[] => [
  '#define PIN_CS   5   // chip select  - change to match your wiring',
  '#define PIN_DC   16  // data/command',
  '#define PIN_RST  17  // reset (-1 if tied to the MCU reset)'
];

export const PRESETS: DisplayPreset[] = [
  /* ---- monochrome OLED, rectangular ---- */
  {
    id: 'ssd1306-128x64',
    name: 'SSD1306 128×64',
    part: 'SSD1306',
    width: 128,
    height: 64,
    shape: 'rect',
    color: 'mono',
    note: '0.96" – the common I²C OLED',
    driver: ssd1306()
  },
  {
    id: 'ssd1306-128x32',
    name: 'SSD1306 128×32',
    part: 'SSD1306',
    width: 128,
    height: 32,
    shape: 'rect',
    color: 'mono',
    note: '0.91"',
    driver: ssd1306()
  },
  {
    id: 'ssd1306-64x48',
    name: 'SSD1306 64×48',
    part: 'SSD1306',
    width: 64,
    height: 48,
    shape: 'rect',
    color: 'mono',
    note: '0.66" (Wemos D1 mini shield). Check your module’s column offset.',
    driver: ssd1306()
  },
  {
    id: 'ssd1306-96x16',
    name: 'SSD1306 96×16',
    part: 'SSD1306',
    width: 96,
    height: 16,
    shape: 'rect',
    color: 'mono',
    note: '0.69"',
    driver: ssd1306()
  },
  {
    id: 'sh1106-128x64',
    name: 'SH1106 128×64',
    part: 'SH1106',
    width: 128,
    height: 64,
    shape: 'rect',
    color: 'mono',
    note: '1.3" – looks like an SSD1306 but needs its own driver',
    driver: sh110x('Adafruit_SH1106G')
  },
  {
    id: 'sh1107-128x128',
    name: 'SH1107 128×128',
    part: 'SH1107',
    width: 128,
    height: 128,
    shape: 'rect',
    color: 'mono',
    driver: sh110x('Adafruit_SH1107')
  },
  /* ---- colour, rectangular ---- */
  {
    id: 'ssd1331-96x64',
    name: 'SSD1331 96×64',
    part: 'SSD1331',
    width: 96,
    height: 64,
    shape: 'rect',
    color: 'rgb',
    note: '0.96" colour OLED (SPI)',
    driver: {
      includes: ['#include <SPI.h>', '#include <Adafruit_GFX.h>', '#include <Adafruit_SSD1331.h>'],
      declare: ['Adafruit_SSD1331 display(&SPI, PIN_CS, PIN_DC, PIN_RST);'],
      begin: ['display.begin();'],
      needsFlush: false,
      defines: spiPins()
    }
  },
  {
    id: 'ssd1351-128x128',
    name: 'SSD1351 128×128',
    part: 'SSD1351',
    width: 128,
    height: 128,
    shape: 'rect',
    color: 'rgb',
    note: '1.5" colour OLED (SPI)',
    driver: {
      includes: ['#include <SPI.h>', '#include <Adafruit_GFX.h>', '#include <Adafruit_SSD1351.h>'],
      declare: ['Adafruit_SSD1351 display(SCREEN_WIDTH, SCREEN_HEIGHT, &SPI, PIN_CS, PIN_DC, PIN_RST);'],
      begin: ['display.begin();'],
      needsFlush: false,
      defines: spiPins()
    }
  },
  {
    id: 'st7735-160x128',
    name: 'ST7735 160×128',
    part: 'ST7735',
    width: 160,
    height: 128,
    shape: 'rect',
    color: 'rgb',
    note: '1.8" TFT (SPI). Pick the INITR_ tab that matches your module.',
    driver: {
      includes: ['#include <SPI.h>', '#include <Adafruit_GFX.h>', '#include <Adafruit_ST7735.h>'],
      declare: ['Adafruit_ST7735 display(PIN_CS, PIN_DC, PIN_RST);'],
      begin: ['display.initR(INITR_BLACKTAB);', 'display.setRotation(1); // landscape, 160x128'],
      needsFlush: false,
      defines: spiPins()
    }
  },
  {
    id: 'st7789-240x240',
    name: 'ST7789 240×240',
    part: 'ST7789',
    width: 240,
    height: 240,
    shape: 'rect',
    color: 'rgb',
    note: '1.3"/1.54" square IPS TFT (SPI)',
    driver: {
      includes: ['#include <SPI.h>', '#include <Adafruit_GFX.h>', '#include <Adafruit_ST7789.h>'],
      declare: ['Adafruit_ST7789 display(PIN_CS, PIN_DC, PIN_RST);'],
      begin: ['display.init(SCREEN_WIDTH, SCREEN_HEIGHT);'],
      needsFlush: false,
      defines: spiPins()
    }
  },
  /* ---- round ---- */
  {
    id: 'gc9a01-240x240',
    name: 'GC9A01 240×240 (round)',
    part: 'GC9A01',
    width: 240,
    height: 240,
    shape: 'round',
    color: 'rgb',
    note: '1.28" round IPS TFT (SPI)',
    driver: {
      includes: ['#include <SPI.h>', '#include <Adafruit_GFX.h>', '#include <Adafruit_GC9A01A.h>'],
      declare: ['Adafruit_GC9A01A display(PIN_CS, PIN_DC, PIN_RST);'],
      begin: ['display.begin();'],
      needsFlush: false,
      defines: spiPins()
    }
  },
  /* ---- custom ---- */
  {
    id: 'custom',
    name: 'Custom…',
    part: 'Other',
    width: 128,
    height: 64,
    shape: 'rect',
    color: 'mono',
    note: 'Any Adafruit_GFX-compatible display. You get the drawing function and wire up the driver yourself.',
    driver: null
  }
];

export const TINTS: { name: string; hex: string }[] = [
  { name: 'White', hex: '#e9f4ff' },
  { name: 'Blue', hex: '#4aa8ff' },
  { name: 'Amber', hex: '#ffb000' },
  { name: 'Green', hex: '#3dff7a' }
];

export function presetById(id: string): DisplayPreset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

export function configFromPreset(p: DisplayPreset, tint = TINTS[0].hex): DisplayConfig {
  return {
    presetId: p.id,
    width: p.width,
    height: p.height,
    shape: p.shape,
    color: p.color,
    tint
  };
}

/** True when the pixel (x,y) lies inside the visible area of the display. */
export function insideDisplay(d: DisplayConfig, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= d.width || y >= d.height) return false;
  if (d.shape === 'rect') return true;
  const cx = d.width / 2;
  const cy = d.height / 2;
  const r = Math.min(d.width, d.height) / 2;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  return dx * dx + dy * dy <= r * r;
}
