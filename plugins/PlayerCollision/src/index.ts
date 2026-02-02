import type RAPIER from "@dimforge/rapier2d-compat";

api.settings.create([
    {
        id: "collidePlayers",
        type: "toggle",
        title: "Collide with other players",
        default: true
    },
    {
        id: "collideSentries",
        type: "toggle",
        title: "Collide with sentries",
        default: true
    }
]);

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
    const colliders = new Map<string, RAPIER.Collider>();
    const myId = api.stores.network.authId;

    function createCollider(id: string) {
        if(colliders.has(id)) return;
        const collider = world.createCollider(rapier.ColliderDesc.cuboid(0.32, 0.32));
        colliders.set(id, collider);
    }

    function removeCollider(id: string) {
        const collider = colliders.get(id);
        if(!collider) return;
        world.removeCollider(collider, true);
        colliders.delete(id);
    }

    api.settings.listen("collidePlayers", (enabled: boolean) => {
        for(const [id, char] of api.stores.phaser.scene.characterManager.characters) {
            if(char.type !== "player" || char.id === myId) continue;
            if(enabled) {
                createCollider(id);
            } else {
                removeCollider(id);
            }
        }
    });

    api.settings.listen("collideSentries", (enabled: boolean) => {
        for(const [id, { type }] of api.stores.phaser.scene.characterManager.characters) {
            if(type !== "sentry") continue;
            if(enabled) {
                createCollider(id);
            } else {
                removeCollider(id);
            }
        }
    });

    api.onStop(
        api.net.room.state.characters.onAdd((char: any) => {
            if(char.id === myId) return;
            if(char.type === "player" && !api.settings.collidePlayers) return;
            if(char.type === "sentry" && !api.settings.collideSentries) return;

            createCollider(char.id);

            api.onStop(
                char.onRemove(() => removeCollider(char.id))
            );
        })
    );

    if(!api.net.isHost) {
        const { gameOwnerId } = api.stores.session;
        api.net.room.state.session.listen("phase", (phase: string) => {
            if(
                api.net.room.state.characters.get(gameOwnerId).teamId === "__SPECTATORS_TEAM"
                && phase === "game"
            ) {
                removeCollider(gameOwnerId);
            } else {
                createCollider(gameOwnerId);
            }
        });
    }

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
        for(const [id] of colliders) {
            removeCollider(id);
        }
    });
});
