# OLED Designer

OLED Designer is a browser-based editor for designing user interfaces for small displays, such as the common 0.96" SSD1306 OLED or round GC9A01 screens. You lay out your screen by dragging elements onto a pixel-accurate canvas, and the app generates Arduino code that draws exactly what you see.

## What it does

- **Pick your display.** Choose a part number and the work area is created at that panel's real resolution. Round displays show their circular visible area, and anything outside it is flagged.
- **Design visually.** Add text, rectangles, circles, lines, images and icons, plus ready-made widgets: progress bar, battery, signal bars, toggle, menu list and arc gauge. Move, resize, reorder, lock, hide, duplicate, undo and redo.
- **Import images.** Pictures are converted to 1-bit bitmaps, with threshold, invert and dithering controls.
- **Get the code.** Export a complete Arduino sketch for your display driver, or just a `drawUI()` function to paste into an existing project. Code targets the Adafruit GFX library, and the preview matches its output pixel for pixel.
- **Save your work.** Designs autosave in the browser and can be saved to or opened from a `.json` project file.

## Supported displays

| Driver | Sizes |
| --- | --- |
| SSD1306 | 128×64, 128×32, 64×48, 96×16 |
| SH1106 | 128×64 |
| SH1107 | 128×128 |
| SSD1331 | 96×64 (colour) |
| SSD1351 | 128×128 (colour) |
| ST7735 | 160×128 (colour) |
| ST7789 | 240×240 (colour) |
| GC9A01 | 240×240 (colour, round) |
| Custom | any size, rectangular or round, mono or colour |

## Current limitations

- Generated code uses Adafruit GFX and its built-in 5×7 font (sizes 1–8, ASCII only). U8g2 and custom fonts are not supported yet.
- Each `drawUI()` call draws a static screen; live values and animation are not generated yet.
- The pin and I²C address settings in a generated sketch are placeholders. Check them against your wiring.
- On 8-bit AVR boards, an arc gauge's edge can differ from the preview by one pixel.
- Some SSD1306 64×48 modules need a column offset that depends on the module.

## Copyright and licence

Copyright © 2026 Rama Anumanchipalli. All rights reserved.

Code you generate with OLED Designer is yours to use however you like.

### Third-party code

Parts of this project are derived from the [Adafruit GFX Library](https://github.com/adafruit/Adafruit-GFX-Library), Copyright © 2012 Adafruit Industries, used under the BSD licence:

- the classic 5×7 font data (`src/core/font5x7.ts`)
- the drawing algorithms ported to TypeScript (`src/core/gfx.ts`)

The full licence text is in [`NOTICE`](NOTICE). Adafruit GFX is not affiliated with or endorsing this project. The generated Arduino code requires the Adafruit GFX library and the relevant display driver library, each under its own licence.
