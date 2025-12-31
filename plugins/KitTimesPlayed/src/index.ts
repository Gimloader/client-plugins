import { getSection, insert } from "$shared/rewritingUtils";
import config from "../gimloader.config";

api.rewriter.addParseHook("Container", (code) => {
    if(!code.includes("There are no kits in this folder.")) return code;

    const name = getSection(code, ".createdAt?`Created ${#(@.");
    const playCountString = `${name}.playCount`;
    const playCountInfo = `, \${${playCountString} ? \`played \${${playCountString}} \${${playCountString} === 1 ? "time" : "times"}\` : "never played"}`;
    const isEnabledString = `GL.plugins.isEnabled("${config.name}")`;
    return insert(code, ".createdAt).fromNow()}@`", `\${${isEnabledString} ? \`${playCountInfo}\` : ""}`);
});
