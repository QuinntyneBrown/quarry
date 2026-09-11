# @quinntyne/cornerstone-design-system

The authoritative Cornerstone token sources. This package has no runtime dependency
on Angular, the component library, or any application.

From the repository root, run `npm run build:tokens` and `npm run test:tokens`.
Create a distributable archive with `npm pack ./dist/design-system-tokens`.
From this directory, `npm run build` and `npm test` run the same independent tasks.

CSS consumers import `@quinntyne/cornerstone-design-system/tokens.css`. Sass consumers use
`@use '@quinntyne/cornerstone-design-system/tokens.scss'`. Both expose the `--cs-*` properties
for the light and dark themes. Edit `styles/_token-values.scss` to change tokens.

The UI package copies these sources into its built package, preserving existing
`@quinntyne/cornerstone/styles/tokens.scss` and theme imports without a second installation.
Generated distribution files must not be edited or committed.
