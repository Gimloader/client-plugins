import VisualCoordinates from "./lines/visualCoordinates";
import Settings from "./Settings";
// @ts-ignore
import styles from './styles.scss';
import Velocity from "./lines/velocity";
import PhysicsCoordinates from "./lines/physicsCoordinates";
import FPS from "./lines/fps";

api.UI.addStyles(styles);

export class InfoLines {
    lines = [
        new VisualCoordinates(),
        new Velocity(),
        new PhysicsCoordinates(),
        new FPS()
    ]
    element: HTMLElement;
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

        for(let line of this.lines) {
            let lineElement = document.createElement("div");
            lineElement.classList.add("line");
            this.element.appendChild(lineElement);

            line.subscribe(value => {
                lineElement.innerText = value;
            })
        }

        document.body.appendChild(this.element);
    }

    destroy() {
        for(let line of this.lines) {
            line.disable();
        }

        this.element?.remove();
    }
}

let infoLines = new InfoLines();
api.onStop(() => infoLines.destroy());
api.openSettingsMenu(() => {
    api.UI.showModal(api.React.createElement(Settings, { infoLines }), {
        title: "InfoLines settings",
        id: "infoLinesSettings",
        buttons: [{ text: "Close", "style": "close" }]
    });
});