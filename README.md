# Implannotator

`@yoseph_23/implannotator` is a cross-platform Pi package for production-grade frontend work with mandatory plan approval, adaptive browser QA, Plannotator code review, bounded repairs, and resumable audit records.

## Status

Early development release. Public publishing is intentionally blocked until redistribution rights for the adapted design-guidance snapshot are confirmed.

## Install locally

```bash
cd <path-to-repository>/implannotator
npm install
pi install .
```

Restart Pi or run `/reload`, then use:

```text
/implannotator
/implannotator craft <target>
/implannotator audit <target>
/implannotator status
/implannotator resume
/implannotator review
/implannotator verify
/implannotator config
/implannotator update-check
```

The skill may also be selected automatically for frontend design and implementation requests.

## Workflow

1. Inspect the project without mutation.
2. Draft a complete plan.
3. Approve it in Plannotator or through the text fallback.
4. Implement as the sole writer.
5. Run adaptive Quick, Standard, or Full QA.
6. Open the initial code review.
7. Repair up to three times without reopening intermediate browser tabs.
8. Open one final review.
9. Complete only after approval or an explicit warned override.

Audit records are written to `.implannotator/runs/<run-id>/`. The package never automatically stashes, resets, commits, or pushes.

## Configuration

Configuration merges in this order:

1. Built-in defaults
2. `~/.pi/agent/implannotator.json`
3. `<project>/.pi/implannotator.json`

Low-risk automatic approval is disabled by default. See [docs/configuration.md](docs/configuration.md).

## Development

```bash
npm run typecheck
npm run lint
npm test
npm run test:compat
npm run verify:snapshot
npm run pack:check
```

See [docs/architecture.md](docs/architecture.md), [docs/workflow.md](docs/workflow.md), [docs/qa.md](docs/qa.md), and [docs/security.md](docs/security.md).
