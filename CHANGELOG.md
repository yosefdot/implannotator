# Changelog

## 0.2.0 - Unreleased

- Move the canonical npm package from `@yoseph_23/implannotator` to the unscoped `implannotator` name.
- Support the shorter installation command: `pi install npm:implannotator`.
- Add Pi extension and skill discovery keywords for the package gallery.

## 0.1.1 - 2026-07-15

- Reuse `@plannotator/pi-extension` as a separately installed companion package.
- Stop bundling and statically loading a second Plannotator extension, preventing duplicate tool, command, and `--plan` flag conflicts.
- Detect companion availability at session startup and retain text approval fallback when it is missing.
- Reduce the published package size substantially.

## 0.1.0 - 2026-07-15

- Initial independent Implannotator Pi package.
- Approval-gated planning, adaptive QA, Plannotator code review, bounded repair loops, resumable audit records, and complete namespaced design guidance.
