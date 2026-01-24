api.settings.create([
    {
        id: "name",
        type: "text",
        title: "Name",
        description: "The name that is automatically joined with",
        maxLength: 20
    }
]);

const localStorageName = "play-again-last-used-name";

api.settings.listen("name", name => {
    localStorage.setItem(localStorageName, name);
}, true);

api.onStop(() => localStorage.removeItem(localStorageName));
