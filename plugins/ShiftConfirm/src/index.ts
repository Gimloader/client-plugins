let shiftHeld = false;

const keydown = (e: KeyboardEvent) => {
    if(e.key === "Shift") shiftHeld = true;
};

const keyup = (e: KeyboardEvent) => {
    if(e.key === "Shift") shiftHeld = false;
};

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);

api.onStop(() => {
    document.removeEventListener("keydown", keydown);
    document.removeEventListener("keyup", keyup);
});

api.rewriter.exposeVar(true, {
    find: /(\S+)\.useModal=\S+;\1\.info=function/,
    callback(val) {
        const originalConfirm = val.confirm;
        val.confirm = (...args: any[]) => {
            const [{ onOk }] = args;
            if(shiftHeld) {
                onOk();
            } else {
                return originalConfirm(...args);
            }
        };

        api.onStop(() => {
            val.confirm = originalConfirm;
        });
    }
});
