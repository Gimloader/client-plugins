import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "FixCrashes",
    description: "Attempts to prevent natural game crashes",
    author: "retrozy",
    version: "0.1.2",
    reloadRequired: "ingame",
    changelog: ["Fixed an issue by a recent Gimloader update"]
});
