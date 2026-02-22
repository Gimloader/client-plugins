/**
 * @name IdleForXp
 * @description Automatically performs actions to let you gain XP while idle
 * @author TheLazySquid
 * @version 0.3.3
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/IdleForXp.js
 * @webpage https://gimloader.github.io/plugins/IdleForXp
 * @reloadRequired ingame
 * @gamemode 2d
 * @changelog Updated webpage url
 */

// plugins/IdleForXp/src/index.ts
var questions = [];
var answerDeviceId;
var currentQuestionId;
function answerQuestion() {
  if (!currentQuestionId) return;
  const question = questions.find((q) => q._id === currentQuestionId);
  if (!question) return;
  const packet = {
    key: "answered",
    deviceId: answerDeviceId,
    data: {}
  };
  if (question.type === "text") {
    packet.data.answer = question.answers[0].text;
  } else {
    const correctAnswerId = question.answers.find((a) => a.correct)._id;
    packet.data.answer = correctAnswerId;
  }
  api.net.send("MESSAGE_FOR_DEVICE", packet);
}
api.net.on("DEVICES_STATES_CHANGES", (event) => {
  for (const change of event.changes) {
    const id = change[0];
    for (let i = 0; i < change[1].length; i++) {
      const index = change[1][i];
      const key = event.values[index];
      const value = change[2][i];
      if (key === "GLOBAL_questions") {
        questions = JSON.parse(value);
        console.log("Got questions", questions);
        answerDeviceId = id;
      }
      const playerId = api.stores.phaser.mainCharacter.id;
      if (key === `PLAYER_${playerId}_currentQuestionId`) {
        currentQuestionId = value;
      }
    }
  }
});
api.net.onLoad(() => {
  api.UI.notification.open({ message: "IdleForXp is active" });
  const answerInterval = setInterval(answerQuestion, 3e4);
  api.onStop(() => clearInterval(answerInterval));
});
