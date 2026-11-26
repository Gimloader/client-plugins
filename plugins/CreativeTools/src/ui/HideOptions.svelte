<script lang="ts">
    import type { HideState } from "../tools/hider";
    const Switch = api.Components.Switch;

    interface Props {
        hideState: HideState;
        onChange: (newState: HideState) => void;
    }

    let { hideState, onChange }: Props = $props();
    let itemState = $state(hideState);

    const onSwitchChange = () => {
        onChange($state.snapshot(itemState));
    };
</script>

<div>
    <Switch bind:checked={itemState.aboveHidden} onCheckedChange={onSwitchChange} />
    Hide Above Layer
</div>
<div>
    <Switch bind:checked={itemState.primaryHidden} onCheckedChange={onSwitchChange} />
    Hide Primary Layer
</div>
<div>
    <Switch bind:checked={itemState.belowHidden} onCheckedChange={onSwitchChange} />
    Hide Below Layer
</div>

<style>
    div {
        display: flex;
        align-items: center;
        gap: 10px;
    }
</style>
