# foundry-chromatic-dungeons

An implementation of the OSR TTRPG system, [Chromatic Dungeons](https://izegrimcreations.com/gaming-related). You can buy the core game from [DriveThruRPG](https://www.drivethrurpg.com/product/352086/Chromatic-Dungeons-RPG).

**Note**: While this system should be in a functional state, there is still [plenty left to do](docs/todo.md). 

## Installation
The easiest way to install this system is from the Foundry UI; navigate to the Systems tab from your config screen, click on "Install System" at the bottom of the view, and then search for Chromatic Dungeons.

You can grab the latest build of this system by pasting the following into your system installation dialog in Foundry:

```
https://github.com/wyrmisis/foundry-chromatic-dungeons/releases/latest/download/system.json
```

## Development

After cloning this repo to your `{user-data}/systems` folder, you can get started by running the following:

```
npm i && npm start
```

This will run `rollup` and `postcss` concurrently. If you add the [Development Mode](https://github.com/League-of-Foundry-Developers/foundryvtt-devMode) module, you'll even have Livereload!

See [the `post-css` config file](./postcss.config.js) for the currently in-use plugins. 


### Building

With all dependencies installed, run `npm run build` to build the JS bundle, in both expanded and minified variants, as well as the minified CSS. These bundles will be placed in `dist/`. This will also copy `src/assets` and `src/templates` to `dist/`.

## License
All code written in this repository is licensed under the [MIT](https://choosealicense.com/licenses/mit/) license.

All rules and data specific to the Chromatic Dungeons RPG are licensed under the [Open Game License, v1](packs/LICENSE).
