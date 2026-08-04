import type { IFrameInfo } from "../types";

export function generatePhysicsInput(frame: IFrameInfo, lastFrame?: IFrameInfo) {
    const jump = frame.up && !lastFrame?.up;

    /* The angle is determined like so: 0 for right, 180 for left etc.
    If two opposing keys are pressed, it is null. Otherwise it will be in between, so 45 for down + right
    If three or more keys are pressed up and left take precedence over their opposite one.*/
    let angle: number | null = null;

    // none pressed
    if(!frame.right && !frame.left && !frame.up) angle = null;
    // one pressed
    else if(frame.right && !frame.left && !frame.up) angle = 0;
    else if(!frame.right && frame.left && !frame.up) angle = 180;
    else if(!frame.right && !frame.left && frame.up) angle = 270;
    // two pressed
    else if(frame.right && !frame.left && frame.up) angle = 315;
    else if(frame.right && frame.left && !frame.up) angle = null;
    else if(!frame.right && frame.left && frame.up) angle = 225;
    // all pressed
    else if(frame.right && frame.left && frame.up) angle = 225;

    return { angle, jump, _jumpKeyPressed: frame.up };
}

export const getTickKeys = (input: Gimloader.Stores.TickInput) => ({
    left: input.angle === 180 || input.angle === 225,
    right: input.angle === 0 || input.angle === 315,
    up: input.jump
});

export function save(frames: IFrameInfo[]) {
    const saveList: IFrameInfo[] = [];
    for(const frame of frames) {
        const { left, right, up } = frame;
        saveList.push({ left, right, up });
    }

    // remove unset frames at the end
    for(let i = saveList.length - 1; i >= 0; i--) {
        if(saveList[i].right || saveList[i].left || saveList[i].up) break;
        saveList.pop();
    }

    api.storage.setValue("frames", saveList);

    return saveList;
}
