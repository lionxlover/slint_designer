# Security Policy

## Reporting a vulnerability
Please use GitHub's **private vulnerability reporting** (Security tab → *Report a vulnerability*).
Do not open a public issue for security problems. You'll get a response within 7 days.

## Scope & threat model
Slint Designer is a static, client-side app: there is no server, database or account system.

- Projects live only in your browser's `localStorage` (key `slint-designer/projects/v1`).
- Nothing is uploaded, except the **Live preview** tab, which sends the current `.slint` snippet to
  `https://slintpad.com` (sandboxed iframe / "open in new tab"). Don't paste secrets into a design.
- A Content-Security-Policy restricts scripts to same-origin files (no inline scripts, no `eval`).
- The only third-party code is `vendor/mobile-drag-drop` (MIT), pinned by SHA-256 in
  `scripts/files.json` and re-verified on every deploy.

## Hardening in CI
CodeQL scanning, Dependabot for GitHub Actions, and a build step that fails the deploy if the CSP is
removed, an inline script appears, or a vendored file is modified.
