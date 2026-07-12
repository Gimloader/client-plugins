import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    name: "FixStickersFocus",
    description: "Fixes the in-game stickers button keeping focus after being closed",
    input: "src/index.ts",
    reloadRequired: "ingame",
    version: "0.1.0"
});
