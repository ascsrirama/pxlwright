<script lang="ts">
  import type { TextEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';
  import ColorField from '../../common/ColorField.svelte';
  import OpaqueBg from './OpaqueBg.svelte';

  let { el }: { el: TextEl } = $props();
</script>

<label class="field">
  <span>Text</span>
  <textarea rows="3" bind:value={el.text} spellcheck="false"></textarea>
</label>
<p class="hint">Built-in 5×7 font, ASCII only. Press Enter for a new line.</p>
<Num label="Size" bind:value={el.size} min={1} max={8} suffix={`×  (${7 * el.size}px tall)`} />
<OpaqueBg {el} />
{#if el.bg !== null}<ColorField label="Background" bind:value={el.bg} />{/if}
