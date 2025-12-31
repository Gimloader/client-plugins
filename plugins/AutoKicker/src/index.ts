import AutoKicker from "./autokicker";
import styles from "./styles.scss";
import UI from "./ui";

const autoKicker = new AutoKicker();
let ui: HTMLElement | null = null;
let uiShown = api.storage.getValue("uiShown", true);

const checkStart = () => {
    if(api.net.isHost) {
        autoKicker.start();

        ui = document.createElement("div");
        ui.id = "AutoKick-UI";
        api.ReactDOM.createRoot(ui).render(api.React.createElement(UI, { autoKicker }));
        document.body.appendChild(ui);

        if(!uiShown) {
            ui.style.display = "none";
            if(
                autoKicker.kickDuplicateNames || autoKicker.kickSkinless
                || autoKicker.blacklist.length > 0 || autoKicker.kickIdle
            ) {
                api.notification.open({ message: "AutoKicker is running!" });
            }
        }
    }
};

api.hotkeys.addConfigurableHotkey({
    category: "Auto Kicker",
    title: "Toggle UI",
    preventDefault: false,
    default: {
        key: "KeyK",
        alt: true
    }
}, () => {
    if(!ui) return;

    uiShown = !uiShown;
    if(uiShown) ui.style.display = "block";
    else ui.style.display = "none";
    api.storage.setValue("uiShown", uiShown);
});

api.net.onLoad(checkStart);
api.UI.addStyles(styles);
