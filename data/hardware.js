/**
 * GPU Hardware Configurations
 *
 * Each hardware entry represents a GPU or multi-GPU configuration
 * with its memory and compute specifications.
 */

const HARDWARE = [
  {
    id: 'rtx-pro-6000-blackwell',
    name: 'RTX PRO 6000 Blackwell Max-Q',
    vram: 96,              // GB total VRAM
    bandwidth: 1800,       // GB/s memory bandwidth (verify with nvidia-smi)
    tflops: {
      fp32: 75,            // TFLOPS (estimate - verify)
      fp16: 150,           // TFLOPS (estimate - verify)
      fp8: 300             // TFLOPS (estimate - verify)
    },
    gpuCount: 1,
    interconnect: null,    // No multi-GPU interconnect for single GPU
    notes: 'Blackwell architecture workstation GPU'
  }
  // Add more hardware configurations as needed:
  // {
  //   id: 'a100-80',
  //   name: 'A100 80GB',
  //   vram: 80,
  //   bandwidth: 2000,
  //   tflops: { fp32: 19.5, fp16: 312, fp8: null },
  //   gpuCount: 1,
  //   interconnect: null,
  //   notes: 'Ampere architecture datacenter GPU'
  // },
  // {
  //   id: '2xa100-nvlink',
  //   name: '2x A100 80GB NVLink',
  //   vram: 160,
  //   bandwidth: 4000,
  //   tflops: { fp32: 39, fp16: 624, fp8: null },
  //   gpuCount: 2,
  //   interconnect: 600,  // GB/s NVLink bandwidth
  //   notes: 'Dual A100 with NVLink'
  // }
];

// Default hardware selection
const DEFAULT_HARDWARE_ID = 'rtx-pro-6000-blackwell';

// Quantization degradation factors (multiplied by base benchmark)
// Used when specific quantized benchmarks aren't available
const QUANT_DEGRADATION = {
  4: 1.0,      // FP32 - baseline (rarely used for inference)
  2: 1.0,      // FP16/BF16 - reference point for benchmarks
  1: 0.99,     // INT8/FP8 - ~1% quality loss typical
  0.5: 0.97    // INT4 - ~3% quality loss typical
};

// Helper function to get hardware by ID
function getHardwareById(id) {
  return HARDWARE.find(h => h.id === id) || HARDWARE[0];
}

// Helper function to get default hardware
function getDefaultHardware() {
  return getHardwareById(DEFAULT_HARDWARE_ID);
}
