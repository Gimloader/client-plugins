import { singleConfig, type SingleConfig } from "@gimloader/build";

type DistributiveOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
type ConfigInfo = DistributiveOmit<SingleConfig, "downloadUrl" | "webpage">;
type Category = "libraries" | "plugins";

const baseDownloadUrl = "https://raw.githubusercontent.com/Gimloader/client-plugins/main/build";
const baseWebpageUrl = "https://gimloader.github.io";

function mapDependency(category: Category) {
    return (dependency: string) => {
        if(dependency.includes("|")) return dependency;
        return `${dependency} | ${baseDownloadUrl}/${category}/${dependency}.js`;
    };
}

export function officialScriptConfig(info: ConfigInfo) {
    const { needsPlugins, needsLibs, optionalLibs, ...options } = info;

    const category: Category = info.isLibrary ? "libraries" : "plugins";
    const downloadUrl = `${baseDownloadUrl}/${category}/${info.name}.js`;
    const webpage = `${baseWebpageUrl}/${category}/${info.name}`;

    const formattedNeedsPlugins = needsPlugins?.map(mapDependency("plugins"));
    const formattedNeedsLibs = needsLibs?.map(mapDependency("libraries"));
    const formattedOptionalLibs = optionalLibs?.map(mapDependency("libraries"));

    return singleConfig({
        ...options,
        downloadUrl,
        webpage,
        needsPlugins: formattedNeedsPlugins,
        needsLibs: formattedNeedsLibs,
        optionalLibs: formattedOptionalLibs
    });
}
