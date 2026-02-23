import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "PerformantGims",
    description: "Replaces configurable gims with images of them. Looks like crap, runs really fast.",
    author: "TheLazySquid",
    hasSettings: true,
    reloadRequired: "ingame",
    version: "0.5.2",
    changelog: ["Updated webpage url"]
});
