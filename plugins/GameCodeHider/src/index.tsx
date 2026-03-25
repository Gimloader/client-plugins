import styles from "./styles.css";
api.UI.addStyles(styles);

function CodeWrapper({ children, small }: { children: any; small: boolean }) {
    const React = GL.React;
    const [hidden, setHidden] = React.useState<boolean>(api.storage.getValue("hidden", false));

    const text = hidden ? "######" : children.props.children;
    const code = React.cloneElement(children, {
        ...children.props,
        children: text
    });

    const toggleHidden = () => {
        setHidden((prev) => {
            api.storage.setValue("hidden", !prev);
            return !prev;
        });
    };

    return (
        <div className={small ? "gch-wrap-small" : "gch-wrap"}>
            {code}
            <div className={`${small ? "gch-toggle-small" : "gch-toggle"} far ${hidden ? "fa-eye-slash" : "fa-eye"}`} onClick={toggleHidden}></div>
        </div>
    );
}

const createWrapper = api.rewriter.createShared("createWrapper", (small: boolean, Element: any) => {
    return function(props: any) {
        return (
            <CodeWrapper small={small}>
                <Element {...props} />
            </CodeWrapper>
        )
    }
});

// Wrap the 1d and 2d lobby screen elements
api.rewriter.runInScope("SixteenByNineScaler", (code, run, initial) => {
    const nameStart = code.indexOf("font-size: 32px;") + 19;
    const nameEnd = code.indexOf("=", nameStart);
    const component = code.slice(nameStart, nameEnd);

    run(`window._bigWrapper=${component};${component}=${createWrapper}(false,${component})`);
    if(!initial) api.UI.forceReactUpdate();
    
    api.onStop(() => {
        run(`${component}=window._bigWrapper`);
        api.UI.forceReactUpdate();
    });

    return true;
});

// Wrap the 2d game screen element
api.rewriter.runInScope("App", (code, run, initial) => {
    if(!code.includes("Game Code (Click to enlarge)")) return;

    const index = code.indexOf("padding: 8px 10px;");
    if(index === -1) return;

    const nameEnd = code.lastIndexOf("=", index);
    const nameStart = code.lastIndexOf(",", nameEnd) + 1;
    const component = code.slice(nameStart, nameEnd);

    run(`window._smallWrapper=${component};${component}=${createWrapper}(true,${component})`);
    if(!initial) api.UI.forceReactUpdate();
    
    api.onStop(() => {
        run(`${component}=window._smallWrapper`);
        api.UI.forceReactUpdate();
    });

    return true;
});

// Wrap the 1d game screen element
api.rewriter.runInScope("index", (code, run, initial) => {
    const index = code.indexOf(".showLargeCode?");
    if(index === -1) return;

    const nameStart = code.lastIndexOf(",", code.lastIndexOf(".div`", index)) + 1;
    const nameEnd = code.indexOf("=", nameStart);
    const component = code.slice(nameStart, nameEnd);

    run(`window._1dWrapper=${component};${component}=${createWrapper}(true,${component})`);    
    if(!initial) api.UI.forceReactUpdate();

    api.onStop(() => {
        run(`${component}=window._1dWrapper`);
        api.UI.forceReactUpdate();
    });

    return true;
});