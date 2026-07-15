# Adaptive QA

Every applicable fundamental must run. Choose the smallest conservative profile that covers the change; when uncertain, choose the higher profile.

## Quick

For a tiny isolated visual or content change:

- Relevant build, tests, typecheck, and lint
- Target viewport plus one narrow viewport
- Console, page, and network errors
- Keyboard path and visible focus
- Automated accessibility and contrast
- Before/after screenshot evidence

## Standard

For normal component or page work, include Quick plus:

- Desktop, tablet, and mobile viewports
- Touch targets and responsive overflow
- Loading, empty, error, and long-content states
- Light/dark themes when supported
- Reduced-motion behavior
- Content resilience and realistic copy

## Full

For new pages, navigation, shared components, redesigns, auth/payment surfaces, or broad changes, include Standard plus:

- Reference/Figma visual comparison when provided
- Performance trace and Core Web Vitals
- Cross-browser checks when available
- Internationalization and extreme-content resilience
- Complete user flow from entry through success and failure
- Independent read-only accessibility and final-quality review when subagents are available

## Evidence rules

Each check must be `passed`, `failed`, `unavailable`, or `not-applicable`. Include command output summaries, screenshot paths, URLs/viewports, issue references, and observations. Never call unavailable tooling passed. Blocking failures must be listed separately and repaired before review unless the user explicitly overrides them.
