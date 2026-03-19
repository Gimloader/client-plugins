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

const codeWrapper = api.rewriter.createShared("CodeWrapper", (small: boolean, element: any) => {
    return <CodeWrapper small={small}>{element}</CodeWrapper>;
});

// Wrap the 1d and 2d lobby screen elements
api.rewriter.addParseHook("SixteenByNineScaler", (code) => {
    const startIndex = code.indexOf(`children:"Copy Join Link"`) + 40;
    const endIndex = code.indexOf("})", startIndex) + 2;
    if(startIndex === -1 || endIndex === -1) return code;

    const wrapped = `${codeWrapper}(false,` + code.slice(startIndex, endIndex) + `)`;
    return code.slice(0, startIndex) + wrapped + code.slice(endIndex);
});

// Wrap the 2d game screen element
api.rewriter.addParseHook("App", (code) => {
    const index = code.indexOf("Game Code (Click to enlarge)");
    if(index === -1) return code;

    const startIndex = code.indexOf("children:", index) + 9;
    const endIndex = code.indexOf("})", startIndex) + 2;
    const wrapped = `${codeWrapper}(true,` + code.slice(startIndex, endIndex) + `)`;
    return code.slice(0, startIndex) + wrapped + code.slice(endIndex);
});
