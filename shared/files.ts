export function downloadFile(contents: string, name: string, type: string) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();

    URL.revokeObjectURL(url);
}

export function downloadJsonFile(obj: any, name: string) {
    downloadFile(JSON.stringify(obj, null, 4), name, "application/json");
}

export function readFile(accept: string) {
    return new Promise<File>((res, rej) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;

        input.addEventListener("change", async () => {
            const file = input.files?.[0];
            if(!file) return rej("No file selected");
            res(file);
        });

        input.click();
    });
}

export async function readJsonFile() {
    const file = await readFile(".json");
    const text = await file.text();
    return JSON.parse(text);
}
