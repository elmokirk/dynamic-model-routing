const SUBAGENT_GUIDANCE = `## DMR — Sub-agent model routing

When you spawn sub-agents via the Agent tool, set the \`model\` parameter based on task complexity:

| DMR tier | Model | Task type |
|----------|-------|-----------|
| low  | claude-haiku-4-5-20251001 | File search, grep, glob, git status/log, quick reads, rename, format |
| mid  | claude-sonnet-4-6         | Write/edit code, debug, fix bugs, run tests, implement features |
| high | claude-opus-4-8           | Architecture decisions, complex refactors, multi-file analysis, plan-mode agents |
| max  | claude-opus-4-8           | Full-codebase audits, security reviews, greenfield design (same as high until next-gen Claude) |

These rules apply to every sub-agent you spawn in this session.
Prefix any prompt with \`~\` to bypass DMR routing for that turn.`

process.stdout.write(JSON.stringify({ additionalContext: SUBAGENT_GUIDANCE }))
