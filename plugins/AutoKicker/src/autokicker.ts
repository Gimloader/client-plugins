import { invisRegex } from "./consts";
import type { IBlacklistedName } from "./types";

export default class AutoKicker {
    lastLeaderboard: any[] | null = null;

    kickDuplicateNames = false;
    kickSkinless = false;
    kickIdle = false;
    kickBlank = false;
    blacklist: IBlacklistedName[] = [];
    idleDelay = 20000;
    UIVisible = true;

    idleKickTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
    kicked = new Set<string>();

    constructor() {
        this.loadSettings();
    }

    get myId() {
        return api.stores.phaser.mainCharacter.id;
    }

    loadSettings() {
        const settings = api.storage.getValue("Settings", {});

        this.kickDuplicateNames = settings.kickDuplicateNames ?? false;
        this.kickSkinless = settings.kickSkinless ?? false;
        this.blacklist = settings.blacklist ?? [];
        this.kickBlank = settings.kickBlank ?? false;
        this.kickIdle = settings.kickIdle ?? false;
        this.idleDelay = settings.idleDelay ?? 20000;
    }

    saveSettings() {
        api.storage.setValue("Settings", {
            kickDuplicateNames: this.kickDuplicateNames,
            kickSkinless: this.kickSkinless,
            blacklist: this.blacklist,
            kickBlank: this.kickBlank,
            kickIdle: this.kickIdle,
            idleDelay: this.idleDelay
        });
    }

    start() {
        if(api.net.type === "Colyseus") {
            const chars = api.net.room.serializer.state.characters;

            api.onStop(chars.onAdd((e: any) => {
                if(!e || e.id === this.myId) return;
                if(this.kickIdle) {
                    // set and idle kick timeout
                    const timeout = setTimeout(() => {
                        this.colyseusKick(e.id, "being idle");
                    }, this.idleDelay);

                    this.idleKickTimeouts.set(e.id, timeout);

                    const onMove = () => {
                        clearTimeout(timeout);
                        this.idleKickTimeouts.delete(e.id);
                    };

                    // wait a bit to get the initial packets out of the way
                    e.listen("completedInitialPlacement", (val: boolean) => {
                        if(!val) return;

                        setTimeout(() => {
                            this.watchPlayerForMove(e, onMove);
                        }, 2000);
                    });
                }

                this.scanPlayersColyseus();
            }));
        } else {
            api.net.on("UPDATED_PLAYER_LEADERBOARD", this.boundBlueboatMsg);
            api.onStop(() => api.net.off("UPDATED_PLAYER_LEADERBOARD", this.boundBlueboatMsg));
        }
    }

    boundBlueboatMsg = this.onBlueboatMsg.bind(this);
    onBlueboatMsg(e: any) {
        this.lastLeaderboard = e.items;

        this.scanPlayersBlueboat();
    }

    watchPlayerForMove(player: any, callback: () => void) {
        const startX = player.x;
        const startY = player.y;
        let unsubX: () => void, unsubY: () => void;

        const onMove = () => {
            if(unsubX) unsubX();
            if(unsubY) unsubY();

            callback();
        };

        unsubX = player.listen("x", (x: number) => {
            if(x !== startX) onMove();
        });

        unsubY = player.listen("y", (y: number) => {
            if(y !== startY) onMove();
        });
    }

    setKickIdle(value: boolean) {
        this.kickIdle = value;
        if(api.net.type !== "Colyseus") return;

        if(value) {
            for(const [id, char] of api.net.room.serializer.state.characters.entries()) {
                if(id === this.myId) continue;
                if(this.idleKickTimeouts.has(id)) continue;

                const timeout = setTimeout(() => {
                    this.colyseusKick(id, "being idle");
                }, this.idleDelay);

                this.idleKickTimeouts.set(id, timeout);

                const onMove = () => {
                    clearTimeout(timeout);
                    this.idleKickTimeouts.delete(id);
                };

                this.watchPlayerForMove(char, onMove);
            }
        } else {
            for(const [id, timeout] of this.idleKickTimeouts.entries()) {
                clearTimeout(timeout);
                this.idleKickTimeouts.delete(id);
            }
        }
    }

    scanPlayers() {
        if(api.net.type === "Colyseus") this.scanPlayersColyseus();
        else this.scanPlayersBlueboat();
    }

    scanPlayersBlueboat() {
        if(!this.lastLeaderboard) return;

        const nameCount = new Map<string, number>();

        // tally name counts
        if(this.kickDuplicateNames) {
            for(const item of this.lastLeaderboard) {
                const name = this.trimName(item.name);
                if(!nameCount.has(name)) nameCount.set(name, 0);
                nameCount.set(name, nameCount.get(name)! + 1);
            }
        }

        for(const item of this.lastLeaderboard) {
            if(nameCount.get(this.trimName(item.name))! >= 3) {
                this.blueboatKick(item.id, "duplicate name");
                continue;
            }

            if(this.checkIfNameBlacklisted(item.name)) {
                this.blueboatKick(item.id, "blacklisted name");
            }

            if(this.kickBlank && this.checkIfNameBlank(item.name)) {
                this.blueboatKick(item.id, "blank name");
            }
        }
    }

    scanPlayersColyseus() {
        const characters = api.net.room.state.characters;
        const nameCount = new Map<string, number>();

        // tally name counts
        if(this.kickDuplicateNames) {
            for(const [_, player] of characters.entries()) {
                const name = this.trimName(player.name);
                if(!nameCount.has(name)) nameCount.set(name, 0);
                nameCount.set(name, nameCount.get(name)! + 1);
            }
        }

        for(const [id, player] of characters.entries()) {
            if(id === this.myId) continue;

            const name = this.trimName(player.name);

            // check name duplication
            if(this.kickDuplicateNames) {
                if(nameCount.get(name)! >= 3) {
                    this.colyseusKick(id, "duplicate name");
                }
            }

            // check filters
            if(this.checkIfNameBlacklisted(name)) {
                this.colyseusKick(id, "blacklisted name");
            }

            if(this.kickBlank && this.checkIfNameBlank(name)) {
                this.colyseusKick(id, "blank name");
            }

            // check the player's skin
            if(this.kickSkinless) {
                const skin = JSON.parse(player.appearance.skin).id;
                if(skin.startsWith("character_default_")) {
                    this.colyseusKick(id, "not having a skin");
                }
            }
        }
    }

    trimName(name: string) {
        return name.toLowerCase().replace(/\d+$/, "").trim();
    }

    checkIfNameBlacklisted(name: string) {
        // remove any trailing numbers
        name = this.trimName(name);

        for(const filter of this.blacklist) {
            if(filter.exact) {
                if(name === filter.name.toLowerCase()) {
                    return true;
                }
            } else {
                console.log(name, filter.name.toLowerCase(), name.includes(filter.name.toLowerCase()));
                if(name.includes(filter.name.toLowerCase())) {
                    return true;
                }
            }
        }

        return false;
    }

    checkIfNameBlank(name: string) {
        const newName = name.replaceAll(invisRegex, "");
        if(newName.length === 0) return true;
        return false;
    }

    colyseusKick(id: string, reason: string) {
        if(this.kicked.has(id)) return;
        this.kicked.add(id);

        const char = api.net.room.state.characters.get(id)!;

        api.net.send("KICK_PLAYER", { characterId: id });
        api.UI.notification.open({ message: `Kicked ${char.name} for ${reason}` });
    }

    blueboatKick(id: string, reason: string) {
        if(this.kicked.has(id)) return;
        this.kicked.add(id);

        const playername = this.lastLeaderboard?.find((e) => e.id === id)?.name;

        api.net.send("KICK_PLAYER", id);
        api.UI.notification.open({ message: `Kicked ${playername ?? "player"} for ${reason}` });
    }
}
