import { editor } from './editor.svelte';

/** Make the browser download `text` as a file. */
export function downloadText(filename: string, text: string, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Download the current design as a .json project file. */
export function saveProjectFile() {
  downloadText('oled-design.json', editor.exportJson(), 'application/json');
}

/** Load a .json project file chosen by the user. */
export async function openProjectFile(file: File) {
  try {
    editor.importJson(await file.text());
  } catch (err) {
    editor.toast(err instanceof Error ? err.message : 'Could not open that file.');
  }
}

/** Start a new, empty design (asks first if there is something to lose). */
export function newProject() {
  if (editor.elements.length && !confirm('Clear everything and start a new design? You can undo this.')) return;
  editor.newProject();
}
