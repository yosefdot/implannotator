# Workflow

The durable state machine is:

```text
inspecting -> planning -> awaiting plan review -> approved -> implementing
-> QA -> initial review -> repair/QA (up to 3) -> final review -> complete
```

Rejection or close offers Revise, Proceed anyway, or Stop. Proceed anyway requires a second warning and creates a durable override decision. Browser-unavailable sessions use text approval; conservative low-risk auto-approval is disabled by default.

Review cadence is fixed: one plan tab, one initial code-review tab, no intermediate repair tabs, and one final code-review tab.
