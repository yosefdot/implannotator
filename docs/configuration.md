# Configuration

Create `~/.pi/agent/implannotator.json` for global defaults or `.pi/implannotator.json` in a project for overrides.

```json
{
  "schemaVersion": 1,
  "approval": {
    "required": true,
    "allowLowRiskAutoApprove": false,
    "proceedRequiresSecondConfirmation": true,
    "browserTimeoutMs": 1800000
  },
  "repairs": {
    "maxAttempts": 3,
    "reopenOnlyForFinalReview": true
  },
  "qa": {
    "defaultProfile": "adaptive",
    "requireEvidence": true
  }
}
```

Mandatory approval, second-confirmation overrides, safe Git behavior, the three-repair ceiling, final-only tab reopening, read-only subagents, and sole-writer behavior cannot be weakened by configuration.
