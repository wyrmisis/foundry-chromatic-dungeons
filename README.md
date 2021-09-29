# foundry-chromatic-dungeons

![Repository License](https://img.shields.io/github/license/wyrmisis/foundry-chromatic-dungeons) ![Supported Foundry Versions](https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https://github.com/wyrmisis/foundry-chromatic-dungeons/releases/download/0.0.1/system.json) ![Latest Release Download Count](https://img.shields.io/github/downloads/wyrmisis/foundry-chromatic-dungeons/latest/module.zip)

An implementation of the OSR TTRPG system, Chromatic Dungeons (https://izegrimcreations.com/gaming-related).

**Note**: While this system should be in a functional state, there is still [plenty left to do](docs/todo.md). 

## Installation
You can grab the latest build of this system by pasting the following into your system installation dialog in Foundry:

```
https://github.com/wyrmisis/foundry-chromatic-dungeons/releases/latest/download/module.json
```

## Development

After cloning this repo to your `{user-data}/systems` folder, you can get started by running the following:

```
npm i
npm run watch:js
```

In a separate terminal window/tab, you can watch the CSS with `post-css` by running the following:

```
npm run watch:css
```

See [the `post-css` config file](./postcss.config.js) for the currently in-use plugins. 


### Building

With all dependencies installed, run `npm run build` to build the JS bundle, in both expanded and minified variants, as well as the minified CSS. These bundles will be placed in `dist/`. This will also copy `src/assets` and `src/templates` to `dist/`.

## License
[MIT](https://choosealicense.com/licenses/mit/)