import defaultThemes from "../defaultThemes.json";
import type UIChanger from "../uiChanger";
import ThemePicker from "./themePicker";
import ThemePreview from "./themePreview";

export default function UI({ uiChanger, onConfirm }: { uiChanger: UIChanger; onConfirm: (callback: () => void) => void }) {
    const React = api.React;

    const [hideTopBar, setHideTopBar] = React.useState(uiChanger.hideTopBar);
    const [useCustomTheme, setUseCustomTheme] = React.useState(uiChanger.useCustomTheme);
    const [customThemes, setCustomThemes] = React.useState(uiChanger.customThemes);
    const [themeType, setThemeType] = React.useState(uiChanger.themeType);
    const [themeIndex, setThemeIndex] = React.useState(uiChanger.themeIndex);
    const [questionOpacity, setQuestionOpacity] = React.useState(uiChanger.questionOpacity);

    // reactively get the active theme based on the theme type and index
    const [activeTheme, setActiveTheme] = React.useState(() => {
        if(themeType === "default") return defaultThemes[themeIndex];
        else return customThemes[themeIndex];
    });

    React.useEffect(() => {
        if(themeType === "default") setActiveTheme(defaultThemes[themeIndex]);
        else setActiveTheme(customThemes[themeIndex]);
    }, [themeType, themeIndex]);

    onConfirm(() => {
        uiChanger.updateSettings(hideTopBar, useCustomTheme, customThemes, themeType, themeIndex, questionOpacity);
    });

    const openThemePicker = () => {
        api.UI.showModal(
            <ThemePicker
                themeType={themeType}
                setThemeType={setThemeType}
                themeIndex={themeIndex}
                setThemeIndex={setThemeIndex}
                customThemes={customThemes}
                setCustomThemes={setCustomThemes}
                activeTheme={activeTheme} />,
            {
                id: "ThemePicker",
                title: "Theme Picker",
                closeOnBackgroundClick: true,
                buttons: [{
                    text: "Close",
                    style: "close"
                }],
                style: "width: max(50%, 400px)"
            }
        );
    };

    return (
        <div className="cui-settings">
            <div className="row">
                <div>Auto Hide Top Bar</div>
                <input
                    type="checkbox"
                    checked={hideTopBar}
                    onChange={e => {
                        setHideTopBar(e.target.checked);
                    }} />
            </div>

            <div className="row">
                <div>Question Panel Opacity</div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={questionOpacity}
                    onChange={(e) => {
                        setQuestionOpacity(parseFloat(e.target.value));
                    }} />
            </div>

            <div className="row">
                <div>Use Custom Theme</div>
                <input
                    type="checkbox"
                    checked={useCustomTheme}
                    onChange={e => {
                        setUseCustomTheme(e.target.checked);
                    }} />
            </div>

            <ThemePreview theme={activeTheme} onClick={openThemePicker} text={`Current theme: ${activeTheme.name} ✎`} />
        </div>
    );
}
