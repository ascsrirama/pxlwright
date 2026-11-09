import { onMount } from 'svelte';
import { editor } from './editor.svelte';

/**
 * Restore the last design on start-up and save changes to the browser as you work.
 * Call once while the root component is being set up.
 */
export function useAutosave(delayMs = 600) {
  onMount(() => {
    if (!editor.loadSaved()) editor.loadStarter();
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    JSON.stringify(editor.project); // track every change
    clearTimeout(timer);
    timer = setTimeout(() => editor.persist(), delayMs);
  });
}
