api.rewriter.addParseHook("index", (code) => code.replace("this.useClientIdSaving=!0", "this.useClientIdSaving = false"));
