<!-- Pop-up messages at the bottom of the screen (errors such as a bad file). -->
<script lang="ts">
  import { editor } from '../../state/editor.svelte';
</script>

<div class="toasts" aria-live="polite">
  {#each editor.toasts as t (t.id)}<div class="toast">{t.text}</div>{/each}
</div>

<style>
  .toasts { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 30; }
  .toast {
    background: var(--toast-bg); border: 1px solid var(--toast-line); color: var(--toast-text);
    padding: 8px 14px; border-radius: 8px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  }
</style>
