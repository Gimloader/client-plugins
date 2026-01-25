import { getSection, insert } from "$shared/rewritingUtils";

api.rewriter.addParseHook("Container", (code) => {
    if(!code.includes("There are no kits in this folder.")) return code;

    const name = getSection(code, ".createdAt?`Created ${#(@.");
    const playCountString = `${name}.playCount`;
    const playCountInfo = `, \${${playCountString} ? \`played \${${playCountString}} \${${playCountString} === 1 ? "time" : "times"}\` : "never played"}`;
    const isEnabledString = `GL.plugins.isEnabled("KitTimesPlayed")`;
    return insert(code, ".createdAt).fromNow()}@`", `\${${isEnabledString} ? \`${playCountInfo}\` : ""}`);
});

api.onStop(() => {
    if(location.pathname !== "/kits" && location.pathname !== "/gamemode") return;
    const kits = document.getElementsByClassName("ant-card ant-card-bordered ant-card-hoverable");

    for(const kit of kits) {
        const div = kit.children[0]?.children[0]?.children[0]?.children[1]?.children[1];
        if(!div?.innerHTML.includes(",")) return;
        div.innerHTML = div.innerHTML.split(",")[0];
    }
});
