api.rewriter.exposeVar("Container-", {
    check: "?`Created ${",
    find: /content: center;\n`,(\w{1,3})=/,
    callback: (val, initial) => {
        if(!initial) api.UI.forceReactUpdate();
        api.onStop(() => api.UI.forceReactUpdate());

        api.patcher.afterReact(val.type, (_, args, result) => {
            const created = result.props.children[0].props.children.props.children.props.children[0].props.children[1].props.children[1].props;

            const playCount = args[0].game.playCount;
            const message = playCount ? playCount > 1 ? `played ${playCount} times` : "played once" : "never played";

            created.children += ", " + message;
        });
    }
});
