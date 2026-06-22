// src/config.ts
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// src/types.ts
var CLAUDE_MODEL_IDS = {
  low: "claude-haiku-4-5-20251001",
  mid: "claude-sonnet-4-6",
  high: "claude-opus-4-8",
  max: "claude-opus-4-8"
  // no higher Claude tier yet; override when available
};
var OLLAMA_MODEL_IDS = {
  low: process.env.DMR_OLLAMA_LOW ?? "qwen2.5-coder:7b",
  mid: process.env.DMR_OLLAMA_MID ?? "qwen2.5-coder:32b",
  high: process.env.DMR_OLLAMA_HIGH ?? "qwen3-coder:30b",
  max: process.env.DMR_OLLAMA_MAX ?? "deepseek-v4-pro:cloud"
};
var DEFAULT_CONFIG = {
  mode: "confirm",
  defaultModel: "mid",
  defaultEffort: "medium",
  allowedModels: ["low", "mid", "high"],
  // max is opt-in
  autoModeMinConfidence: 0.75,
  useLLMFallback: false,
  llmClassifierModel: "low",
  showReason: true,
  logDecisions: true,
  writeClaudeSettings: false,
  rules: {
    high: {
      keywords: ["architecture", "strategy", "multi-file", "complex debug", "system design", "refactor across", "ambiguous", "high-impact", "at scale", "design a system", "design the system"],
      effort: "high"
    },
    mid: {
      keywords: ["implement", "fix", "test", "refactor", "component", "bugfix", "add feature", "write"],
      effort: "medium"
    },
    low: {
      keywords: ["summarize", "explain briefly", "format", "rename", "simple", "what is", "what does", "list", "show me", "what error", "error mean"],
      effort: "low"
    }
    // max tier — opt-in, add to allowedModels to enable:
    // max: {
    //   keywords: ['security audit', 'full codebase', 'entire codebase', 'greenfield', 'migrate everything'],
    //   effort: 'max',
    // },
  }
};

// src/config.ts
function safeReadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}
function loadConfig(cwd = process.cwd()) {
  const user = safeReadJson(join(homedir(), ".claude", "dynamic-model-routing.json"));
  const project = safeReadJson(join(cwd, ".claude", "dynamic-model-routing.json"));
  const local = safeReadJson(join(cwd, ".claude", "dynamic-model-routing.local.json"));
  return {
    ...DEFAULT_CONFIG,
    ...user,
    ...project,
    ...local,
    rules: {
      ...DEFAULT_CONFIG.rules,
      ...user.rules ?? {},
      ...project.rules ?? {},
      ...local.rules ?? {}
    }
  };
}

// src/session.ts
import { readFileSync as readFileSync2, writeFileSync, mkdirSync } from "fs";
import { join as join2 } from "path";
function sessionPath(cwd) {
  return join2(cwd, ".claude", "dmr-session.json");
}
function readSession(cwd = process.cwd()) {
  try {
    return JSON.parse(readFileSync2(sessionPath(cwd), "utf8"));
  } catch {
    return null;
  }
}
function getEffectiveMode(cwd = process.cwd(), configMode) {
  return readSession(cwd)?.mode ?? configMode;
}

// src/router.ts
function score(prompt, keywords) {
  const lower = prompt.toLowerCase();
  const matched = keywords.filter((k) => lower.includes(k.toLowerCase()));
  return { score: matched.length, matched };
}
function route(prompt, config) {
  const models = ["max", "high", "mid", "low"].filter((m) => config.allowedModels.includes(m) && config.rules[m] != null);
  const scores = models.map((model) => {
    const rule = config.rules[model];
    const { score: s, matched } = score(prompt, rule.keywords);
    return { model, score: s, matched, effort: rule.effort };
  });
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  const best = scores.reduce((a, b) => a.score >= b.score ? a : b);
  const hasMatch = best.score > 0;
  const confidence = hasMatch ? Math.min(0.95, 0.5 + best.score / Math.max(total, 1) * 0.45) : 0.3;
  if (!hasMatch || !config.allowedModels.includes(best.model)) {
    return {
      model: config.defaultModel,
      effort: config.defaultEffort,
      confidence: 0.3,
      reason: "no strong signals \u2014 using default",
      signals: []
    };
  }
  return {
    model: best.model,
    effort: best.effort,
    confidence,
    reason: `matched ${best.matched.length} ${best.model} signal(s)`,
    signals: best.matched
  };
}

// src/classifier.ts
import Anthropic from "@anthropic-ai/sdk";
var SYSTEM = `You are a model routing classifier. Given a user prompt, output ONLY valid JSON matching this exact schema \u2014 no prose, no markdown:
{"model":"low|mid|high|max","effort":"low|medium|high|xhigh","confidence":0.0,"reason":"string","signals":["string"]}`;
async function classifyWithLLM(prompt, config) {
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: CLAUDE_MODEL_IDS[config.llmClassifierModel],
      max_tokens: 200,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }]
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// src/hook.ts
async function main() {
  let prompt = "";
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString().trim();
    if (raw) {
      try {
        const input = JSON.parse(raw);
        prompt = typeof input === "string" ? input : input?.prompt ?? "";
      } catch {
        prompt = raw;
      }
    }
  } catch {
    process.exit(0);
  }
  if (prompt.startsWith("~")) process.exit(0);
  const config = loadConfig();
  const mode = getEffectiveMode(process.cwd(), config.mode);
  if (mode === "off") process.exit(0);
  let decision = route(prompt, config);
  if (config.useLLMFallback && decision.confidence < config.autoModeMinConfidence) {
    const llmDecision = await classifyWithLLM(prompt, config);
    if (llmDecision) decision = llmDecision;
  }
  const modelId = CLAUDE_MODEL_IDS[decision.model];
  const lines = [
    `\u2554\u2550 DMR (${mode}) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557`,
    `  Model:      ${decision.model} (${modelId})`,
    `  Effort:     ${decision.effort}`,
    `  Confidence: ${(decision.confidence * 100).toFixed(0)}%`,
    ...config.showReason ? [`  Reason:     ${decision.reason}`] : [],
    `\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D`
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}
main().catch(() => process.exit(0));
