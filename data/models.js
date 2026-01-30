/**
 * Model Definitions
 *
 * Each model entry contains architecture specifications (from model cards),
 * configurable precision options (your choice as inference server operator),
 * and benchmarks organized by weight precision.
 *
 * Architecture fields (from model card):
 *   - layers, hiddenDim, numHeads, kvHeads, headDim
 *   - vocabSize, maxContext, baseParams
 *
 * Precision options (your inference server choice):
 *   - weightBytesOptions: available weight quantizations
 *   - kvBytesOptions: available KV cache precisions
 *
 * Benchmarks by weight precision:
 *   - Keyed by bytes per param (2 = FP16, 1 = INT8, 0.5 = INT4)
 *   - null values = not yet measured, will use degradation estimates
 */

const MODELS = [
  {
    name: 'Qwen3-8B',
    type: 'Text',

    // Architecture (from model card)
    layers: 36,
    hiddenDim: 4096,
    numHeads: 32,
    kvHeads: 8,              // GQA: fewer KV heads than attention heads
    headDim: 128,
    vocabSize: 152064,
    maxContext: 32768,
    baseParams: 8e9,

    // Precision options (inference server choice)
    weightBytesOptions: [0.5, 1, 2],  // INT4, INT8, FP16
    kvBytesOptions: [1, 2],           // FP8, FP16

    // Defaults
    defaultWeightBytes: 2,
    defaultKvBytes: 2,
    defaultKVBudget: 8,               // GB allocated for KV cache
    defaultAvgTokens: 6000,
    defaultTargetTokensPerSec: 40,
    enabled: true,

    // Benchmarks by weight precision (fill in later)
    benchmarks: {
      2:   { gpqa: null, swebench: null, math: null, ifeval: null, mmlu_pro: null },
      1:   { gpqa: null, swebench: null, math: null, ifeval: null, mmlu_pro: null },
      0.5: { gpqa: null, swebench: null, math: null, ifeval: null, mmlu_pro: null }
    }
  },

  {
    name: 'Qwen3-VL-8B',
    type: 'Vision',

    layers: 36,
    hiddenDim: 4096,
    numHeads: 32,
    kvHeads: 8,
    headDim: 128,
    vocabSize: 152064,
    maxContext: 32768,
    baseParams: 8e9,

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [1, 2],

    defaultWeightBytes: 2,
    defaultKvBytes: 2,
    defaultKVBudget: 3,
    defaultAvgTokens: 4000,
    defaultTargetTokensPerSec: 30,
    enabled: true,

    benchmarks: {
      2:   { gpqa: null, swebench: null, math: null, ifeval: null, mmlu_pro: null },
      1:   { gpqa: null, swebench: null, math: null, ifeval: null, mmlu_pro: null },
      0.5: { gpqa: null, swebench: null, math: null, ifeval: null, mmlu_pro: null }
    }
  },

  {
    name: 'Qwen3-Coder-30B-A3B',
    type: 'Code MoE',

    layers: 48,
    hiddenDim: 4096,         // Verify from model card
    numHeads: 32,
    kvHeads: 4,
    headDim: 128,
    vocabSize: 152064,
    maxContext: 131072,      // 128K context for coder
    baseParams: 30e9,        // Total params (MoE has more total than active)

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [1, 2],

    defaultWeightBytes: 1,   // INT8 default for larger model
    defaultKvBytes: 1,
    defaultKVBudget: 3,
    defaultAvgTokens: 100000,
    defaultTargetTokensPerSec: 20,
    enabled: true,

    benchmarks: {
      2:   { gpqa: null, swebench: null, math: null, ifeval: null, mmlu_pro: null },
      1:   { gpqa: null, swebench: null, math: null, ifeval: null, mmlu_pro: null },
      0.5: { gpqa: null, swebench: null, math: null, ifeval: null, mmlu_pro: null }
    }
  },

  {
    name: 'Qwen3-Embedding-8B',
    type: 'Embed',

    layers: 36,
    hiddenDim: 4096,
    numHeads: 32,
    kvHeads: 0,              // Embedding models don't use KV cache
    headDim: 0,
    vocabSize: 152064,
    maxContext: 8192,
    baseParams: 8e9,

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [],      // N/A for embedding

    defaultWeightBytes: 1,
    defaultKvBytes: 0,
    defaultKVBudget: 0,
    defaultAvgTokens: 0,
    defaultTargetTokensPerSec: 0,
    enabled: false,

    benchmarks: {
      2:   { mteb_avg: null },
      1:   { mteb_avg: null },
      0.5: { mteb_avg: null }
    }
  },

  {
    name: 'Qwen3-Reranker-8B',
    type: 'Rerank',

    layers: 36,
    hiddenDim: 4096,
    numHeads: 32,
    kvHeads: 0,
    headDim: 0,
    vocabSize: 152064,
    maxContext: 8192,
    baseParams: 8e9,

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [],

    defaultWeightBytes: 1,
    defaultKvBytes: 0,
    defaultKVBudget: 0,
    defaultAvgTokens: 0,
    defaultTargetTokensPerSec: 0,
    enabled: false,

    benchmarks: {
      2:   { mteb_rerank: null },
      1:   { mteb_rerank: null },
      0.5: { mteb_rerank: null }
    }
  },

  {
    name: 'DistilBERT-base',
    type: 'Classifier',

    layers: 6,
    hiddenDim: 768,
    numHeads: 12,
    kvHeads: 12,             // BERT uses full attention
    headDim: 64,
    vocabSize: 30522,
    maxContext: 512,
    baseParams: 0.066e9,

    weightBytesOptions: [1, 2, 4],  // Can run FP32 since it's tiny
    kvBytesOptions: [2, 4],

    defaultWeightBytes: 4,
    defaultKvBytes: 4,
    defaultKVBudget: 0,
    defaultAvgTokens: 256,
    defaultTargetTokensPerSec: 0,
    enabled: false,

    benchmarks: {
      4:   { glue_avg: null },
      2:   { glue_avg: null },
      1:   { glue_avg: null }
    }
  }
];

// Format helpers
const PRECISION_LABELS = {
  0.5: 'INT4',
  1: 'INT8/FP8',
  2: 'FP16/BF16',
  4: 'FP32'
};

function getPrecisionLabel(bytes) {
  return PRECISION_LABELS[bytes] || bytes + 'B';
}

// Calculation helpers
function calculateWeightsGB(model) {
  return (model.baseParams * model.defaultWeightBytes) / 1e9;
}

function calculateKVPerToken(model) {
  if (model.kvHeads === 0) return 0;
  // KV per token = layers * kvHeads * headDim * 2 (K and V) * kvBytes
  return model.layers * model.kvHeads * model.headDim * 2 * model.defaultKvBytes;
}

function calculateMaxConcurrent(model) {
  const kvPerToken = calculateKVPerToken(model);
  if (kvPerToken === 0 || model.defaultAvgTokens === 0) return 0;
  return (model.defaultKVBudget * 1e9) / (kvPerToken * model.defaultAvgTokens);
}
