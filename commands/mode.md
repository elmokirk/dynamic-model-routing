---
description: Switch DMR mode for this session (confirm|auto|off)
argument-hint: "confirm|auto|off"
---

# /dmr mode

Changes DMR mode for the current project session only.
Writes to `.claude/dmr-session.json` — does NOT touch `settings.json`.

## Usage
/dmr mode auto
/dmr mode confirm
/dmr mode off
