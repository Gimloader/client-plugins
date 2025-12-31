function getRange(code: string, match: string) {
    const snippets: string[] = [];
    let currentWord = "";
    for(const letter of match) {
        if(letter === "#") {
            snippets.push(currentWord);
            currentWord = "";
        } else if(letter === "@") {
            snippets.push(currentWord);
            currentWord = "";
            snippets.push("@");
        } else {
            currentWord += letter;
        }
    }
    snippets.push(currentWord);

    const matchIndex = snippets.indexOf("@");

    const snippetsBeforeMatch = snippets.slice(0, matchIndex);

    let startIndex = 0;
    for(const snippet of snippetsBeforeMatch) {
        startIndex = code.indexOf(snippet, startIndex) + snippet.length;
    }

    const snippetAfterMatch = snippets[matchIndex + 1];

    const endIndex = code.indexOf(snippetAfterMatch, startIndex);

    return {
        startIndex,
        endIndex
    };
}

export function getSection(code: string, match: string) {
    const { startIndex, endIndex } = getRange(code, match);

    return code.slice(startIndex, endIndex);
}

export function replaceSection(code: string, match: string, replacement: string) {
    const { startIndex, endIndex } = getRange(code, match);

    const start = code.slice(0, startIndex);
    const end = code.slice(endIndex);
    return start + replacement + end;
}

export function insert(code: string, match: string, string: string) {
    const { endIndex } = getRange(code, match);

    const start = code.slice(0, endIndex);
    const end = code.slice(endIndex);
    return start + string + end;
}
