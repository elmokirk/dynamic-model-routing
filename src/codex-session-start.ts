const SUBAGENT_GUIDANCE = `## DMR — Sub-agent model routing (Codex)

When you spawn sub-agents via the Agent tool, set the \`model\` parameter based on task complexity:

| Task type | Model |
|-----------|-------|
| File search, grep, glob, git status/log, quick reads, rename, format | gpt-5.4-mini |
| Write/edit code, debug, fix bugs, run tests, implement features | gpt-5.4 |
| Architecture decisions, complex refactors, multi-file analysis, plan-mode agents | gpt-5.5 |

These rules apply to every sub-agent you spawn in this session.
Prefix any prompt with \`~\` to bypass DMR routing for that turn.`

process.stdout.write(JSON.stringify({ additionalContext: SUBAGENT_GUIDANCE }))
