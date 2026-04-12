import { officialScriptConfig } from "$shared/config";

export default officialScriptConfig({
    input: "src/index.tsx",
    name: "GameCodeHider",
    description: "Allows hiding/revealing your game code everywhere",
    author: "retrozy",
    version: "0.1.1",
    changelog: [
        "Fixed QR code not being properly hidden"
    ]
});
