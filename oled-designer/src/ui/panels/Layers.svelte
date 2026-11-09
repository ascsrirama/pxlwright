<!-- Left sidebar: the layer list (top of the list is drawn in front). -->
<script lang="ts">
  import { editor } from '../../state/editor.svelte';
  import { ELEMENT_LABELS } from '../../core/elements';
  import Icon from '../common/Icon.svelte';

  // top of the list = drawn last = in front
  const rows = $derived([...editor.elements].reverse());
</script>

<section class="panel">
  <h3>Layers <span class="count">{editor.elements.length}</span></h3>
  {#if rows.length === 0}
    <p class="hint">Nothing here yet. Add something from the palette.</p>
  {/if}
  <ul>
    {#each rows as el (el.id)}
      <li class:sel={el.id === editor.selectedId} class:off={!el.visible}>
        <button type="button" class="row-main" onclick={() => editor.select(el.id)} title={ELEMENT_LABELS[el.type]}>
          <span class="kind">{ELEMENT_LABELS[el.type]}</span>
          <span class="nm">{el.name}</span>
        </button>
        <span class="row-actions">
          <button type="button" class="ib" title={el.visible ? 'Hide' : 'Show'} onclick={() => { el.visible = !el.visible; editor.commit(); }}>
            <Icon name={el.visible ? 'eye' : 'eye-off'} size={14} />
          </button>
          <button type="button" class="ib" title={el.locked ? 'Unlock' : 'Lock'} onclick={() => { el.locked = !el.locked; editor.commit(); }}>
            <Icon name={el.locked ? 'lock' : 'unlock'} size={14} />
          </button>
        </span>
      </li>
    {/each}
  </ul>
</section>

<style>
  .count { background: var(--panel-2); color: var(--dim); border-radius: 10px; padding: 0 7px; font-size: 11px; letter-spacing: 0; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  li { display: flex; align-items: center; border-radius: 6px; border: 1px solid transparent; }
  li:hover { background: var(--panel-2); }
  li.sel { background: var(--accent-soft); border-color: var(--accent-line); }
  li.off .row-main { opacity: 0.45; }
  .row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; text-align: left; background: none; border: 0; padding: 5px 8px; cursor: pointer; }
  .row-main .kind { font-size: 10.5px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.06em; }
  .row-main .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row-actions { display: flex; padding-right: 2px; }
</style>
