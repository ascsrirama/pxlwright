<script lang="ts">
  import type { ToggleEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';

  let { el }: { el: ToggleEl } = $props();
</script>

<label class="check"><input type="checkbox" bind:checked={el.on} /><span>On</span></label>
<Num label="Scale" bind:value={el.scale} min={1} max={4} suffix="×" />
