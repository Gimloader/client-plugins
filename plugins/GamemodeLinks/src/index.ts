import makeGame from "./makeGame";

const setLink = (path: string) => {
    const href = new URL(path, location.href).href;
    if(location.href === href) return;

    history.pushState({}, "", href);
};

let experienceId = "";
let hooks: Record<string, string> = {};
let selectOpen = false;
let gamemodeTitle = "";

let pathname = location.pathname;
let title = document.title;

function updatePage() {
    if(api.settings.updateLink) {
        if(!selectOpen || !experienceId) {
            setLink(pathname);
        } else {
            const newSearch = new URLSearchParams(hooks);
            setLink(`/gamemode/${experienceId}?${newSearch.toString()}`);
        }
    }

    if(api.settings.updateTitle) {
        if(!selectOpen || !gamemodeTitle) {
            document.title = title;
        } else {
            document.title = gamemodeTitle;
        }
    }
}

api.onStop(() => {
    setLink(pathname);
    document.title = title;
});

api.rewriter.swapVar("App-", {
    check: "`EXPERIENCE_HOOKS`",
    find: /}\):null]}\)},(\w{1,3})=.=>{let{options/,
    callback: (updateHooks, initial) => {
        if(!initial) api.UI.forceReactUpdate();

        return function(this: any, props: any) {
            const options = { ...props.options };
            const kitKey = Object.keys(options).find(hook => hook.toLowerCase().includes("kit"));
            if(kitKey) delete options[kitKey];

            experienceId = props.experienceId;
            hooks = options;
            updatePage();

            return updateHooks.apply(this, arguments);
        };
    }
});

api.rewriter.exposeVar("App-", {
    check: "`EXPERIENCE_GROUP_CACHE`",
    find: /EXPERIENCE_GROUP_CACHE`,(\w{1,3})=/,
    callback: (modal) => {
        api.patcher.afterReact(modal, (_, props, returnVal) => {
            pathname = location.pathname;
            title = document.title;

            const close = props[0].close;
            props[0].close = () => {
                close();
                selectOpen = false;
                experienceId = "";
                gamemodeTitle = "";
                updatePage();
            };

            selectOpen = returnVal.props.children.props.children.props.children[1].props.game !== undefined;
            updatePage();
        });
    }
});

api.rewriter.exposeVar("App-", {
    check: "(min-height: 650px)",
    find: /image:`gamepad`}},(\w{1,3})=/,
    callback: (titleComponent) => {
        api.patcher.beforeReact(titleComponent, (_, props) => {
            gamemodeTitle = props[0].title;
            updatePage();
        });
    }
});

const [root, id] = location.pathname.split("/").slice(1);

if(root === "gamemode") {
    makeGame(id, new URLSearchParams(location.search).entries())
        .then(gameId => {
            location.href = `/host?id=${gameId}`;
        })
        .catch((err: Error) => {
            api.UI.modal.error({
                content: err.message
            });
        });
} else {
    fetch("/api/games/summary/me")
        .then(res => res.json())
        .then(({ games }) => {
            api.settings.create([
                {
                    type: "dropdown",
                    id: "kit",
                    title: "Kit",
                    description: "Which kit should be used when starting a game from a link?",
                    options: games.map((g: any) => ({ label: g.title, value: g._id }))
                },
                {
                    id: "updateLink",
                    type: "toggle",
                    title: "Update Tab Link",
                    description: "If the tab link text should be updated to the gamemode link when using the gamemode selector",
                    default: true,
                    onChange: updatePage
                },
                {
                    id: "updateTitle",
                    type: "toggle",
                    title: "Update Tab Title",
                    description: "If the tab title should be updated to the gamemode name using the gamemode selector",
                    default: true,
                    onChange: updatePage
                }
            ]);
        }, api.logger.error);
}
