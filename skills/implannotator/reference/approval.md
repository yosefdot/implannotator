# Approval and fallback policy

## Browser available

Use Plannotator for plan approval, initial code review, and final code review.

## Browser unavailable

Use text approval. Present the complete plan or review evidence in chat and ask the user to choose:

1. Approve
2. Revise
3. Proceed anyway
4. Stop

Record the result using `implannotator_control` with `action: "text_decision"` and the pending stage.

`Proceed anyway` must not be inferred. Warn that it overrides a mandatory gate, then ask the user to confirm with the exact phrase `PROCEED WITHOUT APPROVAL`. Only after the user sends that phrase may you call the tool with `warned: true` and `confirmation: "PROCEED WITHOUT APPROVAL"`. The audit record must include the reason.

## Low-risk automatic continuation

Disabled by default. It is allowed only when `approval.allowLowRiskAutoApprove` is explicitly `true`, the workflow classified the change as low-risk, and browser/dialog UI is unavailable. Persist the classification and reason. Never auto-approve medium/high-risk work.

## Rejection or close

Do not treat close as approval. Ask whether to revise, proceed anyway, or stop. Preserve the run for resume when stopped.
