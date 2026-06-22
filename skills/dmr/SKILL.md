---
name: dmr
description: Recommend the best model tier and effort level for the current task inline — no subprocess needed
user-invokable: true
argument-hint: "[prompt to evaluate]"
license: MIT
metadata:
  author: Kirk
  version: "0.3.0"
  category: productivity
---

# DMR Inline Routing Skill

Analyze the given prompt (or the current conversation goal) and recommend:
- **Tier**: low / mid / high / max
- **Effort**: low / medium / high / xhigh
- **Confidence** and short **reason**

## Routing heuristics
- **low + low effort**: summaries, simple explanations, formatting, rename, shell/git questions
- **mid + medium effort**: implement, fix, test, refactor, write components
- **high + high effort**: architecture, system design, multi-file refactors, complex debug, strategic planning
- **max + max effort** *(opt-in)*: security audits, full-codebase analysis, greenfield design

Output the recommendation as:
```
Recommended: [tier] + [effort]
Confidence: [0-100]%
Reason: [one line]
```

If in `auto` mode context, note that `effortLevel` can be set in `.claude/settings.local.json`.
