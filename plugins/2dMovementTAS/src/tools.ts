import { currentFrame } from "./stores";
import type { IFrame, IPreviousFrame } from "./types";
import { defaultState, downloadFile, getFrameState, makeFrameState, updateDeviceState, uploadFile } from "./util";

let active = false;

// Ignore any and all (pitiful) attempts from the server to get us to go to where we should be
GL.net.on("PHYSICS_STATE", (_, editFn) => {
    if(active) editFn(null);
});
(window as any).expectedPoses = [];

export default class TASTools {
    startPos: { x: number; y: number };

    nativeStep: (delta: number) => void;
    physicsManager: any;
    inputManager: any;
    prevFrameStates: IPreviousFrame[] = [];
    rb: any;
    movement: any;
    tagEnergyDisplay: any;

    energyPerQuestion = 5000;
    energyUsage = 60;
    energyTimeout = 0;
    purchaseTimeouts: [number, () => Function, boolean?][] = [];
    energyFrames: number[] = [];
    tagMaxEnergy = 10000;

    constructor(public frames: IFrame[], public setFrames: (frames: IFrame[]) => void, startPos?: { x: number; y: number }) {
        this.physicsManager = GL.stores.phaser.scene.worldManager.physics;
        this.nativeStep = this.physicsManager.physicsStep;

        active = true;

        const mcState = GL.net.room.state.characters.get(GL.stores.phaser.mainCharacter.id);
        mcState.$callbacks.movementSpeed = [];

        for(const slot of mcState.inventory.slots.values()) {
            slot.$callbacks = {};
        }

        mcState.inventory.slots.onAdd((item: any) => {
            setTimeout(() => {
                item.$callbacks = {};
            });
        });

        const mc = GL.stores.phaser.mainCharacter;
        this.stopPlayback();

        this.inputManager = GL.stores.phaser.scene.inputManager;
        this.rb = mc.physics.getBody().rigidBody;

        if(startPos) {
            this.startPos = startPos;
            this.rb.setTranslation(startPos, true);
        } else {
            this.startPos = this.rb.translation();
        }

        this.movement = mc.movement;
        this.movement.state = Object.assign({}, defaultState);

        const allDevices = GL.stores.phaser.scene.worldManager.devices.allDevices;
        this.tagEnergyDisplay = allDevices.find((d: any) => d.options?.text === '0/10,000 <item-image item="energy" />');

        GL.net.on("DEVICES_STATES_CHANGES", (packet: any) => {
            packet.changes.splice(0, packet.changes.length);
        });

        this.setEnergy(940);

        // periodically save
        setInterval(() => {
            this.save();
        }, 60000);

        window.addEventListener("unload", () => {
            this.save();
        });
    }

    setEnergy(amount: number) {
        if(this.tagEnergyDisplay) {
            updateDeviceState(
                this.tagEnergyDisplay,
                `PLAYER_${GL.stores.phaser.mainCharacter.id}_text`,
                `${amount}/${this.tagMaxEnergy} <item-image item="energy" />`
            );
        }

        const energySlot = GL.stores.me.inventory.slots.get("energy");
        if(energySlot) energySlot.amount = amount;
    }

    getEnergy(): number {
        return GL.stores.me.inventory.slots.get("energy")?.amount ?? 0;
    }

    goBackToFrame(number: number) {
        // apply all the undoDeviceChanges
        for(let i = currentFrame.value - 1; i >= number; i--) {
            const frame = this.prevFrameStates[i];
            if(!frame) continue;
            if(frame.undoDeviceChanges) frame.undoDeviceChanges();
        }

        const frame = this.prevFrameStates[number];
        if(!frame) return;

        currentFrame.set(number);

        this.rb.setTranslation(frame.position, true);
        GL.stores.phaser.mainCharacter.physics.state = getFrameState(frame.state);
        GL.stores.me.movementSpeed = frame.speed;
        this.setEnergy(frame.energy);
        this.energyPerQuestion = frame.epq;
        this.energyUsage = frame.energyUsage;
        this.energyTimeout = frame.energyTimeout;
        this.tagMaxEnergy = frame.maxEnergy;
        this.purchaseTimeouts = frame.purchaseTimeouts;
        this.energyFrames = frame.energyFrames;
    }

    backFrame() {
        if(currentFrame.value <= 0) return;
        this.goBackToFrame(currentFrame.value - 1);
    }

    advanceFrame() {
        const frame = this.frames[currentFrame.value];
        const save = this.getState();
        this.prevFrameStates[currentFrame.value] = save;

        // save the state
        this.updateDevices(frame);
        this.updateCharacter(frame);

        this.inputManager.getPhysicsInput = () => this.getPhysicsInput();
        this.nativeStep(0);

        currentFrame.set(currentFrame.value + 1);
    }

    hideUI() {
        GL.stores.me.currentAction = "none";
        GL.stores.gui.none.screen = "home";
    }

    updateDevices(frame: IFrame) {
        for(const [countdown, purchase] of this.purchaseTimeouts) {
            if(countdown === 0) {
                const undo = purchase();
                this.prevFrameStates[currentFrame.value].undoDeviceChanges = undo;
            }
        }

        if(!frame.purchase) return;
        const devices = GL.stores.phaser.scene.worldManager.devices;
        const realPos = this.rb.translation();

        const device = devices.interactives.findClosestInteractiveDevice(devices.devicesInView, realPos.x * 100, realPos.y * 100);
        if(!device) return;

        // check whether we can afford it
        if(device.options?.requiredItemId === "energy" && device.options?.amountOfRequiredItem <= this.getEnergy()) {
            const vendingMachines = ["Energy Per Question Upgrade", "Speed Upgrade", "Efficiency Upgrade", "Endurance Upgrade", "Energy Generator"];
            const name = device.options.grantedItemName;
            const isBarrier = name.includes("Barrier");
            const isBlocker = name.includes("Teleportal") || name.includes("Tunnel") || name.includes("Access") || name.includes("Escape");
            if(isBarrier) {
                this.purchaseTimeouts.push([
                    Math.floor(device.options.interactionDuration * 12) - 1,
                    () => {
                        // activate the barrier
                        const channel = device.options.purchaseChannel.split(",")[0];
                        updateDeviceState(device, "GLOBAL_active", false);
                        const barrier = devices.devicesInView.find((d: any) => d.options?.showWhenReceivingFrom === channel);
                        if(barrier) updateDeviceState(barrier, "GLOBAL_visible", true);

                        this.setEnergy(this.getEnergy() - device.options.amountOfRequiredItem);
                        return () => {
                            updateDeviceState(device, "GLOBAL_active", true);
                            if(barrier) updateDeviceState(barrier, "GLOBAL_visible", false);
                        };
                    }
                ]);
            } else if(isBlocker) {
                this.purchaseTimeouts.push([
                    Math.floor(device.options.interactionDuration * 12) - 1,
                    () => {
                        const channels = device.options.purchaseChannel.split(",").map((str: string) => str.trim());
                        const disable = devices.devicesInView.filter((d: any) => channels.includes(d.options?.deactivateChannel));
                        disable.forEach((d: any) => updateDeviceState(d, "GLOBAL_active", false));

                        this.setEnergy(this.getEnergy() - device.options.amountOfRequiredItem);
                        return () => {
                            disable.forEach((d: any) => updateDeviceState(d, "GLOBAL_active", true));
                        };
                    }
                ]);
            } else if(vendingMachines.includes(name)) {
                this.purchaseTimeouts.push([
                    Math.floor(device.options.interactionDuration * 12) - 1,
                    () => {
                        updateDeviceState(device, "GLOBAL_active", false);
                        GL.notification.open({ message: `Purchased ${name}` });
                        switch (name) {
                            case "Energy Per Question Upgrade":
                                this.energyPerQuestion += 200;
                                break;
                            case "Speed Upgrade":
                                // kinda random but sure
                                GL.stores.me.movementSpeed += 46.5;
                                break;
                            case "Efficiency Upgrade":
                                this.energyUsage -= 7;
                                break;
                            case "Endurance Upgrade":
                                this.tagMaxEnergy += 5000;
                                break;
                            case "Energy Generator":
                                this.energyFrames.push(7 * 12);
                                break;
                        }

                        this.setEnergy(this.getEnergy() - device.options.amountOfRequiredItem);
                        return () => {
                            updateDeviceState(device, "GLOBAL_active", true);
                        };
                    },
                    true
                ]);
            } else {
                GL.notification.open({ message: "Unable to handle what you're trying to purchase. If this is unexpected, please report it." });
            }
        }
    }

    updateCharacter(frame: IFrame) {
        if(frame.answer) {
            if(this.tagEnergyDisplay) {
                this.setEnergy(Math.min(this.tagMaxEnergy, this.getEnergy() + this.energyPerQuestion));
            } else {
                this.setEnergy(this.getEnergy() + this.energyPerQuestion);
            }
        }

        this.energyTimeout--;

        if(frame.moving && this.energyTimeout <= 0) {
            if(this.energyTimeout === 0) this.setEnergy(Math.max(0, this.getEnergy() - this.energyUsage));

            const prevFrame = this.frames[currentFrame.value - 1];
            // if we're already moving, 0.5ms
            if(prevFrame?.moving) {
                this.energyTimeout = 6;
            } else {
                // 1/4 sec
                this.energyTimeout = 3;
            }
        }

        for(let i = 0; i < this.energyFrames.length; i++) {
            this.energyFrames[i]--;
            if(this.energyFrames[i] <= 0) {
                this.energyFrames[i] = 7 * 12;
                this.setEnergy(this.getEnergy() + 120);
            }
        }

        // Use teleporters
        const devices = GL.stores.phaser.scene.worldManager.devices;
        const teleporters = devices.devicesInView.filter((d: any) => d.deviceOption?.id === "teleporter");
        const body = GL.stores.phaser.mainCharacter.body;

        for(const teleporter of teleporters) {
            // 85 units on the top, 90 on the left/right, 100 on the bottom
            if(teleporter.x > body.x - 90 && teleporter.x < body.x + 90 && teleporter.y > body.y - 85 && teleporter.y < body.y + 100) {
                const target = teleporter.options.targetGroup;
                if(!target) continue;

                const targetTeleporter = devices.allDevices.find((d: any) => d.options?.group === target && d.deviceOption?.id === "teleporter");
                if(!targetTeleporter) continue;

                this.rb.setTranslation({ x: targetTeleporter.x / 100, y: targetTeleporter.y / 100 }, true);
                break;
            }
        }
    }

    updateUI() {
        const frame = this.frames[currentFrame.value];

        // open the device
        if(frame.answer) {
            GL.stores.phaser.scene.worldManager.devices.allDevices
                .find((d: any) => d.options?.openWhenReceivingOn === "answer questions")?.openDeviceUI();
        } else {
            // close the device
            GL.stores.me.currentAction = "none";
        }

        if(frame.purchase) {
            GL.stores.gui.none.screen = "inventory";
        } else {
            GL.stores.gui.none.screen = "home";
        }
    }

    getPhysicsInput(index = currentFrame.value) {
        const frame = this.frames[index];
        const prevFrame = this.frames[index - 1];

        let angle = frame.moving ? frame.angle : null;

        // don't move on pause frames
        for(const [countdown, _, stopMotion] of this.purchaseTimeouts) {
            if(countdown <= 1 && stopMotion) angle = null;
        }

        // dont move with no energy
        if(this.getEnergy() <= 0) angle = null;

        this.purchaseTimeouts = this.purchaseTimeouts.map(([c, p, s]) => [c - 1, p, s]);
        this.purchaseTimeouts = this.purchaseTimeouts.filter(([c]) => c >= 0);

        // we can't move while answering
        if(frame.answer || prevFrame?.answer) {
            angle = null;
        }

        return {
            angle,
            jump: false,
            _jumpKeyPressed: false
        };
    }

    getState(): IPreviousFrame {
        return {
            position: this.rb.translation(),
            state: makeFrameState(),
            energy: this.getEnergy(),
            speed: GL.stores.me.movementSpeed,
            epq: this.energyPerQuestion,
            energyUsage: this.energyUsage,
            energyTimeout: this.energyTimeout,
            maxEnergy: this.tagMaxEnergy,
            purchaseTimeouts: [...this.purchaseTimeouts],
            energyFrames: [...this.energyFrames]
        };
    }

    startPlayback() {
        this.physicsManager.physicsStep = (delta: number) => {
            // save the state
            const frame = this.frames[currentFrame.value];
            const save = this.getState();
            this.prevFrameStates[currentFrame.value] = save;

            // save the state
            this.updateDevices(frame);
            this.updateCharacter(frame);

            this.inputManager.getPhysicsInput = () => this.getPhysicsInput();
            this.updateUI();

            this.nativeStep(delta);

            currentFrame.set(currentFrame.value + 1);
        };
    }

    stopPlayback() {
        const mc = GL.stores.phaser.mainCharacter;
        this.physicsManager.physicsStep = (delta: number) => {
            mc.physics.postUpdate(delta);
        };
        this.hideUI();
    }

    save() {
        const val = {
            startPos: this.startPos,
            frames: this.frames
        };
        api.storage.setValue("save", val);
        return val;
    }

    download() {
        downloadFile(JSON.stringify(this.save()), "2D TAS.json");
    }

    load() {
        uploadFile()
            .then(file => {
                const data = JSON.parse(file);
                this.goBackToFrame(0);
                this.startPos = data.startPos;
                this.frames = data.frames;
                this.setFrames(data.frames);
            })
            .catch(() => {});
    }
}
