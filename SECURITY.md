# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✓         |

## Reporting a vulnerability

Please do **not** open a public GitHub issue for security vulnerabilities.

Email: **kimoki.kk@gmail.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

You can expect a response within 72 hours. If the issue is confirmed, a fix will be released as soon as possible and you will be credited in the changelog unless you prefer to remain anonymous.

## Scope

DMR is a local hook/CLI tool with no network access by default. The attack surface is:

- **Hook execution**: the `UserPromptSubmit` and `SessionStart` hooks run as the current user; a malicious plugin config could run arbitrary code
- **LLM fallback** (`useLLMFallback: true`): makes outbound API calls via `@anthropic-ai/sdk`; prompt content is sent to the Anthropic API
- **Config files**: DMR reads JSON from `~/.claude/` and `.claude/`; malformed JSON is silently ignored

Out of scope: vulnerabilities in Claude Code itself, the Anthropic API, or third-party npm packages.
