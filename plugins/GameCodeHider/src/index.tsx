import styles from "./styles.css";
api.UI.addStyles(styles);

const hiddenStyles = `.ant-popover .ant-qrcode {
    display: none;
}`;

let removeStyles: (() => void) | undefined;
updateHidden(api.storage.getValue("hidden", false));

function updateHidden(value: boolean) {
    if(value) {
        removeStyles = api.UI.addStyles(hiddenStyles);
    } else {
        removeStyles?.();
    }
}

function CodeWrapper({ children, small }: { children: any; small: boolean }) {
    const React = GL.React;
    const [hidden, setHidden] = React.useState<boolean>(api.storage.getValue("hidden", false));

    if(children.props?.showLargeCode) return children;

    const toggleHidden = (e: React.MouseEvent) => {
        e.stopPropagation();
        setHidden((prev) => {
            api.storage.setValue("hidden", !prev);
            updateHidden(!prev);
            return !prev;
        });
    };

    const text = hidden ? "######" : children.props.children;
    const eye = <div className={`${small ? "gch-toggle-small" : "gch-toggle"} far ${hidden ? "fa-eye-slash" : "fa-eye"}`} onClick={toggleHidden}></div>;

    if(small) {
        return React.cloneElement(children, {
            children: (
                <div className="gch-wrap-small">
                    {text}
                    {eye}
                </div>
            )
        });
    } else {
        const code = React.cloneElement(children, {
            ...children.props,
            children: text
        });

        return (
            <div className="gch-wrap">
                {code}
                {eye}
            </div>
        );
    }
}

const createWrapper = api.rewriter.createShared("createWrapper", (small: boolean, Element: any) => {
    return (props: any) => {
        return (
            <CodeWrapper small={small}>
                <Element {...props} />
            </CodeWrapper>
        );
    };
});

// Wrap the 1d and 2d lobby screen elements
const BigCode = api.rewriter.createShared("BigWrapper", null);
api.rewriter.runInScope("SixteenByNineScaler", (code, run, initial) => {
    const nameStart = code.indexOf("font-size: 32px;") + 19;
    const nameEnd = code.indexOf("=", nameStart);
    const component = code.slice(nameStart, nameEnd);

    run(`${BigCode}=${component};${component}=${createWrapper}(false,${component})`);
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

    run(`${TwoDCode}=${component};${component}=${createWrapper}(true,${component})`);
    if(!initial) api.UI.forceReactUpdate();

    api.onStop(() => {
        run(`${component}=${TwoDCode}`);
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

    run(`${OneDCode}=${component};${component}=${createWrapper}(true,${component})`);
    if(!initial) api.UI.forceReactUpdate();

    api.onStop(() => {
        run(`${component}=${OneDCode}`);
        api.UI.forceReactUpdate();
    });

    return true;
});
