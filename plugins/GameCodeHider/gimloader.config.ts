import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "GameCodeHider",
    description: "Allows hiding/revealing your game code everywhere",
    author: "retrozy",
    version: "0.1.2",
    changelog: [
        "Fixed code not being hidden when building in Creative editor"
    ]
});
