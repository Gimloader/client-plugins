import GL from 'gimloader';
import { IBlacklistedName } from "./types";
import outOfCharacter from "out-of-character";

export default class AutoKicker {
    myId: string;
    lastLeaderboard: any[];

    kickDuplicateNames = false;
    kickSkinless = false;
    kickIdle = false;
    kickBlank = false;
    blacklist: IBlacklistedName[] = [];
    idleDelay = 20000;

    el: HTMLDivElement;
    UIVisible = true;

    idleKickTimeouts: Map<string, any> = new Map();
    unOnAdd: () => void;
    kicked = new Set<string>();

    constructor() {
        this.loadSettings();

        GL.onStop(() => this.dispose());
    }

    loadSettings() {
        let settings = GL.storage.getValue("Settings", {});

        this.kickDuplicateNames = settings.kickDuplicateNames ?? false;
        this.kickSkinless = settings.kickSkinless ?? false;
        this.blacklist = settings.blacklist ?? [];
        this.kickBlank = settings.kickBlank ?? false;
        this.kickIdle = settings.kickIdle ?? false;
        this.idleDelay = settings.idleDelay ?? 20000;
    }

    saveSettings() {
        GL.storage.setValue("Settings", {
            kickDuplicateNames: this.kickDuplicateNames,
            kickSkinless: this.kickSkinless,
            blacklist: this.blacklist,
            kickBlank: this.kickBlank,
            kickIdle: this.kickIdle,
            idleDelay: this.idleDelay
        });
    }

    start() {                
        if(GL.net.type === "Colyseus") {
            this.myId = GL.stores.phaser.mainCharacter.id;
            let chars = GL.net.room.serializer.state.characters;

            this.unOnAdd = chars.onAdd((e: any) => {
                if(!e || e.id === this.myId) return;
                if(this.kickIdle) {
                    // set and idle kick timeout
                    let timeout = setTimeout(() => {
                        this.colyseusKick(e.id, 'being idle');
                    }, this.idleDelay);

                    this.idleKickTimeouts.set(e.id, timeout);

                    const onMove = () => {
                        clearTimeout(timeout);
                        this.idleKickTimeouts.delete(e.id);
                    }

                    // wait a bit to get the initial packets out of the way
                    e.listen("completedInitialPlacement", (val: boolean) => {
                        if(!val) return;

                        setTimeout(() => {
                            this.watchPlayerForMove(e, onMove);
                        }, 2000);
                    })
                }

                this.scanPlayersColyseus();
            })
        } else {
            GL.net.on("UPDATED_PLAYER_LEADERBOARD", this.boundBlueboatMsg);
        }
    }

    boundBlueboatMsg = this.onBlueboatMsg.bind(this);
    onBlueboatMsg(e: any) {
        this.lastLeaderboard = e.items;

        this.scanPlayersBlueboat();
    }

    watchPlayerForMove(player: any, callback: () => void) {
        let startX = player.x;
        let startY = player.y;
        let unsubX: () => void, unsubY: () => void;

        const onMove = () => {
            if(unsubX) unsubX();
            if(unsubY) unsubY();

            callback();
        }

        unsubX = player.listen("x", (x: number) => {
            if(x !== startX) onMove();
        })

        unsubY = player.listen("y", (y: number) => {
            if(y !== startY) onMove();
        })
    }

    setKickIdle(value: boolean) {
        this.kickIdle = value;
        if(GL.net.type !== "Colyseus") return;

        if(value) {
            for(let [id, char] of GL.net.room.serializer.state.characters.entries()) {
                if(id === this.myId) continue;
                if(this.idleKickTimeouts.has(id)) continue;

                let timeout = setTimeout(() => {
                    this.colyseusKick(id, 'being idle');
                }, this.idleDelay);

                this.idleKickTimeouts.set(id, timeout);

                const onMove = () => {
                    clearTimeout(timeout);
                    this.idleKickTimeouts.delete(id);
                }

                this.watchPlayerForMove(char, onMove);
            }
        } else {
            for(let [id, timeout] of this.idleKickTimeouts.entries()) {
                clearTimeout(timeout);
                this.idleKickTimeouts.delete(id);
            }
        }
    }

    scanPlayers() {
        if(GL.net.type === "Colyseus") this.scanPlayersColyseus();
        else this.scanPlayersBlueboat();
    }

    scanPlayersBlueboat() {
        if(!this.lastLeaderboard) return;

        let nameCount = new Map<string, number>();

        // tally name counts
        if(this.kickDuplicateNames) {
            for(let item of this.lastLeaderboard) {
                let name = this.trimName(item.name);
                if(!nameCount.has(name)) nameCount.set(name, 0);
                nameCount.set(name, nameCount.get(name)! + 1);
            }
        }

        for(let item of this.lastLeaderboard) {
            if(nameCount.get(this.trimName(item.name))! >= 3) {
                this.blueboatKick(item.id, 'duplicate name');
                continue;
            }

            if(this.checkIfNameBlacklisted(item.name)) {
                this.blueboatKick(item.id, 'blacklisted name');
            }

            if(this.kickBlank && this.checkIfNameBlank(item.name)) {
                this.blueboatKick(item.id, 'blank name');
            }
        }
    }

    scanPlayersColyseus() {
        let characters = GL.net.room.state.characters;
        let nameCount = new Map<string, number>();

        // tally name counts
        if(this.kickDuplicateNames) {
            for(let [_, player] of characters.entries()) {
                let name = this.trimName(player.name);
                if(!nameCount.has(name)) nameCount.set(name, 0);
                nameCount.set(name, nameCount.get(name)! + 1);
            }
        }

        for(let [id, player] of characters.entries()) {
            if(id === this.myId) continue;

            let name = this.trimName(player.name);

            // check name duplication
            if(this.kickDuplicateNames) {
                if(nameCount.get(name)! >= 3) {
                    this.colyseusKick(id, 'duplicate name');
                }
            }

            // check filters
            if(this.checkIfNameBlacklisted(name)) {
                this.colyseusKick(id, 'blacklisted name');
            }
            
            if(this.kickBlank && this.checkIfNameBlank(name)) {
                this.colyseusKick(id, 'blank name');
            }

            // check the player's skin
            if(this.kickSkinless) {
                let skin = JSON.parse(player.appearance.skin).id;
                if(skin.startsWith("character_default_")) {
                    this.colyseusKick(id, 'not having a skin');
                }
            }
        }
    }

    trimName(name: string) {
        return name.toLowerCase().replace(/\d+$/, '').trim();
    }

    checkIfNameBlacklisted(name: string) {
        // remove any trailing numbers
        name = this.trimName(name);

        for(let filter of this.blacklist) {
            if(filter.exact) {
                if(name === filter.name.toLowerCase()) {
                    return true;
                }
            } else {
                console.log(name, filter.name.toLowerCase(), name.includes(filter.name.toLowerCase()))
                if(name.includes(filter.name.toLowerCase())) {
                    return true;
                }
            }
        }

        return false;
    }

    checkIfNameBlank(name: string) {
        let newName = outOfCharacter.replace(name).replaceAll(/\s/g, "");
        console.log("name", name.length, "new name", newName.length);
        if(newName.length === 0) return true;
        return false;
    }

    colyseusKick(id: string, reason: string) {
        if(this.kicked.has(id)) return;
        this.kicked.add(id);

        let char = GL.net.room.state.characters.get(id)!;
        
        GL.net.send("KICK_PLAYER", { characterId: id });
        GL.notification.open({ message: `Kicked ${char.name} for ${reason}` })
    }

    blueboatKick(id: string, reason: string) {
        if(this.kicked.has(id)) return;
        this.kicked.add(id);

        let playername = this.lastLeaderboard.find((e: any) => e.id === id)?.name;

        GL.net.send("KICK_PLAYER", id);
        GL.notification.open({ message: `Kicked ${playername} for ${reason}` })
    }

    dispose() {
        this.unOnAdd?.();
        GL.net.off("UPDATED_PLAYER_LEADERBOARD", this.boundBlueboatMsg);
    }
}