export interface Option {
    name: string;
    preview: {
        type: string;
        color: string;
    };
}

export interface ColorCategory {
    type: "color";
    name: string;
    color: {
        defaultColor: string;
    };
}

export interface OptionsCategory {
    type: undefined;
    name: string;
    options: Option[];
}

export type Category = ColorCategory | OptionsCategory;
