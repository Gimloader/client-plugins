export function isTargetCanvas(e: Event) {
    if(!(e.target instanceof HTMLElement)) return false;
    if(e.target.nodeName === "CANVAS") return true;

    // Allow moving despite the big overlay when spectating
    return e.target.matches(".sc-fyfgSA, .sc-gdmatS, .sc-djcAKz, .sc-emMPjM");
}

export const getCamera = () => api.stores.phaser.scene.cameras.cameras[0];
