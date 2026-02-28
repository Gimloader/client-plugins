import { oneWayOutSplits } from "../constants";
import type { SplitsAutosplitter } from "../splitters/autosplitter";
import SplitsUI from "./splits";

export class OneWayOutUI extends SplitsUI {
    constructor(public autosplitter: SplitsAutosplitter) {
        super(autosplitter, oneWayOutSplits);
    }
}
