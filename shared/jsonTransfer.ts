export function downloadJson(json: any, name: string) {
    const string = JSON.stringify(json, null, 2);
    const blob = new Blob([string], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

export async function uploadJson<T>(assert: (input: unknown) => T) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    return await new Promise<[T, string]>((res, rej) => {
        input.addEventListener("change", () => {
            const file = input.files?.[0];
            if(!file) {
                rej("No file uploaded");
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                const result = e.target?.result;
                if(typeof result !== "string") {
                    rej("Error reading file");
                    return;
                }

                try {
                    res([assert(JSON.parse(result)), file.name]);
                } catch {
                    rej("Invalid file");
                }
            };

            reader.onerror = (e) => {
                rej(e.target?.error?.message);
            };

            reader.readAsText(file);
        });
    });
}
