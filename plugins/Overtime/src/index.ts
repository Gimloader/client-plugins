const settings = api.settings.create([
    {
        type: "number",
        id: "length",
        title: "Overtime Length (in minutes)",
        min: 1,
        step: 1,
        default: 3
    },
    {
        type: "toggle",
        id: "suddenDeath",
        title: "Sudden Death",
        description: "Ends the game immediately upon a knockout during overtime.",
        default: true
    }
]);

interface ScoreboardTeam {
    id: string;
    name: string;
    players: string[];
    score: number;
}

type GetScoreboard = () => ScoreboardTeam[];

function maxRepeatedTwice(scores: number[]) {
    let max = -1;
    let repeated = false;

    for(const score of scores) {
        if(score > max) {
            max = score;
            repeated = false;
        } else if(score === max) {
            repeated = true;
        }
    }

    return repeated;
}

class Overtime {
    private overtimeCount = 0;
    private timeout: ReturnType<typeof setTimeout>;
    private lastCountdownEndTimestamp = 0;
    private unsubFromStateChange: () => void;

    constructor(private readonly mapOptions: Gimloader.Stores.Device, private readonly getScoreboard: GetScoreboard) {
        this.timeout = this.getTimeout();

        this.unsubFromStateChange = api.patcher.after(this.mapOptions, "onStateChange", () => {
            const countdownEndTimestamp = this.mapOptions.state.countdownEndTimestamp;

            if(countdownEndTimestamp !== this.lastCountdownEndTimestamp) {
                clearTimeout(this.timeout);
                this.timeout = this.getTimeout();
            }
        });
    }

    private getTimeout() {
        return setTimeout(() => this.handleEnd(), this.getTimeoutDuration());
    }

    private getTimeoutDuration() {
        const countdownEndTimestamp = this.mapOptions.state.countdownEndTimestamp;
        this.lastCountdownEndTimestamp = countdownEndTimestamp;
        return (countdownEndTimestamp - Date.now()) - 1000;
    }

    private isTied() {
        const scoreboard = this.getScoreboard();
        return maxRepeatedTwice(scoreboard.map(s => s.score));
    }

    private async handleEnd() {
        if(!this.isTied()) return;

        this.overtimeCount++;

        for(let i = 0; i < settings.length; i++) {
            api.net.send("ADD_GAME_TIME");
        }

        api.UI.notification.info({
            message: `Overtime #${this.overtimeCount}`
        });
    }

    stop() {
        clearTimeout(this.timeout);
        this.unsubFromStateChange();
    }

    suddenDeath() {
        if(!this.overtimeCount || this.isTied()) return;
        this.stop();
        api.net.send("END_GAME");
    }
}

api.net.onLoad(async () => {
    if(!api.net.isHost) return;

    // It turns out there's a bit of logic needed to get the scoreboard
    const getScoreboard = await new Promise<GetScoreboard>(res => {
        api.rewriter.exposeVar("App", {
            check: "().includeSpectatorsInScoreboard===!1",
            find: /if\(\w+\)return \w+\.\w+===\w+\.\w+\},(\w+)=\(\)=>/,
            callback: res
        });
    });

    const allDevices = api.stores.phaser.scene.worldManager.devices.allDevices;

    const getMapOptions = () => {
        return allDevices.find(d => d.deviceOption.id === "mapOptions");
    };

    const mapOptions = getMapOptions();
    if(!mapOptions) return;
    if(mapOptions.options.scoreType !== "Knockout" || !mapOptions.options.useScoreboard) return;

    let overtime: Overtime | null = null;

    const session = api.net.state.session;

    api.onStop(
        session.gameSession.listen("phase", (phase) => {
            if(phase !== "results") return;
            overtime?.stop();
            overtime = null;
        }, false)
    );

    // The map options device isn't properly created until fully loading
    api.onStop(
        session.listen("loadingPhase", (loading) => {
            if(loading || session.gameSession.phase !== "game") return;
            const mapOptions = getMapOptions();
            if(!mapOptions) return;
            overtime = new Overtime(mapOptions, getScoreboard);
        })
    );

    api.net.on("KNOCKOUT", () => {
        if(!settings.suddenDeath) return;
        overtime?.suddenDeath();
    });

    api.onStop(() => {
        overtime?.stop();
    });
});
