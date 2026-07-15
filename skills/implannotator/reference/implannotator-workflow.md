# Implannotator workflow

This workflow is mandatory for every implementation, including small changes. Approval may not be silently skipped.

## 1. Start and inspect

Call `implannotator_control` with:

- `action: "start"`
- the selected command and target
- conservative risk (`low`, `medium`, or `high`)
- adaptive QA result (`quick`, `standard`, or `full`)

Inspect the repository, product context, design system, current surface, Git status, project commands, and relevant browser state without editing. Preserve all pre-existing user work.

## 2. Plan

Write a concrete plan containing:

- Intent and user outcome
- Files and components expected to change
- Existing patterns to reuse
- Design direction and deliberate choices
- Responsive and interaction behavior
- Accessibility requirements
- Loading, empty, error, and long-content states
- Implementation tasks in order
- QA profile and checks
- Risks, assumptions, and non-goals
- Rollback or safe-stop approach

Submit the plan through `implannotator_control` with `action: "submit_plan"`. Wait for browser approval or the documented text fallback. No edits, writes, package installations, generators, or mutating shell commands are allowed before approval.

## 3. Implement

After approval, call `action: "begin_implementation"`. The main agent is the sole writer. Optional subagents may inspect, critique, test, or review but must not modify the same worktree.

Do not automatically stash, reset, clean, restore, checkout, switch, commit, merge, rebase, or push. Do not overwrite unrelated changes. Keep a changed-file inventory.

## 4. Adaptive QA

Follow [qa.md](qa.md). Record every required check as `passed`, `failed`, `unavailable`, or `not-applicable`, with evidence. Unavailable is not passed. Use `action: "record_qa"` with a schema-versioned JSON report.

## 5. Initial review

After QA passes, call `action: "review", stage: "initial"`. Convert feedback and annotations into a repair backlog. If rejected or closed, ask: Revise, Proceed anyway, or Stop. Proceed anyway requires a second warning.

## 6. Repair loop

Run at most three repair cycles:

1. Fix the current backlog.
2. Call `action: "record_repair"` with a concise summary.
3. Rerun the selected QA profile.
4. Call `action: "record_qa"`.

Do **not** open Plannotator during intermediate repairs.

## 7. Final review

After automated checks pass, or after the third repair, call `action: "review", stage: "final"` exactly once. Completion requires approval or an explicit, warned override. Report the audit directory and any residual risk.

## Resume

Use `/implannotator status` and `/implannotator resume`. Read `.implannotator/runs/<run-id>/run.json`, plan, decisions, QA report, reviews, and repairs before continuing. Never repeat an already completed mutation or open a duplicate review tab.
