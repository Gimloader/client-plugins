import GL from 'gimloader';
// @ts-ignore
import styles from './styles.scss';
import UI from './ui/ui';
import UIChanger from './uiChanger';

let uiChanger = new UIChanger();

GL.UI.addStyles(styles);

GL.openSettingsMenu(() => {
    let confirmFunc: () => void;
    let onConfirm = (callback: () => void) => {
        confirmFunc = callback;
    }

    GL.UI.showModal(GL.React.createElement(UI, { uiChanger, onConfirm }), {
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
    })
});