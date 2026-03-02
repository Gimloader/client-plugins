/**
 * @name Autosplitter
 * @description Automatically times speedruns for various gamemodes
 * @author TheLazySquid
 * @version 0.6.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/Autosplitter.js
 * @webpage https://gimloader.github.io/plugins/Autosplitter
 * @hasSettings true
 * @gamemode dontLookDown
 * @gamemode fishtopia
 * @gamemode oneWayOut
 * @changelog Moved plant drop rate to InfoLines
 */

// external-svelte:svelte/internal/client
var append = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.append)();
var append_styles = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.append_styles)();
var bind_checked = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.bind_checked)();
var bind_select_value = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.bind_select_value)();
var bind_value = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.bind_value)();
var child = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.child)();
var comment = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.comment)();
var delegate = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.delegate)();
var derived = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.derived)();
var each = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.each)();
var first_child = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.first_child)();
var from_html = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.from_html)();
var get = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.get)();
var index = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.index)();
var key = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.key)();
var next = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.next)();
var pop = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.pop)();
var prop = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.prop)();
var proxy = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.proxy)();
var push = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.push)();
var remove_input_defaults = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.remove_input_defaults)();
var reset = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.reset)();
var set = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set)();
var set_class = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set_class)();
var set_text = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set_text)();
var set_value = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.set_value)();
var sibling = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.sibling)();
var snapshot = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.snapshot)();
var state = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.state)();
var template_effect = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.template_effect)();
var if_export = /* @__PURE__ */ (() => GL.svelte_5_43_0.Client.if)();

// plugins/Autosplitter/src/constants.ts
var gamemodes = ["DLD", "Fishtopia", "OneWayOut"];
var DLDSplits = ["Summit 1", "Summit 2", "Summit 3", "Summit 4", "Summit 5", "Summit 6"];
var fishtopiaSplits = ["Fishtopia", "Purple Pond", "Sandy Shores", "Cosmic Cove", "Lucky Lake"];
var boatChannels = [
  "attempt travel purple pond",
  "attempt travel sandy shores",
  "attempt travel cosmic cove",
  "attempt travel lucky lake"
];
var summitStartCoords = [
  { x: 9071, y: 65e3, direction: "right" },
  // summit 1
  { x: 28788.9, y: 53278, direction: "left" },
  // summit 2
  { x: 21387.95, y: 50078, direction: "right" },
  // summit 3
  { x: 39693.5, y: 41374, direction: "right" },
  // summit 4
  { x: 35212, y: 35166, direction: "right" },
  // summit 5
  { x: 39755.93, y: 28573, direction: "right" },
  // summit 6
  { x: 40395.91, y: 13854, direction: "right" }
  // finish
];
var summitCoords = [{
  x: 9022.997283935547,
  y: 63837.7685546875,
  direction: "right"
}, {
  x: 28544.000244140625,
  y: 53278.0029296875,
  direction: "left"
}, {
  x: 21755.00030517578,
  y: 50077.99987792969,
  direction: "right"
}, {
  x: 40033.99963378906,
  y: 41373.9990234375,
  direction: "right"
}, {
  x: 35654.00085449219,
  y: 35166.00036621094,
  direction: "right"
}, {
  x: 40126.99890136719,
  y: 28573.9990234375,
  direction: "right"
}];
var resetCoordinates = { x: 9050, y: 6300 };
var categories = ["Current Patch", "Creative Platforming Patch", "Original Physics"];
var oneWayOutSplits = ["Stage 1", "Stage 2", "Stage 3"];
var stageCoords = [{
  p1: { x: 12008, y: 3147 },
  p2: { x: 13072, y: 5770 }
}, {
  p1: { x: 10813, y: 8962 },
  p2: { x: 13312, y: 9888 }
}];

// plugins/Autosplitter/src/util.ts
function getGamemodeData(gamemode) {
  switch (gamemode) {
    case "DLD":
      return getDLDData();
    case "Fishtopia":
      return getFishtopiaData();
    case "OneWayOut":
      return getOneWayOutData();
    default:
      throw new Error(`Invalid gamemode: ${gamemode}`);
  }
}
var DLDDefaults = {
  mode: "Full Game",
  ilSummit: 0,
  ilPreboosts: false,
  autostartILs: false,
  autoRecord: true,
  attempts: {},
  pb: {},
  bestSplits: {},
  ilpbs: {},
  showPbSplits: false,
  showSplits: true,
  showSplitTimes: true,
  showSplitComparisons: true,
  showSplitTimeAtEnd: true,
  timerPosition: "top right"
};
function getDLDData() {
  const data = api.storage.getValue("DLDData", {});
  return Object.assign(DLDDefaults, data);
}
var splitsDefaults = {
  attempts: {},
  pb: {},
  bestSplits: {},
  showPbSplits: false,
  showSplits: true,
  showSplitTimes: true,
  showSplitComparisons: true,
  showSplitTimeAtEnd: true,
  timerPosition: "top right"
};
function getFishtopiaData() {
  const data = api.storage.getValue("FishtopiaData", {});
  return Object.assign(splitsDefaults, data);
}
function getOneWayOutData() {
  const data = api.storage.getValue("OneWayOutData", {});
  return Object.assign(splitsDefaults, data);
}
function downloadFile(data, filename) {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function readFile() {
  return new Promise((res, rej) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return rej("No file selected");
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result;
        if (typeof data !== "string") return rej("Failed to read file");
        const parsed = JSON.parse(data);
        res(parsed);
      };
      reader.readAsText(file);
    });
    input.click();
  });
}
function fmtMs(ms) {
  ms = Math.round(ms);
  let seconds = Math.floor(ms / 1e3);
  const minutes = Math.floor(seconds / 60);
  ms %= 1e3;
  seconds %= 60;
  if (minutes > 0) return `${minutes}:${String(seconds).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
  return `${seconds}.${String(ms).padStart(3, "0")}`;
}
function parseTime(time) {
  const parts = time.split(":").map(parseFloat);
  if (parts.some(Number.isNaN)) return 6e5;
  if (parts.length === 1) return parts[0] * 1e3;
  if (parts.length === 2) return parts[0] * 6e4 + parts[1] * 1e3;
  return parts[0] * 36e5 + parts[1] * 6e4 + parts[2] * 1e3;
}
function inArea(coords, area) {
  if (area.direction === "right" && coords.x < area.x) return false;
  if (area.direction === "left" && coords.x > area.x) return false;
  if (coords.y > area.y + 10) return false;
  return true;
}
function inBox(coords, box) {
  return coords.x > box.p1.x && coords.x < box.p2.x && coords.y > box.p1.y && coords.y < box.p2.y;
}
function onPhysicsStep(callback) {
  const worldManager = api.stores.phaser.scene.worldManager;
  api.patcher.after(worldManager.physics, "physicsStep", () => {
    callback();
  });
}
function onFrame(callback) {
  const worldManager = api.stores.phaser.scene.worldManager;
  api.patcher.after(worldManager, "update", () => {
    callback();
  });
}

// plugins/Autosplitter/src/settings/FullGame.svelte
var root_1 = from_html(`<tr><td> </td><td><input/></td><td><input/></td></tr>`);
var root = from_html(`<div>Attempts: <input type="number"/></div> <table><thead><tr><th style="min-width: 80px">Split</th><th style="min-width: 80px">Best Split</th><th style="min-width: 80px">Split during PB</th></tr></thead><tbody></tbody></table> <button>Reset splits</button>`, 1);
function FullGame($$anchor, $$props) {
  push($$props, true);
  let data = prop($$props, "data", 15);
  function resetSplits() {
    let conf = confirm("Are you sure you want to reset all splits for this category?");
    if (!conf) return;
    data(data().pb[$$props.category] = [], true);
    data(data().bestSplits[$$props.category] = [], true);
  }
  var fragment = root();
  var div = first_child(fragment);
  var input = sibling(child(div));
  remove_input_defaults(input);
  reset(div);
  var table = sibling(div, 2);
  var tbody = sibling(child(table));
  each(tbody, 21, () => $$props.splits, index, ($$anchor2, split, i) => {
    var tr = root_1();
    var td = child(tr);
    var text = child(td, true);
    reset(td);
    var td_1 = sibling(td);
    var input_1 = child(td_1);
    remove_input_defaults(input_1);
    input_1.__change = (e) => {
      if (e.currentTarget.value === "") {
        data(data().bestSplits[$$props.category][i] = void 0, true);
        return;
      }
      let ms = parseTime(e.currentTarget.value);
      if (!data().bestSplits[$$props.category]) data(data().bestSplits[$$props.category] = [], true);
      data(data().bestSplits[$$props.category][i] = ms, true);
    };
    reset(td_1);
    var td_2 = sibling(td_1);
    var input_2 = child(td_2);
    remove_input_defaults(input_2);
    input_2.__change = (e) => {
      let ms = parseTime(e.currentTarget.value);
      if (!data().pb[$$props.category]) data(data().pb[$$props.category] = [], true);
      data(data().pb[$$props.category][i] = ms, true);
    };
    reset(td_2);
    reset(tr);
    template_effect(
      ($0, $1) => {
        set_text(text, get(split));
        set_value(input_1, $0);
        set_value(input_2, $1);
      },
      [
        () => data().bestSplits[$$props.category]?.[i] ? fmtMs(data().bestSplits[$$props.category][i]) : "",
        () => data().pb[$$props.category]?.[i] ? fmtMs(data().pb[$$props.category][i]) : ""
      ]
    );
    append($$anchor2, tr);
  });
  reset(tbody);
  reset(table);
  var button = sibling(table, 2);
  button.__click = resetSplits;
  bind_value(input, () => data().attempts[$$props.category], ($$value) => data(data().attempts[$$props.category] = $$value, true));
  append($$anchor, fragment);
  pop();
}
delegate(["change", "click"]);

// plugins/Autosplitter/src/settings/ILSettings.svelte
var root_12 = from_html(`<h2>Preboosts</h2> <div class="grid svelte-1a0zhct"><div>Attempts:</div> <input type="number"/> <div>Personal best:</div> <input/></div>`, 1);
var root2 = from_html(`<h2>No Preboosts</h2> <div class="grid svelte-1a0zhct"><div>Attempts:</div> <input type="number"/> <div>Personal best:</div> <input/></div> <!>`, 1);
var $$css = {
  hash: "svelte-1a0zhct",
  code: ".grid.svelte-1a0zhct {display:grid;gap:5px;grid-template-columns:max-content max-content;}"
};
function ILSettings($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css);
  let data = prop($$props, "data", 15);
  let id = `${$$props.category}-${$$props.summit}`;
  let preboostsId = `${$$props.category}-${$$props.summit}-preboosts`;
  var fragment = root2();
  var div = sibling(first_child(fragment), 2);
  var input = sibling(child(div), 2);
  remove_input_defaults(input);
  var input_1 = sibling(input, 4);
  remove_input_defaults(input_1);
  input_1.__change = (e) => {
    if (!e.currentTarget.value) {
      data(data().ilpbs[id] = null, true);
      return;
    }
    let ms = parseTime(e.currentTarget.value);
    data(data().ilpbs[id] = ms, true);
  };
  reset(div);
  var node = sibling(div, 2);
  {
    var consequent = ($$anchor2) => {
      var fragment_1 = root_12();
      var div_1 = sibling(first_child(fragment_1), 2);
      var input_2 = sibling(child(div_1), 2);
      remove_input_defaults(input_2);
      var input_3 = sibling(input_2, 4);
      remove_input_defaults(input_3);
      input_3.__change = (e) => {
        if (!e.currentTarget.value) {
          data(data().ilpbs[preboostsId] = null, true);
          return;
        }
        let ms = parseTime(e.currentTarget.value);
        data(data().ilpbs[preboostsId] = ms, true);
      };
      reset(div_1);
      template_effect(($0) => set_value(input_3, $0), [
        () => data().ilpbs[preboostsId] ? fmtMs(data().ilpbs[preboostsId]) : ""
      ]);
      bind_value(input_2, () => data().attempts[preboostsId], ($$value) => data(data().attempts[preboostsId] = $$value, true));
      append($$anchor2, fragment_1);
    };
    if_export(node, ($$render) => {
      if ($$props.category !== "Current Patch") $$render(consequent);
    });
  }
  template_effect(($0) => set_value(input_1, $0), [() => data().ilpbs[id] ? fmtMs(data().ilpbs[id]) : ""]);
  bind_value(input, () => data().attempts[id], ($$value) => data(data().attempts[id] = $$value, true));
  append($$anchor, fragment);
  pop();
}
delegate(["change"]);

// plugins/Autosplitter/src/settings/DLDToggles.svelte
var root3 = from_html(`<div class="row svelte-qo9uk0"><select><option>Top left</option><option>Top right</option><option>Bottom left</option><option>Bottom right</option></select> Timer position</div> <div class="row svelte-qo9uk0"><input type="checkbox" class="svelte-qo9uk0"/> Show splits</div> <div class="row svelte-qo9uk0"><input type="checkbox" class="svelte-qo9uk0"/> Show split times</div> <div class="row svelte-qo9uk0"><input type="checkbox" class="svelte-qo9uk0"/> Show split comparisons</div> <div class="row svelte-qo9uk0"><input type="checkbox" class="svelte-qo9uk0"/> Show split time at end</div> <div class="row svelte-qo9uk0"><input type="checkbox" class="svelte-qo9uk0"/> Show time of split in PB</div> <div class="row svelte-qo9uk0"><input type="checkbox" class="svelte-qo9uk0"/> Start ILs upon using savestates to warp there</div> <div class="note svelte-qo9uk0">For summit one this will only happen if you don't have full game selected</div> <div class="row svelte-qo9uk0"><input type="checkbox" class="svelte-qo9uk0"/> Automatically record all runs and save PBs</div> <div> </div>`, 1);
var $$css2 = {
  hash: "svelte-qo9uk0",
  code: ".row.svelte-qo9uk0 {display:flex;align-items:center;gap:10px;}input.svelte-qo9uk0 {width:20px;height:20px;appearance:auto !important;}.note.svelte-qo9uk0 {font-size:0.7em;color:gray;}.error.svelte-qo9uk0 {color:red;}"
};
function DLDToggles($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css2);
  let data = prop($$props, "data", 15);
  let hasInputRecorder = api.plugins.isEnabled("InputRecorder");
  var fragment = root3();
  var div = first_child(fragment);
  var select = child(div);
  var option = child(select);
  option.value = option.__value = "top left";
  var option_1 = sibling(option);
  option_1.value = option_1.__value = "top right";
  var option_2 = sibling(option_1);
  option_2.value = option_2.__value = "bottom left";
  var option_3 = sibling(option_2);
  option_3.value = option_3.__value = "bottom right";
  reset(select);
  next();
  reset(div);
  var div_1 = sibling(div, 2);
  var input = child(div_1);
  remove_input_defaults(input);
  next();
  reset(div_1);
  var div_2 = sibling(div_1, 2);
  var input_1 = child(div_2);
  remove_input_defaults(input_1);
  next();
  reset(div_2);
  var div_3 = sibling(div_2, 2);
  var input_2 = child(div_3);
  remove_input_defaults(input_2);
  next();
  reset(div_3);
  var div_4 = sibling(div_3, 2);
  var input_3 = child(div_4);
  remove_input_defaults(input_3);
  next();
  reset(div_4);
  var div_5 = sibling(div_4, 2);
  var input_4 = child(div_5);
  remove_input_defaults(input_4);
  next();
  reset(div_5);
  var div_6 = sibling(div_5, 2);
  var input_5 = child(div_6);
  remove_input_defaults(input_5);
  next();
  reset(div_6);
  var div_7 = sibling(div_6, 4);
  var input_6 = child(div_7);
  remove_input_defaults(input_6);
  next();
  reset(div_7);
  var div_8 = sibling(div_7, 2);
  let classes;
  var text = child(div_8);
  reset(div_8);
  template_effect(() => {
    classes = set_class(div_8, 1, "note svelte-qo9uk0", null, classes, { error: !hasInputRecorder });
    set_text(text, `This requires that you have the InputRecorder plugin installed and enabled${hasInputRecorder ? "" : " (which you don't)"}`);
  });
  bind_select_value(select, () => data().timerPosition, ($$value) => data(data().timerPosition = $$value, true));
  bind_checked(input, () => data().showSplits, ($$value) => data(data().showSplits = $$value, true));
  bind_checked(input_1, () => data().showSplitTimes, ($$value) => data(data().showSplitTimes = $$value, true));
  bind_checked(input_2, () => data().showSplitComparisons, ($$value) => data(data().showSplitComparisons = $$value, true));
  bind_checked(input_3, () => data().showSplitTimeAtEnd, ($$value) => data(data().showSplitTimeAtEnd = $$value, true));
  bind_checked(input_4, () => data().showPbSplits, ($$value) => data(data().showPbSplits = $$value, true));
  bind_checked(input_5, () => data().autostartILs, ($$value) => data(data().autostartILs = $$value, true));
  bind_checked(input_6, () => data().autoRecord, ($$value) => data(data().autoRecord = $$value, true));
  append($$anchor, fragment);
  pop();
}

// plugins/Autosplitter/src/settings/DLD.svelte
var root_13 = from_html(`<option> </option>`);
var root_2 = from_html(`<option> </option>`);
var root4 = from_html(`<select></select> <select><option>Full Game</option><!></select> <!> <hr/> <!>`, 1);
function DLD($$anchor, $$props) {
  push($$props, true);
  let data = prop($$props, "data", 15);
  let category = state(proxy(categories[0]));
  let mode = state("Full Game");
  var fragment = root4();
  var select = first_child(fragment);
  each(select, 21, () => categories, index, ($$anchor2, category2, $$index, $$array) => {
    var option = root_13();
    var text = child(option, true);
    reset(option);
    var option_value = {};
    template_effect(() => {
      set_text(text, get(category2));
      if (option_value !== (option_value = get(category2))) {
        option.value = (option.__value = get(category2)) ?? "";
      }
    });
    append($$anchor2, option);
  });
  reset(select);
  var select_1 = sibling(select, 2);
  var option_1 = child(select_1);
  option_1.value = option_1.__value = "Full Game";
  var node = sibling(option_1);
  each(node, 17, () => DLDSplits, index, ($$anchor2, split, i) => {
    var option_2 = root_2();
    var text_1 = child(option_2, true);
    reset(option_2);
    option_2.value = option_2.__value = i;
    template_effect(() => set_text(text_1, get(split)));
    append($$anchor2, option_2);
  });
  reset(select_1);
  var node_1 = sibling(select_1, 2);
  key(node_1, () => get(mode), ($$anchor2) => {
    var fragment_1 = comment();
    var node_2 = first_child(fragment_1);
    key(node_2, () => get(category), ($$anchor3) => {
      var fragment_2 = comment();
      var node_3 = first_child(fragment_2);
      {
        var consequent = ($$anchor4) => {
          {
            let $0 = derived(() => parseInt(get(mode)));
            ILSettings($$anchor4, {
              get category() {
                return get(category);
              },
              get summit() {
                return get($0);
              },
              get data() {
                return data();
              },
              set data($$value) {
                data($$value);
              }
            });
          }
        };
        var alternate = ($$anchor4) => {
          FullGame($$anchor4, {
            get splits() {
              return DLDSplits;
            },
            get category() {
              return get(category);
            },
            get data() {
              return data();
            },
            set data($$value) {
              data($$value);
            }
          });
        };
        if_export(node_3, ($$render) => {
          if (get(mode) !== "Full Game") $$render(consequent);
          else $$render(alternate, false);
        });
      }
      append($$anchor3, fragment_2);
    });
    append($$anchor2, fragment_1);
  });
  var node_4 = sibling(node_1, 4);
  DLDToggles(node_4, {
    get data() {
      return data();
    },
    set data($$value) {
      data($$value);
    }
  });
  bind_select_value(select, () => get(category), ($$value) => set(category, $$value));
  bind_select_value(select_1, () => get(mode), ($$value) => set(mode, $$value));
  append($$anchor, fragment);
  pop();
}

// plugins/Autosplitter/src/settings/SplitsToggles.svelte
var root5 = from_html(`<div class="row svelte-xkkpx7"><select><option>Top left</option><option>Top right</option><option>Bottom left</option><option>Bottom right</option></select> Timer position</div> <div class="row svelte-xkkpx7"><input type="checkbox" class="svelte-xkkpx7"/> Show splits</div> <div class="row svelte-xkkpx7"><input type="checkbox" class="svelte-xkkpx7"/> Show split times</div> <div class="row svelte-xkkpx7"><input type="checkbox" class="svelte-xkkpx7"/> Show split comparisons</div> <div class="row svelte-xkkpx7"><input type="checkbox" class="svelte-xkkpx7"/> Show split time at end</div> <div class="row svelte-xkkpx7"><input type="checkbox" class="svelte-xkkpx7"/> Show time of split in PB</div>`, 1);
var $$css3 = {
  hash: "svelte-xkkpx7",
  code: ".row.svelte-xkkpx7 {display:flex;align-items:center;gap:10px;}input.svelte-xkkpx7 {width:20px;height:20px;appearance:auto !important;}"
};
function SplitsToggles($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css3);
  let data = prop($$props, "data", 15);
  var fragment = root5();
  var div = first_child(fragment);
  var select = child(div);
  var option = child(select);
  option.value = option.__value = "top left";
  var option_1 = sibling(option);
  option_1.value = option_1.__value = "top right";
  var option_2 = sibling(option_1);
  option_2.value = option_2.__value = "bottom left";
  var option_3 = sibling(option_2);
  option_3.value = option_3.__value = "bottom right";
  reset(select);
  next();
  reset(div);
  var div_1 = sibling(div, 2);
  var input = child(div_1);
  remove_input_defaults(input);
  next();
  reset(div_1);
  var div_2 = sibling(div_1, 2);
  var input_1 = child(div_2);
  remove_input_defaults(input_1);
  next();
  reset(div_2);
  var div_3 = sibling(div_2, 2);
  var input_2 = child(div_3);
  remove_input_defaults(input_2);
  next();
  reset(div_3);
  var div_4 = sibling(div_3, 2);
  var input_3 = child(div_4);
  remove_input_defaults(input_3);
  next();
  reset(div_4);
  var div_5 = sibling(div_4, 2);
  var input_4 = child(div_5);
  remove_input_defaults(input_4);
  next();
  reset(div_5);
  bind_select_value(select, () => data().timerPosition, ($$value) => data(data().timerPosition = $$value, true));
  bind_checked(input, () => data().showSplits, ($$value) => data(data().showSplits = $$value, true));
  bind_checked(input_1, () => data().showSplitTimes, ($$value) => data(data().showSplitTimes = $$value, true));
  bind_checked(input_2, () => data().showSplitComparisons, ($$value) => data(data().showSplitComparisons = $$value, true));
  bind_checked(input_3, () => data().showSplitTimeAtEnd, ($$value) => data(data().showSplitTimeAtEnd = $$value, true));
  bind_checked(input_4, () => data().showPbSplits, ($$value) => data(data().showPbSplits = $$value, true));
  append($$anchor, fragment);
  pop();
}

// plugins/Autosplitter/src/settings/Fishtopia.svelte
var root6 = from_html(`<!> <hr/> <!>`, 1);
function Fishtopia($$anchor, $$props) {
  push($$props, true);
  let data = prop($$props, "data", 15);
  var fragment = root6();
  var node = first_child(fragment);
  FullGame(node, {
    get splits() {
      return fishtopiaSplits;
    },
    category: "fishtopia",
    get data() {
      return data();
    },
    set data($$value) {
      data($$value);
    }
  });
  var node_1 = sibling(node, 4);
  SplitsToggles(node_1, {
    get data() {
      return data();
    },
    set data($$value) {
      data($$value);
    }
  });
  append($$anchor, fragment);
  pop();
}

// plugins/Autosplitter/src/settings/OneWayOut.svelte
var root7 = from_html(`<!> <hr/> <!>`, 1);
function OneWayOut($$anchor, $$props) {
  push($$props, true);
  let data = prop($$props, "data", 15);
  var fragment = root7();
  var node = first_child(fragment);
  FullGame(node, {
    get splits() {
      return oneWayOutSplits;
    },
    category: "OneWayOut",
    get data() {
      return data();
    },
    set data($$value) {
      data($$value);
    }
  });
  var node_1 = sibling(node, 4);
  SplitsToggles(node_1, {
    get data() {
      return data();
    },
    set data($$value) {
      data($$value);
    }
  });
  append($$anchor, fragment);
  pop();
}

// plugins/Autosplitter/src/settings/Settings.svelte
var root_14 = from_html(`<button> </button>`);
var root8 = from_html(`<div class="wrap"><div class="tabs svelte-du1p18"><!> <div class="actions svelte-du1p18"><button class="svelte-du1p18">All &#11123;</button> <button class="svelte-du1p18">All &#11121;</button> <button class="svelte-du1p18">Mode &#11123;</button> <button class="svelte-du1p18">Mode &#11121;</button></div></div> <div class="settings-content svelte-du1p18"><!></div></div>`);
var $$css4 = {
  hash: "svelte-du1p18",
  code: ".settings-content.svelte-du1p18 {max-height:calc(100% - 40px);overflow-y:auto;}.tabs.svelte-du1p18 {display:flex;padding-left:10px;gap:10px;border-bottom:1px solid gray;height:37px;}.tab.svelte-du1p18 {background-color:lightgray;border:1px solid gray;border-bottom:none;border-radius:10px;border-bottom-left-radius:0;border-bottom-right-radius:0;}.tab.active.svelte-du1p18 {background-color:white;}.actions.svelte-du1p18 {height:100%;display:flex;align-items:center;gap:10px;}.actions.svelte-du1p18 button:where(.svelte-du1p18) {margin:6px 0;padding:0 8px;height:25px;display:flex;align-items:center;justify-content:center;text-wrap:nowrap;}"
};
function Settings($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css4);
  let activeTab = state(proxy(gamemodes[0]));
  let dataObj = {};
  for (let gamemode of gamemodes) {
    dataObj[gamemode] = getGamemodeData(gamemode);
  }
  let data = proxy(dataObj);
  function save() {
    console.log(snapshot(data));
    for (let gamemode of gamemodes) {
      api.storage.setValue(`${gamemode}Data`, snapshot(data[gamemode]));
    }
  }
  function exportAll() {
    let json = {};
    for (let gamemode of gamemodes) {
      let data2 = api.storage.getValue(`${gamemode}Data`);
      if (!data2) continue;
      json[gamemode] = data2;
    }
    downloadFile(JSON.stringify(json), "splits.json");
  }
  function importAll() {
    readFile().then((newData) => {
      for (let gamemode of gamemodes) {
        if (!newData[gamemode]) continue;
        data[gamemode] = newData[gamemode];
        api.storage.setValue(`${gamemode}Data`, newData[gamemode]);
      }
    });
  }
  function exportMode() {
    let json = data[get(activeTab)];
    downloadFile(JSON.stringify(json), `${get(activeTab)}.json`);
  }
  function importMode() {
    readFile().then((newData) => {
      data[get(activeTab)] = newData;
      api.storage.setValue(`${get(activeTab)}Data`, newData);
    });
  }
  var $$exports = { save };
  var div = root8();
  var div_1 = child(div);
  var node = child(div_1);
  each(node, 17, () => gamemodes, index, ($$anchor2, tab) => {
    var button = root_14();
    let classes;
    button.__click = () => set(activeTab, get(tab), true);
    var text = child(button, true);
    reset(button);
    template_effect(() => {
      classes = set_class(button, 1, "tab svelte-du1p18", null, classes, { active: get(activeTab) === get(tab) });
      set_text(text, get(tab));
    });
    append($$anchor2, button);
  });
  var div_2 = sibling(node, 2);
  var button_1 = child(div_2);
  button_1.__click = exportAll;
  var button_2 = sibling(button_1, 2);
  button_2.__click = importAll;
  var button_3 = sibling(button_2, 2);
  button_3.__click = exportMode;
  var button_4 = sibling(button_3, 2);
  button_4.__click = importMode;
  reset(div_2);
  reset(div_1);
  var div_3 = sibling(div_1, 2);
  var node_1 = child(div_3);
  {
    var consequent = ($$anchor2) => {
      DLD($$anchor2, {
        get data() {
          return data.DLD;
        },
        set data($$value) {
          data.DLD = $$value;
        }
      });
    };
    var alternate_1 = ($$anchor2) => {
      var fragment_1 = comment();
      var node_2 = first_child(fragment_1);
      {
        var consequent_1 = ($$anchor3) => {
          Fishtopia($$anchor3, {
            get data() {
              return data.Fishtopia;
            },
            set data($$value) {
              data.Fishtopia = $$value;
            }
          });
        };
        var alternate = ($$anchor3) => {
          var fragment_3 = comment();
          var node_3 = first_child(fragment_3);
          {
            var consequent_2 = ($$anchor4) => {
              OneWayOut($$anchor4, {
                get data() {
                  return data.OneWayOut;
                },
                set data($$value) {
                  data.OneWayOut = $$value;
                }
              });
            };
            if_export(
              node_3,
              ($$render) => {
                if (get(activeTab) === "OneWayOut") $$render(consequent_2);
              },
              true
            );
          }
          append($$anchor3, fragment_3);
        };
        if_export(
          node_2,
          ($$render) => {
            if (get(activeTab) === "Fishtopia") $$render(consequent_1);
            else $$render(alternate, false);
          },
          true
        );
      }
      append($$anchor2, fragment_1);
    };
    if_export(node_1, ($$render) => {
      if (get(activeTab) === "DLD") $$render(consequent);
      else $$render(alternate_1, false);
    });
  }
  reset(div_3);
  reset(div);
  append($$anchor, div);
  return pop($$exports);
}
delegate(["click"]);

// plugins/Autosplitter/src/timers/basic.ts
var BasicTimer = class {
  constructor(autosplitter2, ui) {
    this.autosplitter = autosplitter2;
    this.ui = ui;
  }
  started = false;
  startTime = 0;
  now = 0;
  get elapsed() {
    return this.now - this.startTime;
  }
  start() {
    this.startTime = performance.now();
    this.started = true;
    this.ui.start();
  }
  stop() {
    this.started = false;
    const pb = this.autosplitter.pb;
    if (!pb || this.elapsed < pb) {
      this.autosplitter.data.pb[this.autosplitter.getCategoryId()] = this.elapsed;
      this.autosplitter.save();
    }
  }
  update() {
    if (!this.started) return;
    this.now = performance.now();
    this.ui.update(this.elapsed);
  }
};

// plugins/Autosplitter/src/timers/splits.ts
var SplitsTimer = class extends BasicTimer {
  constructor(autosplitter2, ui) {
    super(autosplitter2, ui);
    this.autosplitter = autosplitter2;
    this.ui = ui;
  }
  currentSplit = 0;
  splitStart = 0;
  splits = [];
  get splitElapsed() {
    return this.now - this.splitStart;
  }
  start() {
    super.start();
    this.splitStart = this.startTime;
    this.ui.setActiveSplit(0);
  }
  stop() {
    this.started = false;
    const pb = this.autosplitter.pb;
    if (!pb || this.splits[this.splits.length - 1] < pb) {
      this.autosplitter.data.pb[this.autosplitter.getCategoryId()] = this.splits;
      this.autosplitter.save();
    }
  }
  split() {
    this.ui.finishSplit(this.elapsed, this.currentSplit, this.splitElapsed);
    const bestSplit = this.autosplitter.bestSplits[this.currentSplit];
    if (!bestSplit || this.splitElapsed < bestSplit) {
      this.autosplitter.bestSplits[this.currentSplit] = this.splitElapsed;
      this.autosplitter.save();
    }
    this.splits.push(this.elapsed);
    this.currentSplit++;
    this.splitStart = this.now;
    this.ui.setActiveSplit(this.currentSplit);
  }
  update() {
    if (!this.started) return;
    super.update();
    const elapsed = this.now - this.startTime;
    this.ui.updateSplit(elapsed, this.currentSplit, this.splitElapsed);
  }
};

// assets/restore.svg
var restore_default = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z" fill="white" /></svg>';

// plugins/Autosplitter/src/ui/basic.ts
var BasicUI = class {
  constructor(autosplitter2) {
    this.autosplitter = autosplitter2;
    this.element = document.createElement("div");
    this.element.id = "timer";
    this.element.className = autosplitter2.data.timerPosition;
    const topBar = document.createElement("div");
    topBar.classList.add("bar");
    this.attemptsEl = document.createElement("div");
    this.attemptsEl.classList.add("attempts");
    this.attemptsEl.innerText = autosplitter2.attempts.toString();
    topBar.appendChild(this.attemptsEl);
    this.element.appendChild(topBar);
    this.total = document.createElement("div");
    this.total.classList.add("total");
    this.total.innerText = "0.00";
    this.element.appendChild(this.total);
    document.body.appendChild(this.element);
  }
  element;
  total;
  attemptsEl;
  start() {
    this.setTotalAhead(true);
  }
  update(totalMs) {
    this.total.innerText = fmtMs(totalMs);
    if (this.autosplitter.pb) {
      const amountBehind = totalMs - this.autosplitter.pb;
      if (amountBehind > 0) this.setTotalAhead(false);
    }
  }
  setTotalAhead(ahead) {
    this.total.classList.toggle("ahead", ahead);
    this.total.classList.toggle("behind", !ahead);
  }
  updateAttempts() {
    this.attemptsEl.innerText = this.autosplitter.attempts.toString();
  }
  remove() {
    this.element?.remove();
  }
};

// plugins/Autosplitter/src/ui/splits.ts
var SplitsUI = class extends BasicUI {
  constructor(autosplitter2, splitNames) {
    super(autosplitter2);
    this.autosplitter = autosplitter2;
    this.splitNames = splitNames;
    const table = document.createElement("table");
    if (this.autosplitter.data.showSplits) this.element.appendChild(table);
    for (const name of this.splitNames) {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td style="min-width: 120px;">${name}</td>
            <td style="min-width: 60px; ${this.autosplitter.data.showSplitTimes ? "" : "display: none"}"></td>
            <td style="min-width: 80px; ${this.autosplitter.data.showSplitComparisons ? "" : "display: none"}"></td>
            <td style="min-width: 60px; ${this.autosplitter.data.showSplitTimeAtEnd ? "" : "display: none"}"></td>`;
      this.splitRows.push(row);
      this.splitDatas.push(Array.from(row.children));
      table.appendChild(row);
    }
    if (this.autosplitter.data.showPbSplits) {
      for (let i = 0; i < this.autosplitter.pbSplits.length; i++) {
        const split = this.autosplitter.pbSplits[i];
        if (!split) continue;
        this.splitDatas[i][3].innerText = fmtMs(split);
      }
    }
    this.element.appendChild(this.total);
  }
  splitTimes = [];
  previousActiveRow = null;
  splitRows = [];
  splitDatas = [];
  activeSplit = null;
  setActiveSplit(index2) {
    if (index2 >= this.splitRows.length) {
      if (this.previousActiveRow) this.previousActiveRow.classList.remove("active");
      this.activeSplit = null;
      return;
    }
    if (this.previousActiveRow) this.previousActiveRow.classList.remove("active");
    this.splitRows[index2].classList.add("active");
    this.previousActiveRow = this.splitRows[index2];
    this.activeSplit = index2;
  }
  updateSplit(totalMs, splitIndex, splitMs) {
    this.splitDatas[splitIndex][1].innerText = fmtMs(splitMs);
    const pb = this.autosplitter.pbSplits?.[splitIndex];
    if (!pb) return;
    const amountBehind = totalMs - pb;
    if (amountBehind <= 0) {
      this.setTotalAhead(true);
      return;
    }
    if (this.autosplitter.data.showSplitComparisons) {
      this.splitDatas[splitIndex][2].innerText = `+${fmtMs(amountBehind)}`;
      this.splitDatas[splitIndex][2].classList.add("behind");
    }
    this.setTotalAhead(false);
  }
  finishSplit(totalMs, splitIndex, splitMs) {
    const els = this.splitDatas[splitIndex];
    els[3].innerText = fmtMs(totalMs);
    const pb = this.autosplitter.pbSplits[splitIndex];
    const bestSplit = this.autosplitter.bestSplits[splitIndex];
    if (!pb || !bestSplit) return;
    const ahead = pb === void 0 || totalMs <= pb;
    const best = bestSplit !== void 0 && splitMs < bestSplit;
    if (ahead) els[2].innerText = `-${fmtMs(-totalMs + pb)}`;
    else els[2].innerText = `+${fmtMs(totalMs - pb)}`;
    if (best) els[2].classList.add("best");
    else if (ahead) els[2].classList.add("ahead");
    else els[2].classList.add("behind");
  }
};

// plugins/Autosplitter/src/ui/DLD.ts
function addDLDUI(element, autosplitter2) {
  const topBar = element.querySelector(".bar");
  const categorySelect = document.createElement("select");
  topBar.firstChild.before(categorySelect);
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.innerText = category;
    if (category === autosplitter2.category) option.selected = true;
    categorySelect.appendChild(option);
  }
  const runTypeBar = document.createElement("div");
  runTypeBar.classList.add("bar");
  const runTypeSelect = document.createElement("select");
  runTypeSelect.innerHTML = `<option value="Full Game">Full Game</option>`;
  for (let i = 0; i < DLDSplits.length; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.innerText = DLDSplits[i];
    if (autosplitter2.data.mode === "Summit" && autosplitter2.data.ilSummit === i) option.selected = true;
    runTypeSelect.appendChild(option);
  }
  runTypeBar.appendChild(runTypeSelect);
  const preboostSelect = document.createElement("select");
  preboostSelect.innerHTML = `
    <option value="false">No Preboosts</option>
    <option value="true">Preboosts</option>`;
  preboostSelect.value = String(autosplitter2.data.ilPreboosts);
  if (autosplitter2.category === "Current Patch") preboostSelect.disabled = true;
  categorySelect.addEventListener("change", () => {
    autosplitter2.setCategory(categorySelect.value);
    if (categorySelect.value === "Current Patch") {
      preboostSelect.value = "false";
      preboostSelect.disabled = true;
    } else {
      preboostSelect.disabled = false;
    }
  });
  if (runTypeSelect.value !== "Full Game") {
    runTypeBar.appendChild(preboostSelect);
  }
  runTypeSelect.addEventListener("change", () => {
    if (runTypeSelect.value === "Full Game") {
      preboostSelect.remove();
      autosplitter2.setMode("Full Game");
    } else {
      runTypeBar.appendChild(preboostSelect);
      autosplitter2.setMode("Summit", parseInt(runTypeSelect.value, 10), preboostSelect.value === "true");
    }
  });
  preboostSelect.addEventListener("change", () => {
    autosplitter2.setMode("Summit", parseInt(runTypeSelect.value, 10), preboostSelect.value === "true");
  });
  topBar.after(runTypeBar);
}
function lockInCategory(element, autosplitter2) {
  const selects = element.querySelectorAll("select");
  for (const select of selects) {
    select.disabled = true;
    select.title = "Cannot be altered mid-run";
  }
  const resetButton = document.createElement("button");
  resetButton.classList.add("restart");
  resetButton.innerHTML = restore_default;
  resetButton.addEventListener("click", () => {
    autosplitter2.reset();
  });
  element.firstChild?.firstChild?.before(resetButton);
}
var DLDFullGameUI = class extends SplitsUI {
  constructor(autosplitter2) {
    super(autosplitter2, DLDSplits);
    this.autosplitter = autosplitter2;
    addDLDUI(this.element, autosplitter2);
  }
  lockInCategory() {
    lockInCategory(this.element, this.autosplitter);
  }
};
var DLDSummitUI = class extends BasicUI {
  constructor(autosplitter2) {
    super(autosplitter2);
    this.autosplitter = autosplitter2;
    addDLDUI(this.element, autosplitter2);
  }
  lockInCategory() {
    lockInCategory(this.element, this.autosplitter);
  }
};

// plugins/Autosplitter/src/splitters/autosplitter.ts
var Autosplitter = class {
  constructor(id) {
    this.id = id;
    this.loadData();
    api.onStop(() => this.destroy());
  }
  data;
  loadData() {
    this.data = getGamemodeData(this.id);
  }
  save() {
    api.storage.setValue(`${this.id}Data`, this.data);
  }
  get attempts() {
    return this.data.attempts[this.getCategoryId()] ?? 0;
  }
  addAttempt() {
    this.data.attempts[this.getCategoryId()] = this.attempts + 1;
    this.save();
  }
};
var SplitsAutosplitter = class extends Autosplitter {
  get pb() {
    const pb = this.data.pb[this.getCategoryId()];
    return pb?.[pb.length - 1];
  }
  get pbSplits() {
    const categoryId = this.getCategoryId();
    if (!this.data.pb[categoryId]) this.data.pb[categoryId] = [];
    return this.data.pb[this.getCategoryId()];
  }
  get bestSplits() {
    const categoryId = this.getCategoryId();
    if (!this.data.bestSplits[categoryId]) this.data.bestSplits[categoryId] = [];
    return this.data.bestSplits[this.getCategoryId()];
  }
};

// plugins/Autosplitter/src/splitters/DLD.ts
var DLDAutosplitter = class extends SplitsAutosplitter {
  ui;
  timer;
  category = "Current Patch";
  couldStartLastFrame = true;
  loadedCorrectSummit = false;
  hasMoved = false;
  autoRecording = false;
  constructor() {
    super("DLD");
    this.category = "Current Patch";
    if (api.plugins.isEnabled("BringBackBoosts")) {
      const bbbSettings = GL.storage.getValue("BringBackBoosts", "QS-Settings", {});
      if (bbbSettings.useOriginalPhysics) {
        this.category = "Original Physics";
      } else {
        this.category = "Creative Platforming Patch";
      }
    }
    if (this.category === "Current Patch") {
      this.data.ilPreboosts = false;
    }
    this.updateTimerAndUI();
    onPhysicsStep(() => {
      const input = api.stores.phaser.scene.inputManager.getPhysicsInput();
      if (input.jump || input.angle !== null) this.hasMoved = true;
    });
    onFrame(() => {
      if (this.data.mode === "Full Game") this.updateFullGame();
      else if (this.data.ilPreboosts) this.updatePreboosts();
      else this.updateNoPreboosts();
      this.hasMoved = false;
    });
    const savestates = api.plugin("Savestates");
    if (savestates) {
      savestates.onStateLoaded(this.onStateLoadedBound);
    }
  }
  updateTimerAndUI() {
    this.ui?.remove();
    if (this.data.mode === "Full Game") {
      const ui = new DLDFullGameUI(this);
      this.ui = ui;
      this.timer = new SplitsTimer(this, ui);
    } else {
      const ui = new DLDSummitUI(this);
      this.ui = ui;
      this.timer = new BasicTimer(this, ui);
    }
  }
  getCategoryId() {
    if (this.data.mode === "Full Game") return this.category;
    if (this.data.ilPreboosts) return `${this.category}-${this.data.ilSummit}-preboosts`;
    return `${this.category}-${this.data.ilSummit}`;
  }
  setMode(mode, ilsummit, ilPreboosts) {
    if (this.category === "Current Patch") ilPreboosts = false;
    const modeChanged = this.data.mode !== mode;
    this.data.mode = mode;
    if (ilsummit !== void 0) this.data.ilSummit = ilsummit;
    if (ilPreboosts !== void 0) this.data.ilPreboosts = ilPreboosts;
    this.save();
    this.couldStartLastFrame = true;
    if (modeChanged) {
      this.updateTimerAndUI();
    } else {
      this.ui.updateAttempts();
    }
  }
  setCategory(name) {
    this.category = name;
    this.ui.updateAttempts();
  }
  ilState = "waiting";
  updatePreboosts() {
    const body = api.stores.phaser.mainCharacter.body;
    const coords = summitCoords[this.data.ilSummit];
    if (this.ilState === "waiting") {
      if (inArea(body, coords)) {
        if (this.couldStartLastFrame) return;
        this.ilState = "started";
        this.timer.start();
        this.onRunStart();
        this.timer.update();
      } else {
        this.couldStartLastFrame = false;
      }
    } else if (this.ilState === "started") {
      if (inArea(body, summitStartCoords[this.data.ilSummit + 1])) {
        this.ilState = "completed";
        this.couldStartLastFrame = true;
        this.onRunEnd();
      } else {
        this.timer.update();
      }
    }
  }
  updateNoPreboosts() {
    if (!this.loadedCorrectSummit) return;
    const body = api.stores.phaser.mainCharacter.body;
    if (this.ilState === "waiting") {
      if (this.hasMoved) {
        this.ilState = "started";
        this.timer.start();
        this.onRunStart();
        this.timer.update();
      }
    } else if (this.ilState === "started") {
      if (inArea(body, summitStartCoords[this.data.ilSummit + 1])) {
        this.ilState = "completed";
        this.onRunEnd();
      } else {
        this.timer.update();
      }
    }
  }
  summit = 0;
  updateFullGame() {
    const body = api.stores.phaser.mainCharacter.body;
    if (this.summit > 0 && body.x < resetCoordinates.x && body.y > resetCoordinates.y) {
      this.reset();
      return;
    }
    if (this.summit > summitStartCoords.length - 1) return;
    if (this.summit === 0) {
      if (body.x > summitStartCoords[0].x && body.y < summitStartCoords[0].y + 10) {
        if (this.couldStartLastFrame) return;
        this.summit = 1;
        this.timer.start();
        this.onRunStart();
      } else {
        this.couldStartLastFrame = false;
      }
    } else if (inArea(body, summitStartCoords[this.summit])) {
      this.summit++;
      this.timer.split();
      if (this.summit > summitStartCoords.length - 1) {
        this.onRunEnd();
      }
    }
    this.timer.update();
  }
  getRecorder() {
    const inputRecorder = api.plugin("InputRecorder");
    if (!inputRecorder) return;
    return inputRecorder.getRecorder();
  }
  onRunStart() {
    this.addAttempt();
    this.ui.updateAttempts();
    this.ui.lockInCategory();
    if (!this.data.autoRecord) return;
    const recorder = this.getRecorder();
    if (!recorder) return;
    if (recorder.recording || recorder.playing) return;
    recorder.startRecording();
    this.autoRecording = true;
  }
  onRunEnd() {
    this.timer.stop();
    if (!this.data.autoRecord) return;
    const recorder = this.getRecorder();
    if (!recorder) return;
    if (!recorder.recording || recorder.playing || !this.autoRecording) return;
    this.autoRecording = false;
    const isPb = !this.pb || this.timer.elapsed < this.pb;
    if (!isPb) return;
    const username = api.stores.phaser.mainCharacter.nametag.name;
    let mode = "Full Game";
    if (this.data.mode !== "Full Game") {
      mode = `Summit ${this.data.ilSummit + 1}`;
      if (this.data.ilPreboosts) mode += " (Preboosts)";
    }
    const time = fmtMs(this.timer.elapsed);
    recorder.stopRecording(isPb, `recording-${username}-${this.category}-${mode}-${time}.json`);
    api.UI.notification.open({ message: `Auto-saved PB of ${time}`, placement: "topLeft" });
  }
  onStateLoaded(summit) {
    if (summit === "custom") return;
    if (this.data.autostartILs) {
      if (summit === 1 && this.data.mode === "Full Game") return;
      this.setMode("Summit", summit - 1);
      this.reset();
      if (!this.data.ilPreboosts) this.loadedCorrectSummit = true;
      return;
    }
    if (this.data.mode === "Full Game") return;
    if (this.data.ilPreboosts) return;
    if (this.ilState !== "waiting") {
      this.reset();
    }
    this.loadedCorrectSummit = summit === this.data.ilSummit + 1;
  }
  onStateLoadedBound = this.onStateLoaded.bind(this);
  reset() {
    this.updateTimerAndUI();
    this.summit = 0;
    this.ilState = "waiting";
    this.couldStartLastFrame = true;
    this.loadedCorrectSummit = false;
    const recorder = this.getRecorder();
    if (recorder?.recording && this.autoRecording) {
      recorder.stopRecording(false);
    }
  }
  destroy() {
    this.ui.remove();
    const savestates = api.plugin("Savestates");
    if (savestates) {
      savestates.offStateLoaded(this.onStateLoadedBound);
    }
  }
};

// plugins/Autosplitter/src/splitters/fishtopia.ts
var FishtopiaAutosplitter = class extends SplitsAutosplitter {
  ui = new SplitsUI(this, fishtopiaSplits);
  timer = new SplitsTimer(this, this.ui);
  usedChannels = /* @__PURE__ */ new Set();
  constructor() {
    super("Fishtopia");
    const gameSession = api.net.room.state.session.gameSession;
    api.net.room.state.session.listen("loadingPhase", (val) => {
      if (val) return;
      if (gameSession.phase === "game") {
        this.addAttempt();
        this.ui.updateAttempts();
        this.timer.start();
      }
    });
    gameSession.listen("phase", (phase) => {
      if (phase === "results") {
        this.reset();
      }
    });
    api.net.on("send:MESSAGE_FOR_DEVICE", (e) => {
      const id2 = e.deviceId;
      if (!id2) return;
      const device = api.stores.phaser.scene.worldManager.devices.getDeviceById(id2);
      const channel = device?.options?.channel;
      if (!channel) return;
      if (!boatChannels.includes(channel)) return;
      if (this.usedChannels.has(channel)) return;
      this.usedChannels.add(channel);
      api.net.once("PHYSICS_STATE", (e2) => {
        if (e2.teleport) {
          this.timer.split();
        }
      });
    });
    const id = api.stores.phaser.mainCharacter.id;
    api.net.room.state.characters.get(id).inventory.slots.onChange((_, key2) => {
      if (key2 === "gim-fish") {
        this.timer.split();
        this.timer.stop();
      }
    });
    onFrame(() => {
      this.timer.update();
    });
  }
  getCategoryId() {
    return "fishtopia";
  }
  reset() {
    this.ui?.remove();
    this.ui = new SplitsUI(this, fishtopiaSplits);
    this.timer = new SplitsTimer(this, this.ui);
    this.usedChannels.clear();
  }
  destroy() {
    this.ui.remove();
  }
};

// plugins/Autosplitter/src/ui/oneWayOut.ts
var OneWayOutUI = class extends SplitsUI {
  constructor(autosplitter2) {
    super(autosplitter2, oneWayOutSplits);
    this.autosplitter = autosplitter2;
  }
};

// plugins/Autosplitter/src/splitters/OneWayOut.ts
var OneWayOutAutosplitter = class extends SplitsAutosplitter {
  ui = new OneWayOutUI(this);
  timer = new SplitsTimer(this, this.ui);
  stage = 0;
  constructor() {
    super("OneWayOut");
    const gameSession = api.net.room.state.session.gameSession;
    api.net.on("DEVICES_STATES_CHANGES", (msg) => {
      for (const change of msg.changes) {
        if (msg.values[change[1][0]] === "GLOBAL_healthPercent") {
          const device = api.stores.phaser.scene.worldManager.devices.getDeviceById(change[0]);
          if (device?.propOption.id === "barriers/scifi_barrier_1" && change[2][0] === 0) {
            this.addAttempt();
            this.ui.updateAttempts();
            this.timer.start();
          }
        }
      }
    });
    gameSession.listen("phase", (phase) => {
      if (phase === "results") {
        this.reset();
      }
    });
    api.net.on("send:MESSAGE_FOR_DEVICE", (e) => {
      const id = e?.deviceId;
      if (!id) return;
      const device = api.stores.phaser.scene.worldManager.devices.getDeviceById(id);
      const channel = device?.options?.channel;
      if (!channel) return;
      if (channel === "escaped") {
        setTimeout(() => this.timer.split(), 800);
      }
    });
    onFrame(() => {
      this.timer.update();
      if (stageCoords[this.stage]) {
        const body = api.stores.phaser.mainCharacter.body;
        if (inBox(body, stageCoords[this.stage])) {
          this.stage++;
          this.timer.split();
        }
      }
    });
  }
  getCategoryId() {
    return "OneWayOut";
  }
  reset() {
    this.ui?.remove();
    this.ui = new OneWayOutUI(this);
    this.timer = new SplitsTimer(this, this.ui);
    this.stage = 0;
  }
  destroy() {
    this.ui.remove();
  }
};

// plugins/Autosplitter/src/styles.scss
var styles_default = `#timer {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  z-index: 99;
}
#timer.top {
  top: 0;
}
#timer.bottom {
  bottom: 0;
}
#timer.left {
  left: 0;
}
#timer.right {
  right: 0;
}
#timer .restart {
  background-color: transparent;
  border: none;
  width: 20px;
  height: 20px;
  margin: 0;
  padding: 0;
}
#timer .restart svg {
  width: 20px;
  height: 20px;
}
#timer .bar {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  gap: 10px;
}
#timer select {
  background: transparent;
  appearance: auto;
  padding: 0;
}
#timer option {
  background-color: black;
}
#timer .runType {
  padding-left: 10px;
}
#timer table {
  width: 100%;
}
#timer tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.12);
}
#timer tr.active {
  background-color: rgba(28, 145, 235, 0.864);
}
#timer td:first-child {
  padding-left: 10px;
}
#timer .attempts {
  flex-grow: 1;
  text-align: right;
}
#timer .total {
  font-size: xx-large;
  width: 100%;
  text-align: right;
  padding-right: 10px;
}
#timer .ahead {
  color: green;
}
#timer .behind {
  color: red;
}
#timer .best {
  color: gold;
}`;

// external-svelte:svelte
var mount = /* @__PURE__ */ (() => GL.svelte_5_43_0.Index.mount)();

// plugins/Autosplitter/src/index.ts
api.UI.addStyles(styles_default);
var autosplitter;
api.net.onLoad((_, gamemode) => {
  if (gamemode === "dontlookdown") {
    autosplitter = new DLDAutosplitter();
  } else if (gamemode === "fishtopia") {
    autosplitter = new FishtopiaAutosplitter();
  } else if (gamemode === "onwWayout") {
    autosplitter = new OneWayOutAutosplitter();
  }
});
api.openSettingsMenu(() => {
  const div = document.createElement("div");
  const settings = mount(Settings, { target: div });
  api.UI.showModal(div, {
    title: "Manage Autosplitter data",
    buttons: [{ text: "Close", style: "close" }],
    id: "Autosplitter Settings",
    style: "min-width: min(600px, 90%);",
    closeOnBackgroundClick: false,
    onClosed: () => {
      settings.save();
      autosplitter?.loadData();
      autosplitter?.reset();
    }
  });
});
