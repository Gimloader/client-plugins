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

interface CodeWrapperProps {
    children: any;
    small: boolean;
    prefix?: string;
}

function CodeWrapper({ children, small, prefix = "" }: CodeWrapperProps) {
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

    const text = hidden ? `${prefix}######` : children.props.children;
    const eye = <div className={`${small ? "gch-toggle-small" : "gch-toggle"} far ${hidden ? "fa-eye-slash" : "fa-eye"}`} onClick={toggleHidden}></div>;

    // Prevent clicks from doing their usual thing if the eye is clicked
    // For some reason stopPropagation does not seem to work here
    const onClick = children.props?.onClick;
    if(onClick) {
        children.props.onClick = (e: React.MouseEvent) => {
            if((e.target as HTMLElement).className.includes("gch-toggle")) return;
            onClick(e);
        }
    }

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

export const createWrapper = api.rewriter.createShared("createWrapper", (Element: any, small: boolean, prefix?: string) => {
    return (props: any) => (
        <CodeWrapper small={small} prefix={prefix}>
            <Element {...props} />
        </CodeWrapper>
    );
});