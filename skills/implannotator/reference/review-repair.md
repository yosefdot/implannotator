# Review and repair

- Initial code review opens after the selected QA profile passes.
- Normalize annotations into a prioritized backlog: blocking correctness/accessibility/security, major UX/responsive/performance, then polish.
- Repair at most three times.
- Re-run QA after each repair.
- Do not reopen a browser tab for intermediate repairs.
- Open one final review only after automated pass or the third repair.
- If final review remains unapproved after three repairs, ask the user to proceed with a second warning or stop. Never silently complete.
- Keep the main agent as sole writer. Review subagents are read-only.
