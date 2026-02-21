<script lang="ts">
    import type { SplitsData } from "../types";
    import { oneWayOutSplits } from "../constants";
    import SplitsToggles from "./SplitsToggles.svelte";
    import FullGame from "./FullGame.svelte";

    let { data = $bindable() }: { data: SplitsData } = $props();
</script>

<FullGame splits={oneWayOutSplits} bind:data category="OneWayOut" />
<hr>
<SplitsToggles bind:data />
