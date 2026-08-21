/**
 * @name CommsTest
 * @description Tests whether Communication is transmitting messages correctly
 * @version 1.0.0
 * @author Gimloader Testing
 * @needsLib Communication | https://raw.githubusercontent.com/Gimloader/builds/main/libraries/Communication.js
 */

const Communication = api.lib("Communication");
const comms = new Communication("CommsTest");
api.onStop(() => comms.destroy());

comms.onEnabledChanged((enabled) => api.logger.log("Comms enabled:", enabled));

const testMessages = [
    "startTest",
    true,
    false,
    -20,
    -9.8765e36,
    0,
    1,
    100,
    500,
    1.2345e49,
    1.5,
    "",
    "a",
    "ab",
    "abc",
    "abcdefghi",
    "0123456789".repeat(65),
    [],
    [0, 1, 2, 3, 200, 201, 202, 203],
    {},
    { one: true, two: [0, 1], three: null }
];

const messagesJson = testMessages.map(JSON.stringify);

let testIndex = 0;
api.onStop(
    comms.onMessage((message) => {
        if(message === "startTest") {
            testIndex = 0;
        } else if(testIndex === 0) {
            api.logger.warn("Got unexpected first message:", message);
            return;
        }

        const expected = testMessages[testIndex];
        if(JSON.stringify(message) !== messagesJson[testIndex]) {
            api.logger.error(`Mismatch in message ${testIndex + 1}: got`, message, "expected", expected);
        } else {
            api.logger.log(`Test ${testIndex + 1}/${testMessages.length} succeeded`);
        }

        testIndex++;
    })
);

api.onStop(
    comms.onStringStream((subscribe) => {
        let message = "";
        subscribe((chunk, done) => {
            message += chunk;
            if(!done) return;

            if(testMessages.includes(message)) {
                api.logger.log("String stream matches");
            } else {
                api.logger.error(`Unexpected string stream: got`, message);
            }
        });
    })
);

api.onStop(
    comms.onByteStream((subscribe) => {
        const bytes = [];
        subscribe((chunk, done) => {
            bytes.push(...chunk);
            if(!done) return;

            if(messagesJson.includes(JSON.stringify(bytes))) {
                api.logger.log("Byte stream matches");
            } else {
                api.logger.error(`Unexpected byte stream: got`, message);
            }
        });
    })
);

window.comms = comms;
window.startTest = async () => {
    for(let i = 0; i < testMessages.length; i++) {
        await comms.send(testMessages[i]);
        api.logger.log(`Sent message ${i + 1}/${testMessages.length}`);
    }
};
