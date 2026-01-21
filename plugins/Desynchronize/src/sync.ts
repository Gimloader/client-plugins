import type { Vector } from "@dimforge/rapier2d-compat";

const offset = 2048;
const scale = 10;

function encodeOffset(x: number, y: number) {
    const xInt = Math.round(x * scale) + offset;
    const yInt = Math.round(y * scale) + offset;

    const cX = Math.max(0, Math.min(4095, xInt));
    const cY = Math.max(0, Math.min(4095, yInt));

    return (cX << 12) | cY;
}

function decodeOffset(uint24: number) {
    const xInt = (uint24 >> 12) & 0xFFF;
    const yInt = uint24 & 0xFFF;

    const x = (xInt - offset) / scale;
    const y = (yInt - offset) / scale;

    return { x, y };
}

const round = (num: number) => Math.round(num * 10) / 10;

export default class Sync {
    private readonly Comms = api.lib("Communication");
    private readonly comms = new this.Comms<number | string>("Desynchronize");
    private publicPosition: Vector | null = null;
    private readonly playerPositions = new Map<string, Vector>();
    private readonly rb = api.stores.phaser.mainCharacter.physics.getBody().rigidBody;
    private sending = false;
    private readonly unsub: () => void;

    constructor() {
        this.unsub = api.patcher.after(api.stores.phaser.scene.worldManager.physics, "physicsStep", () => {
            if(!this.Comms.enabled || this.sending || !this.publicPosition) return;
            const translation = this.rb.translation();

            const xOffset = round(translation.x - this.publicPosition.x);
            const yOffset = round(this.publicPosition.y - translation.y);
            if(!xOffset && !yOffset) return;

            this.sending = true;
            this.publicPosition.x += xOffset;
            this.publicPosition.y -= yOffset;

            // send the full coords if moved over max
            if(Math.abs(xOffset) > 204.7 || Math.abs(yOffset) > 204.7) {
                this.updatePublicPosition()
                    .then(() => this.sending = false);
            } else {
                this.comms.send(encodeOffset(xOffset, yOffset))
                    .then(() => this.sending = false);
            }
        });

        if(this.Comms.enabled) {
            this.updatePublicPosition();
        }

        this.comms.onEnabledChanged(() => {
            if(!this.Comms.enabled) return;
            this.updatePublicPosition();
        });

        this.comms.onMessage((message, char) => {
            if(typeof message === "string") {
                const [x, y] = message.split(" ");
                if(!this.playerPositions.has(char.id)) this.updatePublicPosition();
                this.playerPositions.set(char.id, { x: +x / 100, y: +y / 100 });
            } else {
                const { x, y } = decodeOffset(message);
                const player = this.playerPositions.get(char.id);
                if(!player) return;
                player.x += x;
                player.y -= y;
            }

            const player = this.playerPositions.get(char.id);
            if(!player) return;
            const movement = api.stores.phaser.scene.characterManager.characters.get(char.id)?.movement;
            if(!movement) return;
            movement.setTargetX(player.x * 100);
            movement.setTargetY(player.y * 100);
        });
    }

    private async updatePublicPosition() {
        const translation = this.rb.translation();
        const publicX = round(translation.x);
        const publicY = round(translation.y);
        this.publicPosition = { x: publicX, y: publicY };
        await this.comms.send(`${this.publicPosition.x * 100} ${this.publicPosition.y * 100}`);
    }

    stop() {
        this.unsub();
        this.comms.destroy();
    }
}
