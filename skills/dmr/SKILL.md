---
name: dmr
description: Recommend the best Claude model and effort level for the current task inline — no subprocess needed
user-invokable: true
argument-hint: "[prompt to evaluate]"
license: MIT
metadata:
  author: Kirk
  version: "0.1.0"
  category: productivity
---

# DMR Inline Routing Skill

Analyze the given prompt (or the current conversation goal) and recommend:
- **Model**: haiku / sonnet / opus
- **Effort**: low / medium / high / xhigh
- **Confidence** and short **reason**

## Routing heuristics
- **Haiku + low**: summaries, simple explanations, formatting, shell/git questions
- **Sonnet + medium**: implement, fix, test, refactor, write components
- **Opus + high**: architecture, system design, multi-file refactors, complex debug, strategic planning

Output the recommendation as:
```
Recommended: [model] + [effort]
Confidence: [0-100]%
Reason: [one line]
```

If in `auto` mode context, note that `effortLevel` can be set in `.claude/settings.local.json`.
