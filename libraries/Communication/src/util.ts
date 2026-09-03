export function splicer<T>(array: T[], obj: T) {
    array.push(obj);
    return () => {
        const index = array.indexOf(obj);
        if(index !== -1) array.splice(index, 1);
    };
}
