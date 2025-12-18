import { singleConfig } from "@gimloader/build";

export default singleConfig({
    input: "src/index.ts",
    name: "NoSchoolHours",
    description: "Bypasses the discovery page school hours",
    author: "retrozy",
    downloadUrl: "https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/NoSchoolHours.js",
    webpage: "https://gimloader.github.io/plugins/noschoolhours",
    version: "0.1.0",
    reloadRequired: "notingame"
});
