<script lang="ts">
    import { fmtMs, parseTime } from "../util";

    interface Props {
        splits: string[];
        data: Record<string, any>;
        category: string;
    }

    let { splits, data = $bindable(), category }: Props = $props();

    function resetSplits() {
        let conf = confirm("Are you sure you want to reset all splits for this category?");
        if(!conf) return;

        data.pb[category] = [];
        data.bestSplits[category] = [];
    }
</script>

<div>
    Attempts:
    <input type="number" bind:value={data.attempts[category]} />
</div>
<table>
    <thead>
        <tr>
            <th style="min-width: 80px">Split</th>
            <th style="min-width: 80px">Best Split</th>
            <th style="min-width: 80px">Split during PB</th>
        </tr>
    </thead>
    <tbody>
        {#each splits as split, i}
            <tr>
                <td>{split}</td>
                <td>
                    <input
                        value={data.bestSplits[category]?.[i] ? fmtMs(data.bestSplits[category][i]) : ""}
                        onchange={(e) => {
                            if(e.currentTarget.value === "") {
                                data.bestSplits[category][i] = undefined;
                                return;
                            }

                            let ms = parseTime(e.currentTarget.value);
                            if(!data.bestSplits[category]) data.bestSplits[category] = [];
                            data.bestSplits[category][i] = ms;
                        }}
                    />
                </td>
                <td>
                    <input
                        value={data.pb[category]?.[i] ? fmtMs(data.pb[category][i]) : ""}
                        onchange={(e) => {
                            let ms = parseTime(e.currentTarget.value);
                            if(!data.pb[category]) data.pb[category] = [];
                            data.pb[category][i] = ms;
                        }}
                    />
                </td>
            </tr>
        {/each}
    </tbody>
</table>
<button onclick={resetSplits}>
    Reset splits
</button>
