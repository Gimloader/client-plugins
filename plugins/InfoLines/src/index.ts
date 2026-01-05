import styles from "./styles.scss";

import VisualCoordinates from "./lines/visualCoordinates";
import FPS from "./lines/fps";
import PhysicsCoordinates from "./lines/physicsCoordinates";
import Velocity from "./lines/velocity";
import Ping from "./lines/ping";

api.UI.addStyles(styles);

export class InfoLines {
    lines = [
        new VisualCoordinates(),
        new Velocity(),
        new PhysicsCoordinates(),
        new FPS(),
        new Ping()
    ];
    element?: HTMLElement;

    constructor() {
        const settings: Gimloader.PluginSettingsDescription = [
            {
                type: "dropdown",
                id: "position",
                title: "Position",
                options: [
                    { label: "Top Left", value: "top left" },
                    { label: "Top Right", value: "top right" },
                    { label: "Bottom Left", value: "bottom left" },
                    { label: "Bottom Right", value: "bottom right" }
                ],
                default: "top right"
            }
        ];

        for(const line of this.lines) {
            settings.push({
                type: "toggle",
                id: line.name,
                title: line.name,
                default: line.enabledDefault
            });
            if(line.settings) settings.push(...line.settings);
        }

        api.settings.create(settings);

        api.net.onLoad(() => {
            this.create();
        });
    }

    create() {
        this.element = document.createElement("div");
        this.element.id = "infoLines";
        api.settings.listen("position", (value: string) => this.element!.className = value, true);

        for(const line of this.lines) {
            const lineElement = document.createElement("div");
            lineElement.classList.add("line");
            this.element.appendChild(lineElement);

            line.onUpdate(value => lineElement.innerText = value);
            line.onStop(() => {
                // The line still exists, but it's blank lol
                lineElement.innerText = "";
            });

            api.settings.listen(line.name, value => value ? line.enable() : line.disable(), true);
        }

        document.body.appendChild(this.element);
    }

    destroy() {
        for(const line of this.lines) {
            line.disable();
        }

        this.element?.remove();
    }
}

const infoLines = new InfoLines();
api.onStop(() => infoLines.destroy());
