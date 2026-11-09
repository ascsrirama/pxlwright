<script lang="ts">
  import type { BatteryEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';

  let { el }: { el: BatteryEl } = $props();
</script>

<Num label="Level" bind:value={el.level} min={0} max={100} suffix="%" />
<Num label="Scale" bind:value={el.scale} min={1} max={4} suffix="×" />
