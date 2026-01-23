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

const round = (num: number, decimals: number) => Math.round(num * 10 * decimals) / (10 * decimals);

export default class Sync {
    private readonly Comms = api.lib("Communication");
    private readonly comms = new this.Comms<number | string>("Desynchronize");
    private publicPosition: Vector | null = null;
    private readonly playerPositions = new Map<string, Vector>();
    private readonly body = api.stores.phaser.mainCharacter.physics.getBody();
    private sending = false;
    private readonly unsub: () => void;

    private get isGrounded(): boolean {
        return (this.body.character as any).controller.computedGrounded();
    }

    private async sendOffset() {
        if(this.sending || !this.publicPosition) return;

        this.sending = true;

        while(true) {
            const translation = this.body.rigidBody.translation();

            const xOffset = round(translation.x - this.publicPosition.x, 1);
            const yOffset = round(this.publicPosition.y - translation.y, 1);

            if(!xOffset && !yOffset) break;

            this.publicPosition.x += xOffset;
            this.publicPosition.y -= yOffset;

            if(Math.abs(xOffset) > 204.7 || Math.abs(yOffset) > 204.7) {
                await this.updatePublicPosition();
            } else {
                const encodedOffset = encodeOffset(xOffset, yOffset);
                await this.comms.send(this.isGrounded ? -encodedOffset : encodedOffset);
            }
        }

        this.sending = false;
    }

    constructor() {
        this.unsub = api.patcher.after(api.stores.phaser.scene.worldManager.physics, "physicsStep", () => {
            if(!this.Comms.enabled) return;

            this.sendOffset();
        });

        if(this.Comms.enabled) {
            this.updatePublicPosition();
        }

        this.comms.onEnabledChanged(() => {
            if(!this.Comms.enabled) return;
            this.updatePublicPosition();
        });

        this.comms.onMessage((message, char) => {
            const character = api.stores.phaser.scene.characterManager.characters.get(char.id);
            if(!character) return;

            const setGrounded = character.movement.setNonMainCharacterTargetGrounded;

            if(typeof message === "string") {
                const isGrounded = message.includes("_");
                const [x, y] = message.split(isGrounded ? "_" : " ");

                setGrounded(isGrounded);

                if(!this.playerPositions.has(char.id)) this.updatePublicPosition();
                this.playerPositions.set(char.id, { x: +x / 100, y: +y / 100 });
            } else {
                setGrounded(message < 0);
                message = Math.abs(message);

                const { x, y } = decodeOffset(message);
                const player = this.playerPositions.get(char.id);
                if(!player) return;
                player.x += x;
                player.y -= y;
            }

            const player = this.playerPositions.get(char.id);
            if(!player) return;

            const { movement } = character;
            movement.setTargetX(player.x * 100);
            movement.setTargetY(player.y * 100);
        });
    }

    private async updatePublicPosition() {
        const translation = this.body.rigidBody.translation();
        const publicX = round(translation.x, 2);
        const publicY = round(translation.y, 2);
        this.publicPosition = { x: publicX, y: publicY };

        const separator = this.isGrounded ? "_" : " ";
        await this.comms.send(this.publicPosition.x * 100 + separator + this.publicPosition.y * 100);
    }

    stop() {
        this.unsub();
        this.comms.destroy();
    }
}
