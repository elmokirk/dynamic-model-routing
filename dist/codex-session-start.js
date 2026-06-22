// src/codex-session-start.ts
var SUBAGENT_GUIDANCE = `## DMR \u2014 Sub-agent model routing (Codex)

When you spawn sub-agents via the Agent tool, set the \`model\` parameter based on task complexity:

| DMR tier | Model      | Task type |
|----------|------------|-----------|
| low  | gpt-5.4-mini | File search, grep, glob, git status/log, quick reads, rename, format |
| mid  | gpt-5.4      | Write/edit code, debug, fix bugs, run tests, implement features |
| high | gpt-5.5      | Architecture decisions, complex refactors, multi-file analysis, plan-mode agents |
| max  | gpt-5.5      | Full-codebase audits, security reviews, greenfield design |

These rules apply to every sub-agent you spawn in this session.
Prefix any prompt with \`~\` to bypass DMR routing for that turn.`;
process.stdout.write(JSON.stringify({ additionalContext: SUBAGENT_GUIDANCE }));
