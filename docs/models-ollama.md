# Ollama Model Decision Guide

DMR supports Ollama through the OpenCode plugin (`DMR_PROVIDER=ollama`).
This document lists the best models by hardware tier and the top cloud models
available via Ollama's subscription service.

---

## Cloud Models (Ollama Cloud — no local GPU required)

Run cloud models without downloading weights: `ollama run <model>:cloud`
Requires `ollama signin`. Free tier available; Pro ($20/mo) and Max ($100/mo) for
heavy usage. GPU time is the billing unit — not tokens.

### Top 5 Cloud Models (Feb–June 2026)

| Rank | Model | Released | Tag | DMR Tier | SWE-Bench | Best For |
|------|-------|----------|-----|----------|-----------|----------|
| 1 | **DeepSeek V4 Pro** | Apr 23 2026 | `deepseek-v4-pro:cloud` | max | 93.5% LiveCodeBench | Raw coding power, algorithmic problems, 1.6T params / 49B active, 1M ctx |
| 2 | **GLM-5.2** | Jun 2026 | `glm-5.2:cloud` | high | 79.65 Coding Avg (SOTA open-source) | Strongest agentic coding — beats all proprietary on LiveBench agentic |
| 3 | **Kimi K2.6** | Apr 20 2026 | `kimi-k2.6:cloud` | high | 80.2% Verified | Long-horizon agents (up to 300 sub-agents), multimodal, 256K ctx, 1T params |
| 4 | **MiniMax M3** | Jun 2026 | `minimax-m3:cloud` | mid | — | 1M context, native vision, solid agent stability, cost-effective on Pro |
| 5 | **DeepSeek V4 Flash** | Apr 23 2026 | `deepseek-v4-flash:cloud` | low | — | Fast lightweight sibling of V4 Pro (284B/13B active), good for quick tasks |

### DMR Cloud Tier Mapping

```typescript
export const OLLAMA_CLOUD_MODEL_IDS: Record<Model, string> = {
  low:  'deepseek-v4-flash:cloud',  // fast, 13B active, great for low/mid tasks
  mid:  'minimax-m3:cloud',         // 1M ctx, vision, stable for standard work
  high: 'kimi-k2.6:cloud',          // best long-horizon agents, 256K ctx
  max:  'deepseek-v4-pro:cloud',    // strongest raw coding, 93.5% LiveCodeBench
}
```

### Cloud Cost Comparison (API prices for reference)

| Model | Input (per 1M) | Output (per 1M) | Notes |
|-------|---------------|----------------|-------|
| DeepSeek V4 Pro | $1.74 | $3.48 | Post-discount price (was 75% off until May 31) |
| DeepSeek V4 Flash | ~$0.40 | ~$1.00 | Estimated — faster/cheaper sibling |
| GLM-5.2 | $1.40 | $4.40 | Highest output cost but strongest agentic |
| Kimi K2.6 | $0.15 | $4.00 | Cheapest input of the top tier |
| MiniMax M3 | ~$0.60 | ~$2.00 | Estimated — best context/cost ratio |

> Ollama Cloud billing is GPU-time based, not per-token — actual costs depend on
> your subscription tier and session length, not the API prices above.
> ⚠️ Review data policies for Chinese vendors before using for enterprise/compliance work.

---

## Local Models by VRAM Tier

All recommendations use **Q4_K_M quantization** unless noted.
Rule of thumb: model fits if Q4_K_M file size + ~1.5 GB ≤ your VRAM.

---

### 8 GB VRAM
*(RTX 3060, RTX 4060, RX 6700 XT, Apple M1/M2 8GB)*

| Priority | Model | Pull Command | Best For | Notes |
|----------|-------|-------------|----------|-------|
| **1st — coding** | `qwen2.5-coder:7b` | `ollama pull qwen2.5-coder:7b` | Coding tasks | Outperforms CodeLlama 13B at this VRAM |
| **2nd — reasoning** | `deepseek-r1:7b` | `ollama pull deepseek-r1:7b` | Debug, logic, step-by-step | Best reasoning at 8GB |
| **3rd — lightweight** | `phi4-mini` | `ollama pull phi4-mini` | Fast Q&A, math, explain | 3.8B, lowest VRAM of the three |
| **backup** | `qwen3:8b` | `ollama pull qwen3:8b` | General coding + chat | Hybrid thinking mode |

**DMR mapping for 8GB:**
```typescript
{ low: 'phi4-mini', mid: 'qwen2.5-coder:7b', high: 'deepseek-r1:7b' }
```

---

### 16 GB VRAM
*(RTX 3080, RTX 4070, RTX 4070 Ti, Apple M1/M2 Pro 16GB)*

| Priority | Model | Pull Command | Best For | Notes |
|----------|-------|-------------|----------|-------|
| **1st — coding** | `deepseek-coder-v2:16b` | `ollama pull deepseek-coder-v2:16b` | All coding tasks | MoE, activates subset of 16B params |
| **2nd — all-round** | `qwen3:14b` | `ollama pull qwen3:14b` | Chat + coding + reasoning | Safest first pull for 16GB |
| **3rd — reasoning** | `deepseek-r1:14b` | `ollama pull deepseek-r1:14b` | Complex bugs, logic | Sweet spot for local reasoning |
| **MoE bonus** | `qwen3.6:35b-a3b` | `ollama pull qwen3.6:35b-a3b` | Big-model quality | Activates 3B params per token — fast |

**DMR mapping for 16GB:**
```typescript
{ low: 'qwen3:14b', mid: 'deepseek-coder-v2:16b', high: 'deepseek-r1:14b' }
```

---

### 24 GB VRAM
*(RTX 3090, RTX 4090, Apple M2 Max/Ultra)*

| Priority | Model | Pull Command | Best For | Notes |
|----------|-------|-------------|----------|-------|
| **1st — coding** | `qwen2.5-coder:32b` | `ollama pull qwen2.5-coder:32b` | Best local coding | 92.7% HumanEval — rivals cloud models |
| **2nd — agentic** | `qwen3-coder:30b` | `ollama pull qwen3-coder:30b` | Agentic coding, 256K ctx | MoE: 30B total, 3B active, 7B-class speed |
| **3rd — reasoning** | `deepseek-r1:32b` | `ollama pull deepseek-r1:32b` | Hard reasoning | Strongest local reasoning on 24GB |
| **daily driver** | `qwen3.6:27b` | `ollama pull qwen3.6:27b` | Chat + refactors | Fastest daily-use model at this tier |

**DMR mapping for 24GB:**
```typescript
{ low: 'qwen3.6:27b', mid: 'qwen2.5-coder:32b', high: 'qwen3-coder:30b' }
```

---

### 32 GB+ VRAM / Unified Memory
*(Dual 3090/4090, Apple M2 Max 96GB, M3 Ultra, Workstations)*

| Priority | Model | Pull Command | Best For | Notes |
|----------|-------|-------------|----------|-------|
| **1st — all-round** | `qwen3:32b` | `ollama pull qwen3:32b` | Everything | Best single-GPU model overall |
| **2nd — agentic** | `devstral-small-2` | `ollama pull devstral-small-2` | Coding agents | Purpose-built for agentic coding |
| **3rd — reasoning** | `qwen3-coder:30b` | `ollama pull qwen3-coder:30b` | Code + long ctx | 256K context, fast MoE |
| **largest local** | `llama3.3:70b` | `ollama pull llama3.3:70b` | Max capability | Needs 48GB+ for Q4_K_M |

**DMR mapping for 32GB+:**
```typescript
{ low: 'qwen3:32b', mid: 'devstral-small-2', high: 'qwen3:32b' }
// or go larger:
{ low: 'qwen2.5-coder:7b', mid: 'qwen3:32b', high: 'llama3.3:70b' }
```

---

## Configuring DMR for Ollama

Set the provider in your environment before launching OpenCode:

```bash
export DMR_PROVIDER=ollama
export DMR_OLLAMA_TIER=16gb   # 8gb | 16gb | 24gb | 32gb (optional, future)
opencode
```

Or override model IDs in `.claude/dynamic-model-routing.json`:

```json
{
  "ollamaModelIds": {
    "low":  "qwen3:14b",
    "mid": "deepseek-coder-v2:16b",
    "high":   "deepseek-r1:14b"
  }
}
```

---

## Quick Comparison: Cloud vs Local

| Dimension | Ollama Cloud | Local (24GB) |
|-----------|-------------|--------------|
| Setup | `ollama signin` | `ollama pull <model>` |
| GPU required | No | Yes |
| Best model quality | Kimi K2.6 (1T params) | qwen2.5-coder:32b |
| Cost | Free tier available | Hardware only |
| Privacy | Ollama infra (strong policy, no audit cert) | 100% local |
| Speed (low tasks) | ~136 t/s (gpt-oss) | ~80 t/s (local 7B) |
| Context | 256K (Kimi K2.6) | 128K typical |
