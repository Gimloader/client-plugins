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
        this.updateDrops();

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

        api.net.room.state.session.listen("phase", () => {
            this.knockouts = 0;
            this.drops = 0;
            this.updateDrops();
        }, false);
    }

    private updateDrops() {
        let fraction = "";
        let percent: string | null = null;

        if(this.knockouts === 0) {
            fraction = "0/0";
            percent = null;
        } else {
            const percentNum = this.drops / this.knockouts * 100;
            percent = percentNum.toFixed(2);
            if(percentNum === 0) percent = "0";
            fraction = `${this.drops}/${this.knockouts}`;
        }

        const text = (() => {
            if(percent) percent += "%";
            const mode = api.settings.plantDropsMode;
            if(mode === "fraction") return fraction;
            if(mode === "percentage") return percent ?? "N/A";
            if(percent) return `${fraction} (${percent})`;
            return fraction;
        })();

        this.update(`drop rate: ${text}`);
    }
}
