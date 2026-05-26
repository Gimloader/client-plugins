import "./styles.css";
import UI from "./ui/ui";
import UIChanger from "./uiChanger";

const uiChanger = new UIChanger();

api.openSettingsMenu(() => {
    let confirmFunc: () => void;
    const onConfirm = (callback: () => void) => {
        confirmFunc = callback;
    };

    api.UI.showModal(api.React.createElement(UI, { uiChanger, onConfirm }), {
        id: "CustomUI",
        title: "UI Customization Options",
        style: "min-width: 400px",
        closeOnBackgroundClick: false,
        buttons: [{
            text: "Cancel",
            style: "close"
        }, {
            text: "Apply",
            style: "primary",
            onClick: () => {
                confirmFunc();
            }
        }]
    });
});
