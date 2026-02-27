import BaseLine from "../baseLine";

export default class PlantDrops extends BaseLine {
    name = "Plant Drops";
    enabledDefault = false;
    gamemode = "onewayout";
    settings: Gimloader.PluginSetting[] = [
        {
            id: "plantDropsMode",
            title: "Plant Drops Mode",
            type: "dropdown",
            options: [
                {
                    label: "Only show fraction",
                    value: "fraction"
                },
                {
                    label: "Only show percentage",
                    value: "percentage"
                },
                {
                    label: "Show fraction and percentage",
                    value: "both"
                }
            ],
            default: "both",
            onChange: () => {
                if(!this.enabled) return;
                this.updateDrops();
            }
        }
    ];

    private knockouts = 0;
    private drops = 0;

    init() {
        this.setBlankDropRate();

        this.net.on("KNOCKOUT", (e) => {
            if(e.name !== "Evil Plant") return;
            this.knockouts++;

            let dropped = false;
            // wait 100ms to count the drop
            const addDrop = (e: any) => {
                if(e.devices.addedDevices.devices.length === 0) return;

                dropped = true;
                this.drops++;
                this.updateDrops();
                api.net.off("WORLD_CHANGES", addDrop);
            };

            setTimeout(() => {
                api.net.off("WORLD_CHANGES", addDrop);
                if(!dropped) this.updateDrops();
            }, 100);

            this.net.on("WORLD_CHANGES", addDrop);
        });
    }

    private getText(fraction: string, percent: string | null) {
        if(percent) percent += "%";
        const mode = api.settings.plantDropsMode;
        if(mode === "fraction") return fraction;
        if(mode === "percentage") return percent ?? "N/A";
        if(percent) return `${fraction} (${percent})`;
        return fraction;
    }

    private setBlankDropRate() {
        this.setDropRate("0/0", null);
    }

    private setDropRate(fraction: string, percent: string | null) {
        this.update(`drop rate: ${this.getText(fraction, percent)}`);
    }

    private updateDrops() {
        if(this.knockouts === 0) {
            this.setBlankDropRate();
        } else {
            const percent = this.drops / this.knockouts * 100;
            let percentStr = percent.toFixed(2);
            if(percent === 0) percentStr = "0";
            this.setDropRate(`${this.drops}/${this.knockouts}`, percentStr);
        }
    }
}
