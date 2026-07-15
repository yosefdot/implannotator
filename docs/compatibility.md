# Compatibility

- Node.js 20 or newer
- Pi 0.80.7 or newer (security baseline)
- `@plannotator/pi-extension` compatible with `^0.23.1`

`npm run test:compat` checks the installed Plannotator public event contract. `npm run update-check` reports newer releases without modifying dependencies. CI tests supported Node versions on Linux, macOS, and Windows.

If a separately installed Plannotator extension causes duplicate listeners or tabs, disable that package entry while using Implannotator's bundled instance.
