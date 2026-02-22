This library is mostly unnecessary after the introduction of the [rewriter](/api/scopedrewriter) api. It allows scripts to intercept calls to MobX's observer wrapper, which can be useful for modifying certain UI elements.

## Usage

```js
/**
 * @needsLib MobxUtils | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/MobxUtils.js
 */

const MobxUtils = api.lib("MobxUtils");

// Filter for observers being registered with a function including "keyword" in its source code
MobxUtils.interceptObserver("MyScript", (str) => str.includes("keyword"), (func) => {
    // Return a new function that wraps the old function
    const newFunc = function() {
        let res = func.apply(this, arguments);

        // Modify res somehow...
        res.props.children = ["Hello World"];

        return res;
    }

    return newFunc;
});

// Cleanup
api.onStop(() => {
    MobxUtils.stopIntercepts("MyScript");
});
```
