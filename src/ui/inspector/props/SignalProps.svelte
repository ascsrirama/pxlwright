<script lang="ts">
  import type { SignalEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';

  let { el }: { el: SignalEl } = $props();
</script>

<Num label="Bars" bind:value={el.level} min={0} max={4} />
<Num label="Scale" bind:value={el.scale} min={1} max={4} suffix="×" />
