import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.ts",
    name: "CustomUI",
    description: "Allows you to customize various things about the Gimkit UI",
    version: "0.4.0",
    hasSettings: true,
    changelog: ["Added option to edit custom themes"]
});
