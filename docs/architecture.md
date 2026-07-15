# Architecture

One Pi package exposes two resources:

- `skills/implannotator/`: the complete namespaced design skill and mandatory workflow contract.
- `extensions/index.ts`: commands, control tool, approval gate, state machine, audit storage, QA contracts, and Plannotator adapter.

The package bundles `@plannotator/pi-extension` and communicates only through its documented `plannotator:request` event channel. It does not import private browser/server modules.

State is persisted atomically under `.implannotator/runs/<run-id>/`. The workflow is resumable and illegal state transitions are rejected.

The extension enforces pre-approval mutation blocking for built-in write/edit/shell tools. The skill requires the main agent to be the sole writer; optional subagents are read-only reviewers.
