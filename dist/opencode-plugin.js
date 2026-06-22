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
var OPENAI_MODEL_IDS = {
  low: "gpt-4.1-mini",
  mid: "gpt-4.1",
  high: "o4-mini",
  // reasoning model for complex tasks
  max: "o3"
  // full reasoning — expensive, use deliberately
};
var OLLAMA_MODEL_IDS = {
  low: process.env.DMR_OLLAMA_LOW ?? "qwen2.5-coder:7b",
  mid: process.env.DMR_OLLAMA_MID ?? "qwen2.5-coder:32b",
  high: process.env.DMR_OLLAMA_HIGH ?? "qwen3-coder:30b",
  max: process.env.DMR_OLLAMA_MAX ?? "kimi-k2.6:cloud"
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

// src/opencode-plugin.ts
function getModelIds(provider) {
  if (provider === "openai") return OPENAI_MODEL_IDS;
  if (provider === "ollama") return OLLAMA_MODEL_IDS;
  return CLAUDE_MODEL_IDS;
}
function extractPrompt(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "";
  const last = messages[messages.length - 1];
  if (!last || typeof last !== "object") return "";
  const content = last.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textPart = content.find((p) => p?.type === "text");
    return textPart?.text ?? "";
  }
  return "";
}
function dmrPlugin() {
  return {
    hooks: {
      // fires before every model call — we swap the model based on DMR routing
      "chat.params": async (ctx, params) => {
        const prompt = extractPrompt(ctx.messages ?? []);
        if (!prompt || prompt.startsWith("~")) return params;
        const config = loadConfig();
        const mode = getEffectiveMode(process.cwd(), config.mode);
        if (mode === "off") return params;
        const decision = route(prompt, config);
        const provider = process.env.DMR_PROVIDER ?? "anthropic";
        const modelIds = getModelIds(provider);
        const modelId = modelIds[decision.model];
        const label = `[DMR] ${decision.model} \u2192 ${modelId} (${(decision.confidence * 100).toFixed(0)}% confidence)`;
        if (config.showReason) console.log(`${label}
  reason: ${decision.reason}`);
        else console.log(label);
        return { ...params, model: modelId };
      }
    }
  };
}
export {
  dmrPlugin as default
};
