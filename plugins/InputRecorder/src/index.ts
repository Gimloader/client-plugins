import Recorder from "./recorder";

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
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async () => {
            api.hotkeys.releaseAll();
            const file = input.files?.[0];
            if(!file) return;

            const json = await file.text();
            const data = JSON.parse(json);
            api.UI.notification.open({ message: "Starting Playback" });

            recorder.playback(data);
        };

        input.click();
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
