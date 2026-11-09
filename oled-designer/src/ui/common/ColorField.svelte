<script lang="ts">
  import { editor } from '../../state/editor.svelte';
  import { monoOn } from '../../core/render';

  let { value = $bindable('#ffffff'), label }: { value: string; label: string } = $props();

  const swatches = ['#ffffff', '#33d6ff', '#4ade80', '#ffd23f', '#ff9f1c', '#ff4d6d', '#c77dff', '#5b8cff'];
  const mono = $derived(editor.display.color === 'mono');
</script>

<div class="field">
  <span>{label}</span>
  {#if mono}
    <div class="seg" role="group" aria-label={label}>
      <button type="button" class:active={monoOn(value)} onclick={() => { value = '#ffffff'; editor.commit(); }}>On</button>
      <button type="button" class:active={!monoOn(value)} onclick={() => { value = '#000000'; editor.commit(); }}>Off</button>
    </div>
  {:else}
    <div class="colors">
      <input type="color" {value} oninput={(e) => (value = e.currentTarget.value)} aria-label={label} />
      {#each swatches as s}
        <button
          type="button"
          class="sw"
          class:active={value.toLowerCase() === s}
          style:background={s}
          title={s}
          aria-label={s}
          onclick={() => { value = s; editor.commit(); }}
        ></button>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* On / Off switch used for monochrome displays */
  .seg { display: inline-flex; border: 1px solid var(--line-2); border-radius: 6px; overflow: hidden; width: max-content; }
  .seg button { background: var(--bg); border: 0; padding: 5px 16px; cursor: pointer; color: var(--dim); }
  .seg button.active { background: var(--accent); color: var(--accent-ink); font-weight: 600; }
  input[type='color'] { width: 30px; height: 26px; padding: 0; border: 1px solid var(--line-2); border-radius: 6px; background: none; cursor: pointer; }
</style>
