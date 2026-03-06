import { getSection, insert, replaceSection } from "$shared/rewritingUtils";

const getHiddenState = api.rewriter.createShared("GetHiddenState", () => api.storage.getValue("hidden"));
const setHiddenState = api.rewriter.createShared("SetHiddenState", (hidden: boolean) => {
    api.storage.setValue("hidden", hidden);
});

const react = "window.GL.React";
const codeHiddenText = '"######"';
const declareHiddenState = `const [codeHidden, setCodeHidden] = ${react}.useState(${getHiddenState}?.() ?? false)`;
const eyeToggle = (style?: string, updateCode = `setCodeHidden(prev => { ${setHiddenState}?.(!prev); return !prev });`) =>
    `${react}.createElement("i", { onClick: (e) => { e.stopPropagation(); ${updateCode} }, className: codeHidden ? "far fa-eye-slash" : "far fa-eye"${style ? `, style: ${style}` : ""} })`;

// The pre-game host code in both 1d and 2d
api.rewriter.addParseHook("SixteenByNineScaler", code => {
    code = insert(code, '.success("Game link copied")};@return', `${declareHiddenState};`);

    const childMatch = 'Copy Join Link"}#onClick#children:@}';
    const child = getSection(code, childMatch);
    code = replaceSection(code, childMatch, `[codeHidden ? ${codeHiddenText} : ${child}, ${eyeToggle()}]`);

    // Hide the QR code if hidden
    code = insert(code, ",{styles:{body:{padding:20}},content:@#", "codeHidden ? [] : ");

    return code;
});

// The 2d in-game code
api.rewriter.addParseHook("App", code => {
    if(!code.includes("=Phaser.Utils.Objects.GetValue;class ")) return code;

    code = insert(code, ",{matchmaker:#;@#", `${declareHiddenState};`);

    // Enlarged code. Not worth it to put the button here, there's a ton of styling conflicts
    const gameCodeMatch = "Game Code (Click to enlarge)#text:@,";
    const gameCode = getSection(code, gameCodeMatch);
    code = replaceSection(code, gameCodeMatch, `codeHidden ? ${codeHiddenText} : ${gameCode}`);

    // Small code
    code = replaceSection(code, "Game Code (Click to enlarge)#onClick#children:@}", `[codeHidden ? ${codeHiddenText} : ${gameCode}, ${eyeToggle('{ "margin-left": "5px" }')}]`);

    return code;
});

// The 1d in-game code
api.rewriter.addParseHook("index", code => {
    if(!code.includes("Collect All 6 Infinity Stones")) return code;
    code = insert(code, "showLargeCode:!1@#", `, codeHidden: ${getHiddenState}?.() ?? false`);

    let eye = eyeToggle('{ "margin-left": "5px" }', `this.setState(({ codeHidden }) => { ${setHiddenState}?.(!codeHidden); return { codeHidden: !codeHidden } })`);
    eye = eye.replace("className: codeHidden", "className: this.state.codeHidden");

    code = code.replace("children:this.props.gameValues.gameCode", `children:[this.state.codeHidden ? ${codeHiddenText} : this.props.gameValues.gameCode, ${eye}]`);
    return code;
});
