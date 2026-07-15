# Installation

Implannotator and Plannotator are separate Pi packages that cooperate through Plannotator's public event API.

```bash
pi install npm:@plannotator/pi-extension
pi install npm:implannotator
```

Restart Pi or run `/reload`. Use `/implannotator` to begin.

## Why two packages?

Pi loads separately installed packages from independent module roots. Bundling and statically loading Plannotator inside Implannotator while also installing Plannotator directly registers the same tools, commands, and `--plan` flag twice. Implannotator reuses the one active companion and never loads a duplicate.

## Without Plannotator

Implannotator remains usable with mandatory text approval. It shows a session warning and status indicator until the companion is installed or enabled.

## Migrate from the scoped package

The original releases used `@yoseph_23/implannotator`. Version-pinned Pi packages do not update automatically, and npm treats the unscoped name as a separate package. Remove the scoped installation and install the canonical unscoped package:

```bash
pi remove npm:@yoseph_23/implannotator@0.1.1
pi install npm:@plannotator/pi-extension
pi install npm:implannotator
```

If a different scoped version is installed, use the exact source shown by `pi list` in the remove command.
