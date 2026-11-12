import atlas from "../assets/gim_atlas.txt";
import json from "../assets/gim_json.txt";

const loadPromises = new Map<string, Promise<void>>();

export async function loadSkin(name: string) {
    const existing = loadPromises.get(name);
    if(existing) return existing;

    const promise = doLoadSkin(name);
    loadPromises.set(name, promise);

    return promise;
}

async function doLoadSkin(name: string) {
    const textureUrl = await getTextureUrl(name);

    const jsonContent = json.replace("[[SKIN ID]]", `cc-${name}`);
    const jsonBlob = new Blob([jsonContent], { type: "application/json" });
    const jsonUrl = URL.createObjectURL(jsonBlob);

    const atlasLines = atlas.split("\n");
    atlasLines[0] = textureUrl.split("/").pop()!;
    const atlasBlob = new Blob([atlasLines.join("\n")], { type: "text/plain" });
    const atlasUrl = URL.createObjectURL(atlasBlob);

    const load: any = api.stores.phaser.scene.load;
    const jsonRes = load.spineJson(`cc-${name}-data`, jsonUrl);
    const atlasRes = load.spineAtlas(`cc-${name}-atlas`, atlasUrl);

    const jsonPromise = new Promise<void>((res) => jsonRes.on("complete", res));
    const atlasPromise = new Promise<void>((res) => atlasRes.on("complete", res));

    jsonRes.start();
    atlasRes.start();

    await Promise.all([atlasPromise, jsonPromise]);
    URL.revokeObjectURL(atlasUrl);
    URL.revokeObjectURL(textureUrl);
    URL.revokeObjectURL(jsonUrl);
}

const textureUrls = new Map<string, Promise<string>>();

export function getCustomSkinTexture(name: string) {
    const existing = textureUrls.get(name);
    if(existing) return existing;

    const promise = getTextureUrl(name);
    textureUrls.set(name, promise);

    return promise;
}

async function getTextureUrl(name: string) {
    const file = await api.storage.idbGet(name);
    const url = URL.createObjectURL(file);

    return url;
}

export function unloadSkinTextures() {
    for(const url of textureUrls.values()) {
        url.then((u) => URL.revokeObjectURL(u));
    }

    textureUrls.clear();
}
