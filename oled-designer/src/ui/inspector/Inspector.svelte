<!--
  Right sidebar: properties of the selected element.
  Fields every element has (name, position, colour) are here; the rest is in props/<Type>Props.svelte.
-->
<script lang="ts">
  import { editor } from '../../state/editor.svelte';
  import { ELEMENT_LABELS } from '../../core/elements';
  import Num from '../common/Num.svelte';
  import ColorField from '../common/ColorField.svelte';
  import Icon from '../common/Icon.svelte';
  import EmptyState from './EmptyState.svelte';
  import TextProps from './props/TextProps.svelte';
  import RectProps from './props/RectProps.svelte';
  import CircleProps from './props/CircleProps.svelte';
  import ImageProps from './props/ImageProps.svelte';
  import IconProps from './props/IconProps.svelte';
  import ProgressProps from './props/ProgressProps.svelte';
  import BatteryProps from './props/BatteryProps.svelte';
  import SignalProps from './props/SignalProps.svelte';
  import ToggleProps from './props/ToggleProps.svelte';
  import MenuProps from './props/MenuProps.svelte';
  import GaugeProps from './props/GaugeProps.svelte';

  const el = $derived(editor.selected);
</script>

<!-- any field change inside is saved as one undo step -->
<aside class="inspector" onchange={() => editor.commit()}>
  {#if !el}
    <EmptyState />
  {:else}
    <div class="head">
      <span class="badge">{ELEMENT_LABELS[el.type]}</span>
      <span class="grow"></span>
      <button type="button" class="ib" title="Bring forward" onclick={() => editor.reorder(el.id, 1)}><Icon name="up" /></button>
      <button type="button" class="ib" title="Send backward" onclick={() => editor.reorder(el.id, -1)}><Icon name="down" /></button>
      <button type="button" class="ib" title="Duplicate (Ctrl+D)" onclick={() => editor.duplicate(el.id)}><Icon name="copy" /></button>
      <button type="button" class="ib danger" title="Delete" onclick={() => editor.remove(el.id)}><Icon name="trash" /></button>
    </div>

    <label class="field">
      <span>Name</span>
      <input type="text" bind:value={el.name} maxlength="40" />
    </label>

    {#if el.type !== 'line'}
      <div class="grid2">
        <Num label="X" bind:value={el.x} />
        <Num label="Y" bind:value={el.y} />
      </div>
    {:else}
      <div class="grid2">
        <Num label="X1" bind:value={el.x} />
        <Num label="Y1" bind:value={el.y} />
        <Num label="X2" bind:value={el.x2} />
        <Num label="Y2" bind:value={el.y2} />
      </div>
    {/if}

    <ColorField label="Colour" bind:value={el.color} />

    {#if el.type === 'text'}<TextProps {el} />
    {:else if el.type === 'rect'}<RectProps {el} />
    {:else if el.type === 'circle'}<CircleProps {el} />
    {:else if el.type === 'image'}<ImageProps {el} />
    {:else if el.type === 'icon'}<IconProps {el} />
    {:else if el.type === 'progress'}<ProgressProps {el} />
    {:else if el.type === 'battery'}<BatteryProps {el} />
    {:else if el.type === 'signal'}<SignalProps {el} />
    {:else if el.type === 'toggle'}<ToggleProps {el} />
    {:else if el.type === 'menu'}<MenuProps {el} />
    {:else if el.type === 'gauge'}<GaugeProps {el} />
    {/if}
  {/if}
</aside>

<style>
  .inspector { padding: 14px; }
  .head { display: flex; align-items: center; gap: 2px; }
  .badge { background: var(--accent-soft); color: var(--accent); border-radius: 999px; padding: 2px 10px; font-weight: 600; font-size: 12px; }
</style>
