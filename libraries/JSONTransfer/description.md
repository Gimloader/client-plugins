JSONTransfer is a small library to handle uploading and downloading JSON from the user's disk.

## Usage

```js
/**
 * @needsLib JSONTransfer | https://raw.githubusercontent.com/Gimloader/builds/main/libraries/JSONTransfer.js
 */

const { uploadJson, downloadJson } = api.lib("JSONTransfer");

function downloadUser() {
    const user = {
        id: "234432",
        name: "John Doe"
    };

    // This downloads as `myUser.json`
    downloadJson(user, "myUser");
}

function uploadUser() {
    const [user, fileName] = uploadJson();

    console.log(`You uploaded the user ${user} from a file called ${fileName}.`);
}
```