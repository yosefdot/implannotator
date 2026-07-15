# Troubleshooting

## Browser review unavailable

Implannotator returns a text-review request. Present the plan or diff evidence in chat and record the explicit decision. Low-risk continuation is not automatic unless enabled.

## Plannotator companion not active

Install or enable the companion with `pi install npm:@plannotator/pi-extension`, then restart Pi or run `/reload`. The canonical unscoped `implannotator` package and scoped `@yoseph_23/implannotator` 0.1.1 do not bundle a second copy. Scoped version 0.1.0 should be removed because it can register duplicate tools and flags.

## Run interrupted

Use `/implannotator status` then `/implannotator resume`. Inspect `.implannotator/runs/<run-id>/run.json` and do not repeat completed mutations.

## Mutation blocked

The plan has not been approved, the path is outside the active project, or the command is unsafe Git automation. Complete the approval step or perform the action manually outside the workflow after reviewing the risk.
