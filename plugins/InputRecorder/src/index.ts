import type { IRecording } from "../types";
import Recorder from "./recorder";

const { uploadJson } = api.lib("JSONTransfer");

let recorder: Recorder;

function startRecording() {
    if(!recorder) return;

    if(recorder.playing) {
        api.UI.notification.open({ message: "Cannot record while playing", type: "error" });
        return;
    }

    if(recorder.recording) {
        api.hotkeys.releaseAll();
    }

    recorder.toggleRecording();
}

function playBackRecording() {
    if(!recorder) return;

    if(recorder.recording) {
        api.UI.notification.open({ message: "Cannot playback while recording", type: "error" });
        return;
    }

    if(recorder.playing) {
        recorder.stopPlayback();
        api.UI.notification.open({ message: "Playback canceled" });
    } else {
        uploadJson<IRecording>()
            .then(([data]) => {
                api.UI.notification.open({ message: "Starting Playback" });
                recorder.playback(data);
            })
            .catch(() => {});
    }
}

api.hotkeys.addConfigurableHotkey({
    category: "Input Recorder",
    title: "Start Recording",
    default: {
        key: "KeyR",
        alt: true
    }
}, startRecording);

api.hotkeys.addConfigurableHotkey({
    category: "Input Recorder",
    title: "Play Back Recording",
    default: {
        key: "KeyB",
        alt: true
    }
}, playBackRecording);

api.net.onLoad(() => {
    recorder = new Recorder(api.stores.phaser.scene.worldManager.physics);

    api.commands.addCommand({ text: () => `InputRecorder: ${recorder.recording ? "Stop Recording" : "Start Recording"}` }, startRecording);
    api.commands.addCommand({ text: "InputRecorder: Play Back Recording" }, playBackRecording);
});

export function getRecorder() {
    return recorder;
}
