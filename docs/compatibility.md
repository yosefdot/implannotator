# Compatibility

- Node.js 20 or newer
- Pi 0.80.7 or newer (security baseline)
- Companion Pi package `@plannotator/pi-extension` compatible with `^0.23.1`

`npm run test:compat` checks the installed Plannotator public event contract. `npm run update-check` reports newer releases without modifying dependencies. CI tests supported Node versions on Linux, macOS, and Windows.

Install the companion once with `pi install npm:@plannotator/pi-extension`. Implannotator does not bundle or register another copy, so it can coexist with the standalone extension without duplicate tools, commands, flags, listeners, or tabs. If the companion is disabled or missing, Implannotator reports that state and uses text approval fallback.
