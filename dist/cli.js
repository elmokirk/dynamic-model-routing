#!/usr/bin/env node

// src/cli.ts
import { createInterface } from "readline";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join as join4 } from "path";

// src/config.ts
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// src/types.ts
var DEFAULT_CONFIG = {
  mode: "confirm",
  defaultModel: "sonnet",
  defaultEffort: "medium",
  allowedModels: ["haiku", "sonnet", "opus"],
  autoModeMinConfidence: 0.75,
  useLLMFallback: false,
  llmClassifierModel: "haiku",
  showReason: true,
  logDecisions: true,
  writeClaudeSettings: false,
  rules: {
    opus: {
      keywords: ["architecture", "strategy", "multi-file", "complex debug", "system design", "refactor across", "ambiguous", "high-impact", "at scale", "design a system", "design the system"],
      effort: "high"
    },
    sonnet: {
      keywords: ["implement", "fix", "test", "refactor", "component", "bugfix", "add feature", "write"],
      effort: "medium"
    },
    haiku: {
      keywords: ["summarize", "explain briefly", "format", "rename", "simple", "what is", "what does", "list", "show me", "what error", "error mean"],
      effort: "low"
    }
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
function writeSession(mode, cwd = process.cwd()) {
  mkdirSync(join2(cwd, ".claude"), { recursive: true });
  const state = { mode, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  writeFileSync(sessionPath(cwd), JSON.stringify(state, null, 2));
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
  const models = ["opus", "sonnet", "haiku"];
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
var MODEL_IDS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8"
};
var SYSTEM = `You are a model routing classifier. Given a user prompt, output ONLY valid JSON matching this exact schema \u2014 no prose, no markdown:
{"model":"haiku|sonnet|opus","effort":"low|medium|high|xhigh","confidence":0.0,"reason":"string","signals":["string"]}`;
async function classifyWithLLM(prompt, config) {
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL_IDS[config.llmClassifierModel],
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

// src/installer.ts
import { readFileSync as readFileSync3, writeFileSync as writeFileSync2, mkdirSync as mkdirSync2 } from "fs";
import { join as join3 } from "path";
import { homedir as homedir2 } from "os";
var DMR_HOOK_ID = "dmr-model-router";
var DMR_SESSION_HOOK_ID = "dmr-session-start";
function targetPath(target, cwd) {
  if (target === "global") return join3(homedir2(), ".claude", "settings.json");
  if (target === "project") return join3(cwd, ".claude", "settings.json");
  return join3(cwd, ".claude", "settings.local.json");
}
function readSettings(path) {
  try {
    return JSON.parse(readFileSync3(path, "utf8"));
  } catch {
    return {};
  }
}
function installHook(target = "project", pluginRoot, cwd = process.cwd()) {
  const settingsPath = targetPath(target, cwd);
  mkdirSync2(join3(settingsPath, ".."), { recursive: true });
  const settings = readSettings(settingsPath);
  const hooks = settings.hooks ?? {};
  const existing = hooks["UserPromptSubmit"] ?? [];
  const alreadyInstalled = existing.some((h) => h.id === DMR_HOOK_ID);
  const sessionHooks = hooks["SessionStart"] ?? [];
  const sessionAlready = sessionHooks.some((h) => h.id === DMR_SESSION_HOOK_ID);
  if (alreadyInstalled && sessionAlready) return `DMR hooks already installed in ${settingsPath}`;
  const hookEntry = {
    id: DMR_HOOK_ID,
    type: "command",
    command: `node "${pluginRoot}/dist/hook.js"`,
    async: false,
    description: "DMR: recommend model and effort before each turn"
  };
  const sessionEntry = {
    id: DMR_SESSION_HOOK_ID,
    type: "command",
    command: `node "${pluginRoot}/dist/session-start.js"`,
    async: false,
    description: "DMR: inject sub-agent model routing rules at session start"
  };
  settings.hooks = {
    ...hooks,
    SessionStart: sessionAlready ? sessionHooks : [...sessionHooks, sessionEntry],
    UserPromptSubmit: alreadyInstalled ? existing : [...existing, hookEntry]
  };
  writeFileSync2(settingsPath, JSON.stringify(settings, null, 2));
  return `DMR hooks installed \u2192 ${settingsPath}`;
}

// src/cli.ts
var MODEL_IDS2 = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8"
};
async function cmdRun(prompt) {
  const config = loadConfig();
  const mode = getEffectiveMode(process.cwd(), config.mode);
  if (mode === "off") {
    console.log("[DMR] Mode is off \u2014 no routing.");
    return;
  }
  let decision = route(prompt, config);
  if (config.useLLMFallback && decision.confidence < config.autoModeMinConfidence) {
    const llm = await classifyWithLLM(prompt, config);
    if (llm) decision = llm;
  }
  console.log(`
  Recommended: ${decision.model} + ${decision.effort}`);
  console.log(`  Confidence:  ${(decision.confidence * 100).toFixed(0)}%`);
  if (config.showReason) console.log(`  Reason:      ${decision.reason}`);
  console.log();
  if (mode === "auto") {
    if (decision.confidence < config.autoModeMinConfidence) {
      console.log(`[DMR] Confidence too low for auto (${(decision.confidence * 100).toFixed(0)}% < ${config.autoModeMinConfidence * 100}%) \u2014 skipping.`);
      return;
    }
    const modelId = MODEL_IDS2[decision.model];
    const cmd2 = `claude --model ${modelId} --effort ${decision.effort} "${prompt.replace(/"/g, '\\"')}"`;
    console.log(`[DMR AUTO] Running: ${cmd2}
`);
    execSync(cmd2, { stdio: "inherit" });
    return;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await new Promise((resolve) => {
    rl.question("  [Enter] accept / h haiku / s sonnet / o opus / c cancel: ", (answer) => {
      rl.close();
      const key = answer.trim().toLowerCase();
      const overrides = { h: "haiku", s: "sonnet", o: "opus" };
      if (key === "c") {
        console.log("[DMR] Cancelled.");
        resolve();
        return;
      }
      const model = overrides[key] ?? decision.model;
      const effort = overrides[key] ? config.rules[model].effort : decision.effort;
      const modelId = MODEL_IDS2[model];
      const cmd2 = `claude --model ${modelId} --effort ${effort} "${prompt.replace(/"/g, '\\"')}"`;
      console.log(`
[DMR] Running: ${cmd2}
`);
      execSync(cmd2, { stdio: "inherit" });
      resolve();
    });
  });
}
function cmdMode(mode) {
  if (!["confirm", "auto", "off"].includes(mode)) {
    console.error("Usage: dmr mode [confirm|auto|off]");
    process.exit(1);
  }
  writeSession(mode);
  console.log(`[DMR] Mode set to: ${mode}`);
}
function cmdStatus() {
  const config = loadConfig();
  const mode = getEffectiveMode(process.cwd(), config.mode);
  console.log(`[DMR] Mode: ${mode} (config default: ${config.mode})`);
  console.log(`[DMR] LLM fallback: ${config.useLLMFallback}`);
  console.log(`[DMR] Write settings: ${config.writeClaudeSettings}`);
}
async function cmdInstall(target) {
  const pluginRoot = join4(dirname(fileURLToPath(import.meta.url)), "..");
  const result = installHook(target, pluginRoot);
  console.log(`[DMR] ${result}`);
}
var [, , cmd, ...args] = process.argv;
switch (cmd) {
  case "run":
    await cmdRun(args.join(" "));
    break;
  case "mode":
    cmdMode(args[0] ?? "");
    break;
  case "status":
    cmdStatus();
    break;
  case "install": {
    const target = args.find((a) => ["--global", "--project", "--local"].includes(a))?.replace("--", "") ?? "project";
    await cmdInstall(target);
    break;
  }
  default:
    console.log("Usage: dmr [run|mode|status|install] [...args]");
}
