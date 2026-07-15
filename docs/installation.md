# Installation

Implannotator and Plannotator are separate Pi packages that cooperate through Plannotator's public event API.

```bash
pi install npm:@plannotator/pi-extension
pi install npm:@yoseph_23/implannotator
```

Restart Pi or run `/reload`. Use `/implannotator` to begin.

## Why two packages?

Pi loads separately installed packages from independent module roots. Bundling and statically loading Plannotator inside Implannotator while also installing Plannotator directly registers the same tools, commands, and `--plan` flag twice. Implannotator 0.1.1 avoids that conflict by loading only its own extension and reusing the one active companion.

## Without Plannotator

Implannotator remains usable with mandatory text approval. It shows a session warning and status indicator until the companion is installed or enabled.

## Upgrade from 0.1.0

Version-pinned Pi packages do not update automatically. Replace the pinned release:

```bash
pi remove npm:@yoseph_23/implannotator@0.1.0
pi install npm:@plannotator/pi-extension
pi install npm:@yoseph_23/implannotator@0.1.1
```
