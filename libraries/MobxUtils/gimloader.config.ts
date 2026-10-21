import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "MobxUtils",
    description: "Some simple utilities for react injection with MobX",
    version: "0.3.5",
    reloadRequired: true,
    changelog: ["Deprecated in favor of native Gimloader apis"],
    deprecated: "MobxUtils has been superceded by native Gimloader apis",
    isLibrary: true
});
