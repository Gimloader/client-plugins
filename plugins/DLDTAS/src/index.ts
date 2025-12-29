import styles from "./styles.scss";
import { createUI } from "./ui";

api.UI.addStyles(styles);

const startTasBtn = document.createElement("button");
startTasBtn.id = "startTasBtn";
startTasBtn.innerText = "Start TAS";

startTasBtn.addEventListener("click", () => createUI());
startTasBtn.addEventListener("click", () => startTasBtn.remove());

api.onStop(() => startTasBtn.remove());

api.net.onLoad(() => {
    document.body.appendChild(startTasBtn);
});

let moveSpeed = 310;

export function getMoveSpeed() {
    return moveSpeed;
}

export function setMoveSpeed(speed: number) {
    moveSpeed = speed;
}
