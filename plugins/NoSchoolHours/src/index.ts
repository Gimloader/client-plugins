api.rewriter.addParseHook("App", code => {
    if(!code.includes("Discovery Is Closed During School Hours")) return code;

    const beforeVarIndex = code.indexOf("()&&") + 4;
    const afterVarIndex = code.indexOf("?", beforeVarIndex);
    const start = code.slice(0, beforeVarIndex);
    const end = code.substring(afterVarIndex);
    return start + "false" + end;
});
