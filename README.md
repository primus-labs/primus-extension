# Primus Browser Extension Fork

![Primus extension logo](src/assets/img/logo.png)

This repository is the Primus extension fork used by Kaito Pulse. It originates
from the Primus/PADO browser-extension codebase and is distributed under the
terms in [LICENSE](LICENSE).

## Features

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/)
- [React 18](https://reactjs.org)
- [Webpack 5](https://webpack.js.org/)
- [Webpack Dev Server 4](https://webpack.js.org/configuration/dev-server/)
- [React Refresh](https://www.npmjs.com/package/react-refresh)
- [react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin)
- [eslint-config-react-app](https://www.npmjs.com/package/eslint-config-react-app)
- [Prettier](https://prettier.io/)
- [TypeScript](https://www.typescriptlang.org/)

## Installing and Running

### Procedures

1. Use Node.js **22.23.1** and pnpm **9.10.0**.
2. Clone this [repository](https://github.com/OpenKaito/primus-extension-fork.git).
3. Run `pnpm install --frozen-lockfile`.
4. Run `pnpm start`.
5. Load the extension in Chrome:
   1. Access `chrome://extensions/`
   2. Check `Developer mode`
   3. Click on `Load unpacked extension`
   4. Select the `build` folder.

## Structure

All your extension's code must be placed in the `src` folder.

## Packing

After the development of your extension run the command

```shell
pnpm build
```

The `build` folder then contains the unpacked extension output.
