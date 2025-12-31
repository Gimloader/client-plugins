const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.id = "tasOverlay";
const ctx = canvas.getContext("2d")!;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

api.onStop(() => canvas.remove());

const propHitboxes: Phaser.GameObjects.Shape[] = [];

export function initOverlay() {
    document.body.appendChild(canvas);

    const scene = api.stores.phaser.scene;
    const props = scene.worldManager.devices.allDevices.filter((d) => d.deviceOption?.id === "prop");

    // create prop hitboxes
    for(const prop of props) {
        for(const collider of prop.colliders.list) {
            let { x, y, h, w, angle, r1, r2 } = collider.options;
            if(!x || !y) continue;

            x += prop.x;
            y += prop.y;

            if(r1 && r2) {
                if(r1 < 0 || r2 < 0) continue;
                const ellipse = scene.add.ellipse(x, y, r1 * 2, r2 * 2, 0xff0000)
                    .setDepth(99999999999)
                    .setStrokeStyle(3, 0xff0000);
                ellipse.angle = angle;
                ellipse.isFilled = false;
                ellipse.isStroked = true;

                propHitboxes.push(ellipse);
            } else if(w && h) {
                const rect = scene.add.rectangle(x, y, w, h, 0xff0000)
                    .setDepth(99999999999)
                    .setStrokeStyle(3, 0xff0000);
                rect.angle = angle;
                rect.isFilled = false;
                rect.isStroked = true;

                propHitboxes.push(rect);
            }
        }
    }

    api.onStop(() => {
        for(const prop of propHitboxes) {
            prop.destroy();
        }
    });

    setInterval(render, 1000 / 15);
}

let renderHitbox = true;

export function hideHitbox() {
    for(const prop of propHitboxes) {
        prop.visible = false;
    }

    renderHitbox = false;
}

export function showHitbox() {
    for(const prop of propHitboxes) {
        prop.visible = true;
    }

    renderHitbox = true;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const physics = api.stores.phaser.mainCharacter.physics;
    const collider = physics.getBody().collider;
    let { halfHeight, radius } = collider.shape as any;
    const { x: cX, y: cY } = api.stores.phaser.scene.cameras.cameras[0].midPoint;
    let { x, y } = physics.getBody().rigidBody.translation();
    const { x: vX, y: vY } = physics.getBody().rigidBody.linvel();

    // display the current coordinates and velocity of the player
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.font = "20px Arial";
    ctx.textAlign = "right";

    const posText = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
    const velText = `vx: ${vX.toFixed(2)}, vy: ${vY.toFixed(2)}`;

    ctx.strokeText(posText, canvas.width - 10, canvas.height - 20);
    ctx.fillText(posText, canvas.width - 10, canvas.height - 20);
    ctx.strokeText(velText, canvas.width - 10, canvas.height - 40);
    ctx.fillText(velText, canvas.width - 10, canvas.height - 40);

    if(!renderHitbox) return;

    // convert the position to screen space
    x = (x * 100) - cX + window.innerWidth / 2;
    y = (y * 100) - cY + window.innerHeight / 2;

    radius *= 100;
    halfHeight *= 100;

    ctx.strokeStyle = "#2fd45b";
    ctx.lineWidth = 3;

    // render the capsule shaped collider
    ctx.beginPath();
    ctx.arc(x, y - halfHeight, radius, Math.PI, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + radius, y + halfHeight);
    ctx.lineTo(x + radius, y - halfHeight);
    ctx.moveTo(x - radius, y + halfHeight);
    ctx.lineTo(x - radius, y - halfHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y + halfHeight, radius, 0, Math.PI);
    ctx.stroke();
}
