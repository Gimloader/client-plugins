const settings = api.settings.create([
    {
        type: "number",
        id: "swingSpeed",
        title: "Swing Speed",
        description: "1 = normal speed",
        default: 2,
        min: 0
    },
    {
        type: "number",
        id: "swingAmount",
        title: "Swing Amount",
        description: "1 = normal speed",
        default: 120,
        min: 0
    }
]);

// Not exhaustive, just the interesting ones
interface FlagConsts {
    BaseScale: number;
    FlagDockedShift: number;
    FlagDropShift: number;
    FlagOriginX: number;
    FlagOriginY: number;
    FlagSwingAmplitude: number;
    FlagSwingInterval: number;
    InteractvityRadius: number;
    PlatformOriginX: number;
    PlatformOriginY: number;
}
let flagConsts: FlagConsts | null = null;

function applySettings() {
    if(!flagConsts) return;
    flagConsts.FlagSwingInterval = 1 / settings.swingSpeed;
    flagConsts.FlagSwingAmplitude = settings.swingAmount / 10;
}

settings.listen("swingSpeed", applySettings);
settings.listen("swingAmount", applySettings);

api.rewriter.exposeVar("FlagDevice", {
    find: /(\w)={FlagOriginX/,
    callback: (consts) => {
        const defaults = Object.assign({}, consts);
        flagConsts = consts;
        applySettings();

        api.onStop(() => {
            if(!flagConsts) return;
            Object.assign(flagConsts, defaults);
        });
    }
});
