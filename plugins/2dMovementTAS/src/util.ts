import type { IFrame, TAS } from "./types";
import { mount, unmount } from "svelte";
import AnglePicker from "./ui/AnglePicker.svelte";
import { createAssert } from "typia";

export const blankFrame: IFrame = {
    angle: 0,
    moving: true,
    answer: false,
    purchase: false
};

// inclusive
export function between(number: number, bound1: number, bound2: number) {
    return number >= Math.min(bound1, bound2) && number <= Math.max(bound1, bound2);
}

export function showAnglePicker(initial: number) {
    return new Promise<number>((res) => {
        const div = document.createElement("div");
        const anglePicker = mount(AnglePicker, {
            target: div,
            props: { angle: initial }
        });

        api.UI.showModal(div, {
            title: "Pick an angle",
            closeOnBackgroundClick: false,
            onClosed() {
                unmount(anglePicker);
            },
            buttons: [{
                text: "Cancel",
                style: "close",
                onClick() {
                    res(initial);
                }
            }, {
                text: "Ok",
                style: "primary",
                onClick() {
                    res(anglePicker.getAngle());
                }
            }]
        });
    });
}

export const defaultState: Record<string, any> = {
    gravity: 0,
    velocity: {
        x: 0,
        y: 0
    },
    movement: {
        direction: "none",
        xVelocity: 0,
        accelerationTicks: 0
    },
    jump: {
        isJumping: false,
        jumpsLeft: 1,
        jumpCounter: 0,
        jumpTicks: 0,
        xVelocityAtJumpStart: 0
    },
    forces: [],
    grounded: false,
    groundedTicks: 0,
    lastGroundedAngle: 0
};

// just saves a bit of memory
export function getFrameState(state: any) {
    return Object.assign({}, defaultState, state);
}

export function makeFrameState() {
    const state = api.stores.phaser.mainCharacter.physics.state as Record<string, any>;
    const returnObj: any = {};

    for(const key in state) {
        if(JSON.stringify(defaultState[key]) !== JSON.stringify(state[key])) {
            returnObj[key] = state[key];
        }
    }

    return returnObj;
}

export function updateDeviceState(device: Gimloader.Stores.Device, key: string, value: any) {
    const deviceId = device.id;

    const states = api.stores.world.devices.states;
    if(!states.has(deviceId)) {
        states.set(deviceId, { deviceId, properties: new Map() });
    }

    states.get(deviceId)?.properties.set(key, value);
    device.onStateUpdateFromServer(key, value);
}

export const tasAssert = createAssert<TAS>();
