export function splitArrayByLength(array: number[], length: number) {
    const chunks: number[][] = [];

    for(let i = 0; i < array.length; i += length) {
        chunks.push(array.slice(i, i + length));
    }

    return chunks;
}

export function splicer<T>(array: T[], obj: T) {
    array.push(obj);
    return () => {
        const index = array.indexOf(obj);
        if(index !== -1) array.splice(index, 1);
    };
}
