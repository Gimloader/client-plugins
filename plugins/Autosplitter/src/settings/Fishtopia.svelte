<script lang="ts">
    import type { SplitsData } from "../types";
    import { fishtopiaSplits } from "../constants";
    import FishtopiaToggles from "./SplitsToggles.svelte";
    import FullGame from "./FullGame.svelte";

    let { data = $bindable() }: { data: SplitsData } = $props();
</script>

<FullGame splits={fishtopiaSplits} bind:data category="fishtopia" />
<hr>
<FishtopiaToggles bind:data />
