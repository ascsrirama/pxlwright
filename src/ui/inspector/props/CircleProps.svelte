<script lang="ts">
  import type { CircleEl } from '../../../core/types';
  import Num from '../../common/Num.svelte';

  let { el }: { el: CircleEl } = $props();
</script>

<Num label="Radius" bind:value={el.r} min={1} max={256} />
<label class="check"><input type="checkbox" bind:checked={el.fill} /><span>Filled</span></label>
