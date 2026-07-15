# Troubleshooting

## Browser review unavailable

Implannotator returns a text-review request. Present the plan or diff evidence in chat and record the explicit decision. Low-risk continuation is not automatic unless enabled.

## Duplicate browser tabs

A standalone Plannotator package and Implannotator's bundled Plannotator may both be loaded. Disable the standalone package entry for this session/project.

## Run interrupted

Use `/implannotator status` then `/implannotator resume`. Inspect `.implannotator/runs/<run-id>/run.json` and do not repeat completed mutations.

## Mutation blocked

The plan has not been approved, the path is outside the active project, or the command is unsafe Git automation. Complete the approval step or perform the action manually outside the workflow after reviewing the risk.
