import styles from "./styles.css";
import { createWrapper } from "./wrapper";
api.UI.addStyles(styles);

// Wrap the 1d and 2d lobby screen elements
const BigCode = api.rewriter.createShared("BigCode", null);
api.rewriter.runInScope("SixteenByNineScaler", (code, run, initial) => {
    const nameStart = code.indexOf("font-size: 32px;") + 19;
    const nameEnd = code.indexOf("=", nameStart);
    const component = code.slice(nameStart, nameEnd);

    run(`${BigCode}=${component};${component}=${createWrapper}(${component},false)`);
    if(!initial) api.UI.forceReactUpdate();

    api.onStop(() => {
        run(`${component}=${BigCode}`);
        api.UI.forceReactUpdate();
    });

    return true;
});

// Wrap the 2d game screen element
const TwoDCode = api.rewriter.createShared("TwoDCode", null);
api.rewriter.runInScope("App", (code, run, initial) => {
    if(!code.includes("Game Code (Click to enlarge)")) return;

    const index = code.indexOf("padding: 8px 10px;");
    const nameEnd = code.lastIndexOf("=", index);
    const nameStart = code.lastIndexOf(",", nameEnd) + 1;
    const component = code.slice(nameStart, nameEnd);

    run(`${TwoDCode}=${component};${component}=${createWrapper}(${component},true)`);
    if(!initial) api.UI.forceReactUpdate();

    api.onStop(() => {
        run(`${component}=${TwoDCode}`);
        api.UI.forceReactUpdate();
    });

    return true;
});

// Wrap the creative lobby screen element
const CreativeCode = api.rewriter.createShared("CreativeCode", null);
api.rewriter.runInScope("App", (code, run, initial) => {
    const index = code.indexOf("Join Code: ");
    if(index === -1) return;

    const afterIndex = code.indexOf("light-shadow", index);
    const nameEnd = code.lastIndexOf("=", afterIndex);
    const nameStart = code.lastIndexOf(",", nameEnd) + 1;
    const component = code.slice(nameStart, nameEnd);

    run(`${CreativeCode}=${component};${component}=${createWrapper}(${component},true,"Join Code: ")`);
    if(!initial) api.UI.forceReactUpdate();

    api.onStop(() => {
        run(`${component}=${CreativeCode}`);
        api.UI.forceReactUpdate();
    });

    return true;
});

// Wrap the 1d game screen element
const OneDCode = api.rewriter.createShared("OneDCode", null);
api.rewriter.runInScope("index", (code, run, initial) => {
    const index = code.indexOf(".showLargeCode?");
    if(index === -1) return;

    const nameStart = code.lastIndexOf(",", code.lastIndexOf(".div`", index)) + 1;
    const nameEnd = code.indexOf("=", nameStart);
    const component = code.slice(nameStart, nameEnd);

    run(`${OneDCode}=${component};${component}=${createWrapper}(${component},true)`);
    if(!initial) api.UI.forceReactUpdate();

    api.onStop(() => {
        run(`${component}=${OneDCode}`);
        api.UI.forceReactUpdate();
    });

    return true;
});
