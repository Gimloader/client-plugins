import VisualCoordinates from "./lines/visualCoordinates";
import Settings from "./Settings";
import FPS from "./lines/fps";
import PhysicsCoordinates from "./lines/physicsCoordinates";
import Velocity from "./lines/velocity";
import Ping from "./lines/ping";
import styles from "./styles.scss";

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
    position: string = api.storage.getValue("position", "top right");

    constructor() {
        api.net.onLoad(() => {
            this.create();
        });
    }

    create() {
        this.element = document.createElement("div");
        this.element.id = "infoLines";
        this.element.className = this.position;

        for(const line of this.lines) {
            const lineElement = document.createElement("div");
            lineElement.classList.add("line");
            this.element.appendChild(lineElement);

            line.subscribe(value => {
                lineElement.innerText = value;
            });
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
api.openSettingsMenu(() => {
    api.UI.showModal(api.React.createElement(Settings, { infoLines }), {
        title: "InfoLines settings",
        id: "infoLinesSettings",
        buttons: [{ text: "Close", "style": "close" }]
    });
});
