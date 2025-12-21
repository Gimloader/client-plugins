export default function minifiedNavigator(code: string, start?: string[] | string, end?: string[] | string) {
    if(typeof start === "string") start = [start];
    if(typeof end === "string") end = [end];

    let startIndex = 0;
    if(start) {
        for(const snippet of start) {
            startIndex = code.indexOf(snippet, startIndex) + snippet.length;
        }
    }

    let endIndex = startIndex;
    if(end) {
        for(const snippet in end) {
            endIndex = code.indexOf(end[snippet], endIndex);
            if(Number(snippet) < end.length - 1) endIndex += end[snippet].length;
        }
    } else {
        endIndex = code.length - 1;
    }

    const startCode = code.slice(0, startIndex);
    const endCode = code.substring(endIndex);

    return {
        startIndex,
        endIndex,
        inBetween: code.slice(startIndex, endIndex),
        insertAfterStart(string: string) {
            return startCode + string + this.inBetween + endCode;
        },
        insertBeforeEnd(string: string) {
            return startCode + this.inBetween + string + endCode;
        },
        replaceEntireBetween(string: string) {
            return startCode + string + endCode;
        },
        replaceBetween(...args: Parameters<typeof String.prototype.replace>) {
            const changedMiddle = this.inBetween.replace(...args);
            return this.replaceEntireBetween(changedMiddle);
        },
        deleteBetween() {
            return startCode + endCode;
        }
    };
}
