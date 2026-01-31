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
 *   - activeParams (for MoE models - params active per token)
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
  // === Dense Models ===

  {
    name: 'Llama-3.1-8B',
    type: 'Text',

    layers: 32,
    hiddenDim: 4096,
    numHeads: 32,
    kvHeads: 8,
    headDim: 128,
    vocabSize: 128256,
    maxContext: 131072,
    baseParams: 8e9,

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [1, 2],

    defaultWeightBytes: 2,
    defaultKvBytes: 2,
    defaultKVBudget: 8,
    defaultAvgTokens: 6000,
    defaultTargetTokensPerSec: 50,
    enabled: true,

    // Benchmarks - FP16 baseline, quantized versions null (no specific data available)
    benchmarks: {
      2:   { gpqa: 32.8, mmlu_pro: 48.3, math: 51.9, ifeval: 80.4, humaneval: 72.6 },
      1:   { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null },
      0.5: { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null }
    }
  },

  {
    name: 'Llama-3.3-70B',
    type: 'Text',

    layers: 80,
    hiddenDim: 8192,
    numHeads: 64,
    kvHeads: 8,
    headDim: 128,
    vocabSize: 128256,
    maxContext: 131072,
    baseParams: 70e9,

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [1, 2],

    defaultWeightBytes: 1,    // INT8 default for larger model
    defaultKvBytes: 2,
    defaultKVBudget: 16,
    defaultAvgTokens: 8000,
    defaultTargetTokensPerSec: 25,
    enabled: true,

    benchmarks: {
      2:   { gpqa: 50.5, mmlu_pro: 68.9, math: 77.0, ifeval: 92.1, humaneval: 88.4 },
      1:   { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null },
      0.5: { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null }
    }
  },

  {
    name: 'Qwen3-8B',
    type: 'Text',

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
    defaultKVBudget: 8,
    defaultAvgTokens: 6000,
    defaultTargetTokensPerSec: 40,
    enabled: true,

    // Qwen3-8B benchmarks from technical report
    benchmarks: {
      2:   { gpqa: 41.5, mmlu_pro: 61.4, math: 43.5, ifeval: 69.5, humaneval: null },
      1:   { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null },
      0.5: { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null }
    }
  },

  // === MoE Models ===

  {
    name: 'DeepSeek-V3',
    type: 'Text MoE',

    layers: 61,
    hiddenDim: 7168,
    numHeads: 128,
    kvHeads: 128,
    headDim: 128,
    vocabSize: 102400,
    maxContext: 131072,
    baseParams: 671e9,        // Total params
    activeParams: 37e9,       // Active per token

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [1, 2],

    defaultWeightBytes: 1,
    defaultKvBytes: 1,
    defaultKVBudget: 8,
    defaultAvgTokens: 12000,
    defaultTargetTokensPerSec: 20,
    enabled: true,

    benchmarks: {
      2:   { gpqa: 59.1, mmlu_pro: 75.9, math: 90.2, ifeval: 86.1, humaneval: 82.6, swebench: 42.0 },
      1:   { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null, swebench: null },
      0.5: { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null, swebench: null }
    }
  },

  {
    name: 'Llama-4-Scout',
    type: 'Multimodal MoE',

    layers: 80,               // Estimated based on MoE structure
    hiddenDim: 8192,          // Estimated
    numHeads: 64,
    kvHeads: 8,
    headDim: 128,
    vocabSize: 128256,
    maxContext: 10000000,     // 10M token context!
    baseParams: 109e9,        // Total params
    activeParams: 17e9,       // Active per token

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [1, 2],

    defaultWeightBytes: 0.5,  // INT4 recommended for massive context
    defaultKvBytes: 1,
    defaultKVBudget: 20,
    defaultAvgTokens: 50000,  // Long context use cases
    defaultTargetTokensPerSec: 15,
    enabled: true,

    benchmarks: {
      2:   { gpqa: 57.2, mmlu_pro: 74.3, math: null, ifeval: null, humaneval: null, livecode: 32.8 },
      1:   { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null, livecode: null },
      0.5: { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null, livecode: null }
    }
  },

  {
    name: 'Llama-4-Maverick',
    type: 'Multimodal MoE',

    layers: 80,               // Estimated
    hiddenDim: 8192,          // Estimated
    numHeads: 64,
    kvHeads: 8,
    headDim: 128,
    vocabSize: 128256,
    maxContext: 1000000,      // 1M token context
    baseParams: 400e9,        // Total params
    activeParams: 17e9,       // Active per token (128 experts)

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [1, 2],

    defaultWeightBytes: 1,
    defaultKvBytes: 1,
    defaultKVBudget: 10,
    defaultAvgTokens: 20000,
    defaultTargetTokensPerSec: 18,
    enabled: true,

    benchmarks: {
      2:   { gpqa: 69.8, mmlu_pro: 80.5, math: null, ifeval: null, humaneval: null, livecode: null },
      1:   { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null, livecode: null },
      0.5: { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null, livecode: null }
    }
  },

  {
    name: 'Mistral-Large-3',
    type: 'Text MoE',

    layers: 88,               // Estimated
    hiddenDim: 8192,          // Estimated
    numHeads: 64,
    kvHeads: 8,
    headDim: 128,
    vocabSize: 131072,
    maxContext: 262144,       // 256K context
    baseParams: 675e9,        // Total params (estimated)
    activeParams: 41e9,       // Active params (estimated)

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [1, 2],

    defaultWeightBytes: 1,
    defaultKvBytes: 1,
    defaultKVBudget: 10,
    defaultAvgTokens: 15000,
    defaultTargetTokensPerSec: 22,
    enabled: true,

    benchmarks: {
      2:   { gpqa: 43.9, mmlu_pro: null, math: null, ifeval: null, humaneval: 92.0, mmlu: 85.5 },
      1:   { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null, mmlu: null },
      0.5: { gpqa: null, mmlu_pro: null, math: null, ifeval: null, humaneval: null, mmlu: null }
    }
  },

  // === Vision Models ===

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
      2:   { mmmu: null, vqa: null },
      1:   { mmmu: null, vqa: null },
      0.5: { mmmu: null, vqa: null }
    }
  },

  // === Code Models ===

  {
    name: 'Qwen3-Coder-30B-A3B',
    type: 'Code MoE',

    layers: 48,
    hiddenDim: 4096,
    numHeads: 32,
    kvHeads: 4,
    headDim: 128,
    vocabSize: 152064,
    maxContext: 131072,
    baseParams: 30e9,         // Total params
    activeParams: 3e9,        // Active params

    weightBytesOptions: [0.5, 1, 2],
    kvBytesOptions: [1, 2],

    defaultWeightBytes: 1,
    defaultKvBytes: 1,
    defaultKVBudget: 3,
    defaultAvgTokens: 100000,
    defaultTargetTokensPerSec: 20,
    enabled: true,

    benchmarks: {
      2:   { humaneval: null, mbpp: null, livecode: null },
      1:   { humaneval: null, mbpp: null, livecode: null },
      0.5: { humaneval: null, mbpp: null, livecode: null }
    }
  },

  // === Embedding & Reranking Models ===

  {
    name: 'Qwen3-Embedding-8B',
    type: 'Embed',

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
    kvHeads: 12,
    headDim: 64,
    vocabSize: 30522,
    maxContext: 512,
    baseParams: 0.066e9,

    weightBytesOptions: [1, 2, 4],
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

// Benchmark metadata
const BENCHMARK_INFO = {
  gpqa: {
    name: 'GPQA Diamond',
    description: 'Graduate-level reasoning questions',
    higherIsBetter: true,
    scale: 100
  },
  mmlu_pro: {
    name: 'MMLU-PRO',
    description: '10-choice multitask language understanding',
    higherIsBetter: true,
    scale: 100
  },
  mmlu: {
    name: 'MMLU',
    description: 'Massive multitask language understanding',
    higherIsBetter: true,
    scale: 100
  },
  math: {
    name: 'MATH',
    description: 'Competition-level math problems',
    higherIsBetter: true,
    scale: 100
  },
  ifeval: {
    name: 'IFEval',
    description: 'Instruction following evaluation',
    higherIsBetter: true,
    scale: 100
  },
  humaneval: {
    name: 'HumanEval',
    description: 'Code generation benchmark',
    higherIsBetter: true,
    scale: 100
  },
  swebench: {
    name: 'SWE-bench Verified',
    description: 'Real GitHub issue resolution',
    higherIsBetter: true,
    scale: 100
  },
  livecode: {
    name: 'LiveCodeBench',
    description: 'Recent coding problems',
    higherIsBetter: true,
    scale: 100
  }
};

// Model comparison helper
function compareBenchmarks(model1, model2, precision = 2) {
  const bench1 = model1.benchmarks[precision];
  const bench2 = model2.benchmarks[precision];

  if (!bench1 || !bench2) return null;

  const comparison = {};
  const commonKeys = Object.keys(bench1).filter(k => bench2.hasOwnProperty(k));

  for (const key of commonKeys) {
    if (bench1[key] !== null && bench2[key] !== null) {
      comparison[key] = {
        model1: bench1[key],
        model2: bench2[key],
        difference: bench1[key] - bench2[key],
        percentDiff: ((bench1[key] - bench2[key]) / bench2[key]) * 100
      };
    }
  }

  return comparison;
}

function getPrecisionLabel(bytes) {
  return PRECISION_LABELS[bytes] || bytes + 'B';
}

// Calculation helpers
function calculateWeightsGB(model) {
  // VRAM must store ALL weights (even for MoE)
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
