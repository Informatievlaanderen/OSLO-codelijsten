# OSLO-codelijsten

This repository serves as the frontend application for the codelijsten under https://data.vlaanderen.be/conceptscheme.
It is built using [Nuxt 3](https://nuxt.com/) and uses the design system libraries from the Flemish government: `@govflanders/vl-ui-design-system-style` and `@govflanders/vl-ui-design-system-vue3`.

```json
"@govflanders/vl-ui-design-system-style"
"@govflanders/vl-ui-design-system-vue3"
```

## Build Setup

```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn run dev

# build for production and launch server
$ yarn run build
$ yarn run start
```

For detailed explanation on how things work, check out the [documentation](https://nuxt.com/docs)

## Special Directories

You can create the following extra directories, some of which have special behaviors. Only `pages` is required; you can delete them if you don't want to use their functionality.

### `assets`

The assets directory contains your uncompiled assets such as Stylus or Sass files, images, or fonts.

More information about the usage of this directory in [the documentation](https://nuxt.com/docs/getting-started/assets#assets).

### `components`

The components directory contains your Vue.js components. Components make up the different parts of your page and can be reused and imported into your pages, layouts and even other components.

### `pages`

This directory contains your application views and routes. Nuxt will read all the `*.vue` files inside this directory and setup Vue Router automatically.

More information about the usage of this directory in [the documentation](https://nuxt.com/docs/guide/directory-structure/pages/#pages-directory).

### `plugins`

The plugins directory contains JavaScript plugins that you want to run before instantiating the root Vue.js Application. This is the place to add Vue plugins and to inject functions or constants. Every time you need to use `Vue.use()`, you should create a file in `plugins/` and add its path to plugins in `nuxt.config.ts`.

More information about the usage of this directory in [the documentation](https://nuxt.com/docs/guide/directory-structure/plugins#plugins-directory).

### `css`

The css directory contains your custom imported css or Sass files. We use this to import the custom styling from the `@govflanders/vl-ui-design-system-style` library. you should create a file in `css/` and add its path to css in `nuxt.config.ts`.

### `types`

Custom directory that contains our customly defined typescript config files. Can be used shorthandedly in your code:

```typescript
import type { NavigationMenu } from '~/types/navigationMenu'
```

## Special files

### .npmrc

This file serves as a config file, specifically for npm. We use this file to store our required tokens for the private npm repositoires such as `@govflanders/vl-ui-design-system-style` and `@govflanders/vl-ui-design-system-vue3`. More information about this file can be found in [the documentation](https://docs.npmjs.com/cli/v9/configuring-npm/npmrc).

In this file, we mention a secret authentication token.

```
registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

This is a secret token that needs to exist in your own session. If you try installing the dependencies without this token present, it will not work. You can set a token using the command below, where `NPM_TOKEN` contains the actual token. For more information, please read this [stackoverflow issue](https://stackoverflow.com/questions/53099434/using-auth-tokens-in-npmrc/61666885#61666885).

```bash
export NPM_TOKEN="${NPM_TOKEN}"
```

### .env

This file serves as a secret file to contain all our API-keys, tokens,... that we don't want to expose to the outside world. This file should **never** be added inside the repository for security purposes. In the `.env.example` file, you can see which tokens and API-keys are required to run this project. Place the actual values inside the `.env` folder on your local device.

#### passing env variables to the frontend

Since Vue `3.x`, nuxt uses [Vite](https://vitejs.dev/guide/why.html) as its preferred bundler over [Webpack](https://webpack.js.org/). This means that environment variables are passed in a different manner from the backend to the frontend. You can access the environment variables by using

```js
import.meta.env.VITE_ENVIRONMENT
```

> Only variables using the `VITE_` prefix are passed to the frontend. **Never** pass secret variables, such as API-tokens to the frontend as these will be up for grabs

## Developer tools

### Prettier

For code formatting purposes, we use a tool called [Prettier](https://prettier.io/). Prettier is a handy tool that can be used to streamline code-formatting across a development team. In this repository, you can find a specific configuration file for this tool called `.prettierrc` which contains our ruleset. This set can be extended based on the project's needs. Don't forget to install Prettier itself in your IDE to get the full effect of this tool.

### ESLint

ESlint is a linting tool that will try and find problems with your JavaScript/TypeScript code as you are writing it. This will help minimize any potential bugs in our production code. For this tool, there is a separate configuration file called `eslintrc.ts` that contains the ruleset we want to enforce. This ruleset can be extended with any amount of rules that can be found [here](https://eslint.org/docs/latest/rules/). Don't forget to install ESlint itself in your IDE to get the full effect of this tool.
