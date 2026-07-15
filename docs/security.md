# Security and work preservation

- Pi packages execute with the user's permissions; inspect package source before installation.
- Project mutation is blocked until plan approval during an active run.
- Writes outside the project are blocked during active runs.
- Automatic Git stash, reset, clean, restore, checkout, switch, commit, merge, rebase, and push are blocked.
- Existing dirty work is preserved and reported.
- Audit records and screenshots may contain private product information. They use restrictive local file permissions where supported and should not be committed unless deliberately reviewed.
- `allowLowRiskAutoApprove` is opt-in and applies only when interactive approval is unavailable.
- Public npm publishing is blocked until third-party redistribution rights are acknowledged explicitly.
