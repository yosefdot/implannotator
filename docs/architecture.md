# Architecture

One Pi package exposes two resources:

- `skills/implannotator/`: the complete namespaced design skill and mandatory workflow contract.
- `extensions/index.ts`: commands, control tool, approval gate, state machine, audit storage, QA contracts, and Plannotator adapter.

The package reuses a separately installed `@plannotator/pi-extension` companion and communicates only through its documented `plannotator:request` event channel. It neither bundles nor statically loads a second Plannotator extension, and it does not import private browser/server modules. Session startup detects the companion's public tool/command registration; when absent, the workflow uses mandatory text approval fallback.

State is persisted atomically under `.implannotator/runs/<run-id>/`. The workflow is resumable and illegal state transitions are rejected.

The extension enforces pre-approval mutation blocking for built-in write/edit/shell tools. The skill requires the main agent to be the sole writer; optional subagents are read-only reviewers.
