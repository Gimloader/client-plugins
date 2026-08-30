import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CustomUI",
    description: "Allows you to customize various things about the Gimkit UI",
    version: "0.3.5",
    hasSettings: true,
    changelog: ["Fixed theme displaying on 1d answer screen even when disabled"]
});
