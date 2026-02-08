import { getSection, insert } from "$shared/rewritingUtils";

const settings = api.settings.create([
    {
        id: "decimals",
        type: "slider",
        title: "Decimal Amount",
        description: "Amount of decimals to show",
        min: 1,
        max: 3,
        step: 1,
        default: 1
    }
]);

const msToTime = api.rewriter.createShared("MSToTime", (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const fraction = ((ms % 1000) / 1000).toFixed(settings.decimals).slice(2);

    return `${minutes}:${String(seconds).padStart(2, "0")}.${fraction}`;
});

api.rewriter.addParseHook("MapOptionsDevice", (code) => {
    const ms = getSection(code, "=Math.max(0,@/1e3");

    return insert(code, ".gameClockDuration=@#", `${msToTime}?.(${ms}) ?? `);
});

api.rewriter.addParseHook("EndOfGameWidgetDevice", (code) => {
    const ms = getSection(code, "=Math.max(0,@/1e3");

    return insert(code, "gameTimeLabel,gameTimeValue:@#", `${msToTime}?.(${ms}) ?? `);
});
