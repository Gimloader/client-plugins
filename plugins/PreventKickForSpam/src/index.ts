api.net.onLoad(() => {
    let firstAnswerTime = 0;
    let lastAnswerTime = 0;

    api.net.on("send:QUESTION_ANSWERED", (_, editFn) => {
        const now = Date.now();
        firstAnswerTime ||= now;

        if(now - firstAnswerTime < 25000) return;
        if(now - lastAnswerTime <= 3000) {
            editFn(null);
        } else {
            lastAnswerTime = now;
        }
    });
});
