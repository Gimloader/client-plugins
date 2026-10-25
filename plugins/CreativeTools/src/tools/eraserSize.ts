api.rewriter.addParseHook("App", (code) => {
    const index = code.indexOf("Eraser Size:");
    if(index === -1) return code;

    return code.replace("Array.from([,,,]", "Array.from([,,,,,,]");
});
