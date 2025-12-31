let questions: any[] = [];
let answerDeviceId: string, currentQuestionId: string;

interface Packet {
    key: string;
    deviceId: string;
    data: any;
}

function answerQuestion() {
    if(!currentQuestionId) return;

    const question = questions.find(q => q._id === currentQuestionId);
    if(!question) return;

    const packet: Packet = {
        key: "answered",
        deviceId: answerDeviceId,
        data: {}
    };

    if(question.type === "text") {
        packet.data.answer = question.answers[0].text;
    } else {
        const correctAnswerId = question.answers.find((a: any) => a.correct)._id;
        packet.data.answer = correctAnswerId;
    }

    api.net.send("MESSAGE_FOR_DEVICE", packet);
}

api.net.on("DEVICES_STATES_CHANGES", (event) => {
    for(const change of event.changes) {
        const id = change[0];
        for(let i = 0; i < change[1].length; i++) {
            const index = change[1][i];
            const key = event.values[index];
            const value = change[2][i];
            if(key === "GLOBAL_questions") {
                questions = JSON.parse(value);
                console.log("Got questions", questions);

                answerDeviceId = id;
            }

            const playerId = api.stores.phaser.mainCharacter.id;

            if(key === `PLAYER_${playerId}_currentQuestionId`) {
                currentQuestionId = value;
            }
        }
    }
});

api.net.onLoad(() => {
    api.notification.open({ message: "IdleForXp is active" });
    const answerInterval = setInterval(answerQuestion, 30000);

    api.onStop(() => clearInterval(answerInterval));
});
