import { Collider } from "@dimforge/rapier2d-compat";
import type RAPIER from "@dimforge/rapier2d-compat";

api.net.onLoad(async () => {
    const rapier = await new Promise<typeof RAPIER>((res) => {
        api.rewriter.exposeVar("App", {
            check: "this.device.parts.destroySpecificPart",
            find: /var (\S+)=Object.freeze\({__proto__:null/,
            callback: res
        });
    });

    const physics = api.stores.phaser.scene.worldManager.physics;
    const world = physics.world as unknown as RAPIER.World;
    const colliders = new Map<string, Collider>();

    api.onStop(
        api.net.room.state.characters.onAdd((char: any) => {
            if(char.id === api.stores.network.authId) return;

            const collider = world.createCollider(rapier.ColliderDesc.cuboid(0.32, 0.32));
            colliders.set(char.id, collider);

            api.onStop(
                char.onRemove(() => {
                    world.removeCollider(collider, true);
                    colliders.delete(char.id);
                })
            );
        })
    );

    api.patcher.before(physics, "physicsStep", () => {
        for(const [id, collider] of colliders) {
            const body = api.stores.phaser.scene.characterManager.characters.get(id)?.body;
            if(!body) return;

            collider.setTranslation({
                x: body.x / 100,
                y: body.y / 100
            });
        }
    });

    api.onStop(() => {
        for(const [_, collider] of colliders) {
            world.removeCollider(collider, true);
        }
    });
});
