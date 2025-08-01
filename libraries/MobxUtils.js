/**
 * @name MobxUtils
 * @description Some simple utilities for react injection with MobX
 * @author TheLazySquid
 * @version 0.3.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/libraries/MobxUtils.js
 * @isLibrary true
 * @reloadRequired true
 */

const api = new GL();
let observerIntercepts = [];

const wrapObserver = api.rewriter.createShared("ObserverWrapper", (func) => {
    console.log("Wrapping", func);
    return function() {
        if(GL.libs.isEnabled("MobxUtils")) {
            // this is our only good way of telling apart functions
            let str = arguments[0].toString();
            for(let intercept of observerIntercepts) {
                if(intercept.match(str)) {
                    let newVal = intercept.callback(arguments[0]);
                    if(newVal) arguments[0] = newVal;
                }
            }
        }

        return func.apply(this, arguments);
    }
});

api.rewriter.addParseHook("mobxreact", (code) => {
    const index = code.indexOf("[mobx-react-lite]");
    if(index === -1) return;

    const funcStart = code.lastIndexOf("function", index);
    const nameEnd = code.indexOf("(", funcStart);
    const name = code.slice(funcStart + 9, nameEnd);
    const funcEnd = code.indexOf("}", code.indexOf(".forwardRef", index)) + 1;
    const func = code.slice(funcStart, funcEnd);

    code = code.slice(0, funcStart) + `const ${name}=(${wrapObserver} ?? (v => v))(${func});`
        + code.slice(funcEnd);

    return code;
});

export function interceptObserver(id, match, callback) {
    observerIntercepts.push({ match, callback, id });
}

export function stopIntercepts(id) {
    observerIntercepts = observerIntercepts.filter(intercept => intercept.id !== id);
}