# Gimloader Client Plugins

These are the official plugins made for Gimloader. You can find a list of them as well as a button to download them with at https://gimloader.github.io/plugins/.

## Development

To set up your environment, clone this repository and download [Bun](https://bun.com/). Then, run `bun install` wherever you cloned it.

### Structure

Despite the name, this repository hosts both plugins and libraries. The source code for them can be found in the [/plugins](/plugins/) and [/libraries](/libraries/) directories respectively. Things in the build directory are automatically generated and should not be manually edited.

### Editing scripts

This repository uses the [Gimloader build tools](https://github.com/Gimloader/build) to generate the final code. After editing a script, run `bun run build [script name]` to rebuild it, which updates the respective file in the build directory. To have the script automatically rebuild when changes are made, run `bun run serve [script name]` (you can also supply the -m argument to only rebuild when pressing enter in the terminal). `bun run serve` has the additional benefit of automatically updating the script in your Gimloader extension if "Poll for plugins/libraries being served locally" is enabled.

### Adding a script

If you want to add a new script, create a new subdirectory inside /plugins or /libraries with the files `gimloader.config.ts` and `src/index.ts` in it. See the [build tools readme](https://github.com/Gimloader/build) or look at other scripts for information on what to include in the `gimloader.config.ts` file.

Official plugins must follow Gimkit's statement on modding. Do not add a plugin here that
- gives an advantage over other players (that isn't just quality of life)
- bypasses paywalls
- spams Gimkit server

### Before committing

Before committing your changes, run `bun run format` to format the code. Then, run `bun run check` to confirm that code is linted and without type errors.
