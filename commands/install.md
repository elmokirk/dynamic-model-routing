---
description: Install the DMR UserPromptSubmit hook into a settings.json target
argument-hint: "--global|--project|--local"
---

# /dmr install

Adds the DMR hook to your chosen settings file. Run once per project or globally.
Default target: `--project` (`.claude/settings.json`).

## Usage
/dmr install --global      # ~/.claude/settings.json
/dmr install --project     # .claude/settings.json
/dmr install --local       # .claude/settings.local.json

## Note
This is the ONLY safe way for DMR to modify settings — the hook itself never does.
