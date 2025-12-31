type InterceptCallback = (component: Function) => Function | void;
interface Intercept {
    id: string;
    match: (str: string) => boolean;
    callback: InterceptCallback;
}

let observerIntercepts: Intercept[] = [];

const wrapObserver = api.rewriter.createShared("ObserverWrapper", (func: Function) => {
    return function(this: any) {
        if(api.libs.isEnabled("MobxUtils")) {
            // this is our only good way of telling apart functions
            const str = arguments[0].toString();
            for(const intercept of observerIntercepts) {
                if(intercept.match(str)) {
                    const newVal = intercept.callback(arguments[0]);
                    if(newVal) arguments[0] = newVal;
                }
            }
        }

        return func.apply(this, arguments);
    };
});

api.rewriter.addParseHook("mobxreact", (code) => {
    const index = code.indexOf("[mobx-react-lite]");
    if(index === -1) return code;

    const funcStart = code.lastIndexOf("function", index);
    const nameEnd = code.indexOf("(", funcStart);
    const name = code.slice(funcStart + 9, nameEnd);
    const funcEnd = code.indexOf("}", code.indexOf(".forwardRef", index)) + 1;
    const func = code.slice(funcStart, funcEnd);

    code = code.slice(0, funcStart) + `const ${name}=(${wrapObserver}??(v => v))(${func});`
        + code.slice(funcEnd);

    return code;
});

export function interceptObserver(id: string, match: (str: string) => boolean, callback: InterceptCallback) {
    observerIntercepts.push({ match, callback, id });
}

export function stopIntercepts(id: string) {
    observerIntercepts = observerIntercepts.filter(intercept => intercept.id !== id);
}
