import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "NoSchoolHours",
    description: "Bypasses the creative discovery page school hours",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/NoSchoolHours.js",
    webpage: "https://gimloader.github.io/plugins/NoSchoolHours",
    version: "0.1.1",
    reloadRequired: "notingame",
    changelog: ["Updated webpage url"]
});
