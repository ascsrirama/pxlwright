import { editor } from './editor.svelte';

/** True when the key press happened inside a text box (so shortcuts should stay out of the way). */
function inField(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

let nudgeTimer: ReturnType<typeof setTimeout> | undefined;
function nudgeCommit() {
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => editor.commit(), 350);
}

/**
 * Editor keyboard shortcuts:
 *   Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y  undo / redo
 *   Ctrl+D                          duplicate
 *   Arrows (Shift = 8px)            nudge
 *   Delete / Backspace              delete
 *   Escape                          deselect
 */
export function handleShortcut(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();
  if (mod && key === 'z' && !inField(e.target)) {
    e.preventDefault();
    e.shiftKey ? editor.redo() : editor.undo();
    return;
  }
  if (mod && key === 'y' && !inField(e.target)) {
    e.preventDefault();
    editor.redo();
    return;
  }
  if (inField(e.target)) return;
  const sel = editor.selected;
  if (mod && key === 'd' && sel) {
    e.preventDefault();
    editor.duplicate(sel.id);
    return;
  }
  if (!sel) return;
  const step = e.shiftKey ? 8 : 1;
  const arrows: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step]
  };
  if (e.key in arrows) {
    e.preventDefault();
    const [dx, dy] = arrows[e.key];
    editor.nudge(dx, dy);
    nudgeCommit();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    editor.remove(sel.id);
  } else if (e.key === 'Escape') {
    editor.select(null);
  }
}
