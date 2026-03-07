import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "AutoKicker",
    description: "Automatically kicks players from your lobby with a customizable set of rules",
    author: "TheLazySquid",
    version: "0.3.0",
    changelog: ["Added a setting to disable notifying"]
});
