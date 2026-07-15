import type { QaProfile } from "../domain/types.js";

const QUICK = [
  "build-tests-types-lint",
  "targeted-viewport",
  "console-page-network-errors",
  "keyboard-focus",
  "accessibility-contrast",
  "screenshot",
];

const STANDARD = [
  ...QUICK,
  "desktop-tablet-mobile",
  "touch-targets-overflow",
  "loading-empty-error-long-content",
  "themes-reduced-motion",
  "content-resilience",
];

const FULL = [
  ...STANDARD,
  "reference-visual-comparison",
  "performance-core-web-vitals",
  "cross-browser-when-available",
  "internationalization-resilience",
];

export function requiredChecks(profile: QaProfile): string[] {
  return [...(profile === "quick" ? QUICK : profile === "standard" ? STANDARD : FULL)];
}
