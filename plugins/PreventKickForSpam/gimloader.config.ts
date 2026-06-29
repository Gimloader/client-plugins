import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "PreventKickForSpam",
    description: "Attempts to prevent automatic 1D kicks from answering questions too quickly",
    version: "0.1.0",
    gamemodes: ["1d"]
});
