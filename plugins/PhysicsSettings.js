/**
 * @name PhysicsSettings
 * @description Allows you to configure various things about the physics in platformer modes (client-side only)
 * @version 0.1.3
 * @author TheLazySquid
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/PhysicsSettings.js
 * @webpage https://gimloader.github.io/plugins/physicssettings
 * @hasSettings true
 * @needsLib QuickSettings | https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/libraries/QuickSettings/build/QuickSettings.js
 */

const settings = api.lib("QuickSettings")("PhysicsSettings", [
    {
        type: "heading",
        text: "Physics Settings"
    },
    {
        type: "number",
        id: "jumps",
        title: "Number of Jumps (2 default)",
        min: 0,
        step: 1,
        default: 2
    },
    {
        type: "number",
        id: "jumpheight",
        title: "Jump Height (2 default)",
        default: 1.92
    },
    {
        type: "number",
        id: "speed",
        title: "Grounded Move Speed (310 default)",
        default: 310
    }
]);

// prevent the client from being snapped back
api.net.onLoad(() => {
    let allowNext = true;
    let unsub = api.net.room.state.session.listen("phase", () => {
        allowNext = true;
    });
    api.onStop(() => unsub());

    api.net.on("PHYSICS_STATE", (_, editFn) => {
        if(allowNext) {
            allowNext = false;
            return;
        }
        editFn(null);
    });
});

api.openSettingsMenu(settings.openSettingsMenu);

const updateMapOption = (key, value) => {
    let options = JSON.parse(api.stores.world.mapOptionsJSON);
    options[key] = value;
    api.stores.world.mapOptionsJSON = JSON.stringify(options);
}

const applyAll = () => {
    let options = JSON.parse(api.stores.world.mapOptionsJSON);
    options.maxJumps = settings.jumps;
    options.jumpHeight = settings.jumpheight;
    api.stores.world.mapOptionsJSON = JSON.stringify(options);
}

api.net.onLoad(() => {
    if(api.stores?.session?.mapStyle !== 'platformer') return;

    api.net.room.state.listen("mapSettings", () => {
        applyAll();
    });

    GL.plugin("DLDTAS")?.setMoveSpeed(settings.speed);
    api.stores.me.movementSpeed = settings.speed;

    settings.listen("jumps", (jumps) => updateMapOption("maxJumps", jumps));
    settings.listen("jumpheight", (height) => updateMapOption("jumpHeight", height));
    settings.listen("speed", (speed) => {
        GL.plugin("DLDTAS")?.setMoveSpeed(settings.speed);
        api.stores.me.movementSpeed = speed
    });
});
