<!-- The "Get code" dialog: full sketch / drawing-only tabs, warnings, copy and download. -->
<script lang="ts">
  import { editor } from '../../state/editor.svelte';
  import { downloadText } from '../../state/files';
  import { generate } from '../../core/codegen';
  import { presetById } from '../../core/displays';
  import Icon from '../common/Icon.svelte';

  let { onclose }: { onclose: () => void } = $props();

  let tab = $state<'sketch' | 'snippet'>('sketch');
  let copied = $state(false);

  const code = $derived(generate(editor.project));
  const text = $derived(tab === 'sketch' ? code.sketch : code.snippet);
  const preset = $derived(presetById(editor.display.presetId));
  const lineCount = $derived(text.split('\n').length);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copied = true;
    setTimeout(() => (copied = false), 1600);
  }

  function download() {
    downloadText(tab === 'sketch' ? 'oled_ui.ino' : 'oled_ui.h', text);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="overlay" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="dialog" role="dialog" aria-modal="true" aria-label="Export code">
    <header>
      <h2>Arduino code</h2>
      <span class="grow"></span>
      <button type="button" class="ib" onclick={onclose} title="Close (Esc)"><Icon name="close" /></button>
    </header>

    <div class="tabs" role="tablist">
      <button type="button" role="tab" aria-selected={tab === 'sketch'} class:active={tab === 'sketch'} onclick={() => (tab = 'sketch')}>
        Full sketch
      </button>
      <button type="button" role="tab" aria-selected={tab === 'snippet'} class:active={tab === 'snippet'} onclick={() => (tab = 'snippet')}>
        Drawing code only
      </button>
      <span class="grow"></span>
      <span class="meta">{preset.id === 'custom' ? 'Custom display' : preset.name} · {lineCount} lines</span>
    </div>

    {#if tab === 'snippet'}
      <p class="hint pad">
        A single <code>drawUI(Adafruit_GFX &amp;d)</code> function plus any bitmaps. Paste it into a project you already have, then call
        <code>drawUI(display)</code>.
      </p>
    {:else if !preset.driver}
      <p class="hint pad">No driver is known for a custom display, so this contains the drawing code and usage notes.</p>
    {:else}
      <p class="hint pad">
        Save as <code>oled_ui/oled_ui.ino</code>, check the pin / address <code>#define</code>s near the top, then upload.
      </p>
    {/if}

    {#if code.warnings.length}
      <ul class="warnings" aria-label="Warnings">
        {#each code.warnings as w}<li>{w}</li>{/each}
      </ul>
    {/if}

    <!-- svelte-ignore a11y_no_noninteractive_tabindex (scrollable code region must be keyboard reachable) -->
    <pre class="code" tabindex="0" role="region" aria-label="Generated code"><code>{text}</code></pre>

    <footer>
      <button type="button" class="btn primary" onclick={copy}><Icon name="copy" size={15} /> {copied ? 'Copied!' : 'Copy'}</button>
      <button type="button" class="btn" onclick={download}>
        <Icon name="download" size={15} /> Download {tab === 'sketch' ? '.ino' : '.h'}
      </button>
    </footer>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(5, 7, 10, 0.72); display: grid; place-items: center; padding: 24px; z-index: 20; }
  .dialog {
    width: min(920px, 100%); max-height: 100%; display: flex; flex-direction: column;
    background: var(--panel); border: 1px solid var(--line-2); border-radius: 12px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6); overflow: hidden;
  }
  header { display: flex; align-items: center; padding: 12px 14px 12px 18px; border-bottom: 1px solid var(--line); }
  h2 { font-size: 15px; }
  .tabs { display: flex; align-items: center; gap: 4px; padding: 10px 18px 0; }
  .tabs button { background: none; border: 0; border-bottom: 2px solid transparent; padding: 6px 10px; cursor: pointer; color: var(--dim); }
  .tabs button.active { color: var(--text); border-bottom-color: var(--accent); }
  .meta { color: var(--dim); font-size: 12px; }
  .hint.pad { margin: 0; padding: 10px 18px 0; }
  .warnings {
    margin: 10px 18px 0; padding: 8px 12px 8px 28px; border-radius: var(--radius); font-size: 12px;
    background: var(--warn-soft); border: 1px solid var(--warn-line); color: var(--warn);
  }
  .code {
    flex: 1; min-height: 160px; margin: 12px 18px; padding: 12px 14px; overflow: auto;
    background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius);
    font: 12px/1.55 var(--mono); tab-size: 2;
  }
  .code code { background: none; padding: 0; font-size: inherit; }
  footer { display: flex; gap: 10px; padding: 0 18px 16px; }
  footer .btn { margin-top: 0; }
</style>
