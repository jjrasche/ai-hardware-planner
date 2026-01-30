/**
 * AI Hardware Planner - Application Logic
 *
 * Depends on:
 *   - data/hardware.js (HARDWARE, getHardwareById, getDefaultHardware)
 *   - data/models.js (MODELS, getPrecisionLabel, calculateWeightsGB, etc.)
 *   - Chart.js + chartjs-plugin-datalabels
 */

// State
let currentHardware = null;
let vramChart = null;
let bandwidthChart = null;
let hoveredModelIndex = null;
let bandwidthModelMapping = []; // Track which model each bandwidth slice belongs to

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  populateHardwareSelect();
  renderTable();
  updateDisplay();

  // Hardware selector handler
  document.getElementById('hardwareSelect').addEventListener('change', function(e) {
    currentHardware = getHardwareById(e.target.value);
    saveState();
    renderTable();
    updateDisplay();
  });
});

// Local storage persistence
function loadState() {
  currentHardware = getDefaultHardware();

  const saved = localStorage.getItem('aiHardwarePlannerState');
  if (saved) {
    try {
      const state = JSON.parse(saved);

      if (state.hardwareId) {
        currentHardware = getHardwareById(state.hardwareId);
      }

      if (state.models) {
        state.models.forEach((savedModel, idx) => {
          if (MODELS[idx]) {
            MODELS[idx].enabled = savedModel.enabled;
            MODELS[idx].defaultWeightBytes = savedModel.weightBytes;
            MODELS[idx].defaultKvBytes = savedModel.kvBytes;
            MODELS[idx].defaultKVBudget = savedModel.kvBudget;
            MODELS[idx].defaultAvgTokens = savedModel.avgTokens;
            MODELS[idx].defaultTargetTokensPerSec = savedModel.targetTokensPerSec;
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load saved state:', e);
    }
  }
}

function saveState() {
  const state = {
    hardwareId: currentHardware.id,
    models: MODELS.map(m => ({
      enabled: m.enabled,
      weightBytes: m.defaultWeightBytes,
      kvBytes: m.defaultKvBytes,
      kvBudget: m.defaultKVBudget,
      avgTokens: m.defaultAvgTokens,
      targetTokensPerSec: m.defaultTargetTokensPerSec
    }))
  };
  localStorage.setItem('aiHardwarePlannerState', JSON.stringify(state));
}

// Populate hardware dropdown
function populateHardwareSelect() {
  const select = document.getElementById('hardwareSelect');
  select.innerHTML = '';

  HARDWARE.forEach(hw => {
    const option = document.createElement('option');
    option.value = hw.id;
    option.textContent = `${hw.name} (${hw.vram}GB, ${hw.bandwidth} GB/s)`;
    if (hw.id === currentHardware.id) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

// Calculation functions
function calculateBandwidth(model) {
  // Bandwidth (GB/s) = Weights (GB) * Target tokens/sec
  // During decode, we read all weights for each token
  const weightsGB = calculateWeightsGB(model);
  return weightsGB * model.defaultTargetTokensPerSec;
}

function calculateBandwidthPercent(model) {
  if (!currentHardware || currentHardware.bandwidth === 0) return 0;
  return (calculateBandwidth(model) / currentHardware.bandwidth) * 100;
}

// Format helpers
function formatBytes(bytes) {
  if (bytes === 0) return 'N/A';
  if (bytes < 1024) return bytes.toFixed(0) + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatGB(gb) {
  if (gb === 0) return 'N/A';
  return gb.toFixed(2) + ' GB';
}

// Render the model table
function renderTable() {
  const tbody = document.getElementById('modelTableBody');
  tbody.innerHTML = '';

  MODELS.forEach((model, idx) => {
    const row = tbody.insertRow();
    row.dataset.modelIndex = idx;

    // Enable checkbox
    const enableCell = row.insertCell();
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = model.enabled;
    checkbox.onchange = () => {
      model.enabled = checkbox.checked;
      saveState();
      updateDisplay();
    };
    enableCell.appendChild(checkbox);

    // Model name
    row.insertCell().textContent = model.name;

    // Type
    row.insertCell().textContent = model.type;

    // Weight precision selector
    const weightBytesCell = row.insertCell();
    const weightBytesSelect = document.createElement('select');
    model.weightBytesOptions.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option + ' (' + getPrecisionLabel(option) + ')';
      if (option === model.defaultWeightBytes) opt.selected = true;
      weightBytesSelect.appendChild(opt);
    });
    weightBytesSelect.onchange = () => {
      model.defaultWeightBytes = parseFloat(weightBytesSelect.value);
      saveState();
      renderTable();
      updateDisplay();
    };
    weightBytesCell.appendChild(weightBytesSelect);

    // Weights size (calculated)
    const weightsCell = row.insertCell();
    weightsCell.className = 'readonly';
    weightsCell.textContent = formatGB(calculateWeightsGB(model));

    // KV precision selector
    const kvBytesCell = row.insertCell();
    if (model.kvBytesOptions && model.kvBytesOptions.length > 0) {
      const kvBytesSelect = document.createElement('select');
      model.kvBytesOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option + ' (' + getPrecisionLabel(option) + ')';
        if (option === model.defaultKvBytes) opt.selected = true;
        kvBytesSelect.appendChild(opt);
      });
      kvBytesSelect.onchange = () => {
        model.defaultKvBytes = parseFloat(kvBytesSelect.value);
        saveState();
        renderTable();
        updateDisplay();
      };
      kvBytesCell.appendChild(kvBytesSelect);
    } else {
      kvBytesCell.textContent = 'N/A';
      kvBytesCell.className = 'readonly';
    }

    // KV/Token (calculated)
    const kvTokenCell = row.insertCell();
    kvTokenCell.className = 'readonly';
    kvTokenCell.textContent = formatBytes(calculateKVPerToken(model));

    // KV Budget input
    const kvBudgetCell = row.insertCell();
    const kvBudgetInput = document.createElement('input');
    kvBudgetInput.type = 'number';
    kvBudgetInput.step = '0.1';
    kvBudgetInput.min = '0';
    kvBudgetInput.value = model.defaultKVBudget;
    kvBudgetInput.oninput = () => {
      model.defaultKVBudget = parseFloat(kvBudgetInput.value) || 0;
      saveState();
      updateDisplay();
    };
    kvBudgetCell.appendChild(kvBudgetInput);

    // Avg Tokens/Req input
    const avgTokensCell = row.insertCell();
    const avgTokensInput = document.createElement('input');
    avgTokensInput.type = 'number';
    avgTokensInput.step = '1024';
    avgTokensInput.min = '0';
    avgTokensInput.value = model.defaultAvgTokens;
    avgTokensInput.oninput = () => {
      model.defaultAvgTokens = parseInt(avgTokensInput.value) || 0;
      saveState();
      updateDisplay();
    };
    avgTokensCell.appendChild(avgTokensInput);

    // Max Concurrent (calculated)
    const maxConcurrentCell = row.insertCell();
    maxConcurrentCell.className = 'readonly';
    maxConcurrentCell.dataset.modelIndex = idx;
    const maxConcurrent = calculateMaxConcurrent(model);
    maxConcurrentCell.textContent = maxConcurrent === 0 ? 'N/A' : maxConcurrent.toFixed(2);

    // Target tokens/sec input
    const targetTokensCell = row.insertCell();
    const targetTokensInput = document.createElement('input');
    targetTokensInput.type = 'number';
    targetTokensInput.step = '5';
    targetTokensInput.min = '0';
    targetTokensInput.value = model.defaultTargetTokensPerSec;
    targetTokensInput.oninput = () => {
      model.defaultTargetTokensPerSec = parseInt(targetTokensInput.value) || 0;
      saveState();
      updateDisplay();
    };
    targetTokensCell.appendChild(targetTokensInput);
  });

  // Add hover handlers after all rows are created
  setTimeout(() => {
    document.querySelectorAll('#modelTableBody tr').forEach((row, idx) => {
      row.addEventListener('mouseenter', function() {
        hoveredModelIndex = idx;
        highlightTableRow(idx);

        // Highlight chart slices for this model if charts are visible
        if (document.getElementById('chartsContainer').style.display !== 'none') {
          const modelName = MODELS[idx].name;

          // Highlight VRAM chart
          if (vramChart && vramChart.data) {
            const vramActiveElements = [];
            vramChart.data.labels.forEach((label, i) => {
              if (label.startsWith(modelName)) {
                vramActiveElements.push({element: vramChart.getDatasetMeta(0).data[i], datasetIndex: 0, index: i});
              }
            });
            vramChart.setActiveElements(vramActiveElements);
            vramChart.update('none');
          }

          // Highlight Bandwidth chart
          if (bandwidthChart && bandwidthChart.data) {
            const bandwidthActiveElements = [];
            bandwidthChart.data.labels.forEach((label, i) => {
              if (label === modelName) {
                bandwidthActiveElements.push({element: bandwidthChart.getDatasetMeta(0).data[i], datasetIndex: 0, index: i});
              }
            });
            bandwidthChart.setActiveElements(bandwidthActiveElements);
            bandwidthChart.update('none');
          }
        }
      });

      row.addEventListener('mouseleave', function() {
        hoveredModelIndex = null;
        clearTableHighlight();
        if (document.getElementById('chartsContainer').style.display !== 'none') {
          if (vramChart) {
            vramChart.setActiveElements([]);
            vramChart.update('none');
          }
          if (bandwidthChart) {
            bandwidthChart.setActiveElements([]);
            bandwidthChart.update('none');
          }
        }
      });
    });
  }, 0);
}

// Update calculated readonly cells without re-rendering table
function updateCalculatedCells() {
  document.querySelectorAll('#modelTableBody tr').forEach(row => {
    const modelIdx = parseInt(row.dataset.modelIndex);
    if (!isNaN(modelIdx) && MODELS[modelIdx]) {
      const model = MODELS[modelIdx];

      // Update Max Concurrent cell
      const maxConcurrentCell = row.querySelector('.readonly[data-model-index="' + modelIdx + '"]');
      if (maxConcurrentCell) {
        const maxConcurrent = calculateMaxConcurrent(model);
        maxConcurrentCell.textContent = maxConcurrent === 0 ? 'N/A' : maxConcurrent.toFixed(2);
      }
    }
  });
}

// Update display (charts or error)
function updateDisplay() {
  const totalVram = currentHardware.vram;
  let totalStatic = 0;
  let totalDynamic = 0;

  MODELS.forEach(model => {
    if (model.enabled) {
      totalStatic += calculateWeightsGB(model);
      totalDynamic += model.defaultKVBudget;
    }
  });

  const totalUsed = totalStatic + totalDynamic;
  const overhead = totalUsed * 0.2;
  const totalWithOverhead = totalUsed + overhead;
  const remaining = totalVram - totalWithOverhead;

  // Update capacity display
  document.getElementById('vramCapacity').textContent = totalVram;
  document.getElementById('deficitAmount').textContent = Math.abs(remaining).toFixed(2) + ' GB';

  // Calculate bandwidth utilization
  let totalBandwidthUsed = 0;
  MODELS.forEach(model => {
    if (model.enabled) {
      totalBandwidthUsed += calculateBandwidth(model);
    }
  });

  // Update calculated table cells
  updateCalculatedCells();

  // Show error or charts based on capacity
  if (remaining < 0) {
    document.getElementById('errorMessage').style.display = 'block';
    document.getElementById('chartsContainer').style.display = 'none';
  } else {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('chartsContainer').style.display = 'flex';
    updateCharts();
  }
}

// Create striped pattern for KV cache slices
function createStripedPattern(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 10, 10);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(10, 10);
  ctx.moveTo(-2, 8);
  ctx.lineTo(2, 12);
  ctx.moveTo(8, -2);
  ctx.lineTo(12, 2);
  ctx.stroke();

  return ctx.createPattern(canvas, 'repeat');
}

// Update charts
function updateCharts() {
  const totalVram = currentHardware.vram;
  const totalBandwidth = currentHardware.bandwidth;

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];

  // VRAM Chart
  const vramLabels = [];
  const vramData = [];
  const vramBackgrounds = [];
  const modelMapping = [];

  let totalStatic = 0;
  let totalDynamic = 0;

  MODELS.forEach((model, idx) => {
    if (model.enabled) {
      const weights = calculateWeightsGB(model);
      const kvBudget = model.defaultKVBudget;

      if (weights > 0) {
        vramLabels.push(model.name + ' (Weights)');
        vramData.push(weights);
        vramBackgrounds.push(colors[idx % colors.length]);
        modelMapping.push(idx);
        totalStatic += weights;
      }

      if (kvBudget > 0) {
        vramLabels.push(model.name + ' (KV Cache)');
        vramData.push(kvBudget);
        vramBackgrounds.push(createStripedPattern(colors[idx % colors.length]));
        modelMapping.push(idx);
        totalDynamic += kvBudget;
      }
    }
  });

  const totalUsed = totalStatic + totalDynamic;
  const overhead = totalUsed * 0.2;
  const remaining = totalVram - totalUsed - overhead;

  vramLabels.push('Overhead (20%)');
  vramData.push(overhead);
  vramBackgrounds.push('#666666');
  modelMapping.push(-1);

  if (remaining > 0) {
    vramLabels.push('Available');
    vramData.push(remaining);
    vramBackgrounds.push('#2a2a2a');
    modelMapping.push(-1);
  }

  // Calculate VRAM utilization percentage for header
  const vramUtilizationPct = ((totalUsed + overhead) / totalVram * 100).toFixed(1);
  document.getElementById('vramChartHeader').textContent = `VRAM Utilization (${vramUtilizationPct}%)`;

  const vramCtx = document.getElementById('vramChart').getContext('2d');

  if (vramChart) {
    vramChart.destroy();
  }

  vramChart = new Chart(vramCtx, {
    type: 'pie',
    data: {
      labels: vramLabels,
      datasets: [{
        data: vramData,
        backgroundColor: vramBackgrounds,
        borderColor: '#1a1a1a',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const percentage = ((value / totalVram) * 100).toFixed(1);
              return label + ': ' + value.toFixed(2) + ' GB (' + percentage + '%)';
            }
          }
        },
        datalabels: {
          display: false
        }
      },
      onHover: (event, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const modelIdx = modelMapping[index];
          if (modelIdx >= 0 && hoveredModelIndex !== modelIdx) {
            hoveredModelIndex = modelIdx;
            highlightTableRow(modelIdx);
          }
        } else if (hoveredModelIndex !== null) {
          hoveredModelIndex = null;
          clearTableHighlight();
        }
      }
    }
  });

  // Bandwidth Chart
  const bandwidthLabels = [];
  const bandwidthData = [];
  const bandwidthBackgrounds = [];
  bandwidthModelMapping = []; // Reset mapping
  let totalBandwidthUsed = 0;

  MODELS.forEach((model, idx) => {
    if (model.enabled) {
      const bw = calculateBandwidth(model);
      if (bw > 0) {
        bandwidthLabels.push(model.name);
        bandwidthData.push(bw);
        bandwidthBackgrounds.push(colors[idx % colors.length]);
        bandwidthModelMapping.push(idx); // Track which model this slice is
        totalBandwidthUsed += bw;
      }
    }
  });

  const bandwidthRemaining = Math.max(0, totalBandwidth - totalBandwidthUsed);
  if (bandwidthRemaining > 0) {
    bandwidthLabels.push('Available');
    bandwidthData.push(bandwidthRemaining);
    bandwidthBackgrounds.push('#2a2a2a');
    bandwidthModelMapping.push(-1); // -1 for "Available"
  }

  const bandwidthCtx = document.getElementById('bandwidthChart').getContext('2d');

  if (bandwidthChart) {
    bandwidthChart.destroy();
  }

  const bandwidthUtil = (totalBandwidthUsed / totalBandwidth) * 100;
  document.getElementById('bandwidthChartHeader').textContent = `Bandwidth Utilization (${bandwidthUtil.toFixed(1)}%)`;

  bandwidthChart = new Chart(bandwidthCtx, {
    type: 'pie',
    data: {
      labels: bandwidthLabels,
      datasets: [{
        data: bandwidthData,
        backgroundColor: bandwidthBackgrounds,
        borderColor: '#1a1a1a',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const percentage = ((value / totalBandwidth) * 100).toFixed(1);
              return label + ': ' + value.toFixed(0) + ' GB/s (' + percentage + '%)';
            }
          }
        },
        datalabels: {
          display: false
        }
      },
      onHover: (event, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const modelIdx = bandwidthModelMapping[index];
          if (modelIdx >= 0 && hoveredModelIndex !== modelIdx) {
            hoveredModelIndex = modelIdx;
            highlightTableRow(modelIdx);
          }
        } else if (hoveredModelIndex !== null) {
          hoveredModelIndex = null;
          clearTableHighlight();
        }
      }
    }
  });
}

// Table row highlighting
function highlightTableRow(modelIndex) {
  clearTableHighlight();
  const rows = document.querySelectorAll('#modelTableBody tr');
  if (rows[modelIndex]) {
    rows[modelIndex].classList.add('highlight-row');

    // Add highlight to chart containers for visual depth
    const chartSections = document.querySelectorAll('.chart-section');
    chartSections.forEach(section => {
      section.classList.add('highlight');
    });
  }
}

function clearTableHighlight() {
  document.querySelectorAll('.highlight-row').forEach(el => {
    el.classList.remove('highlight-row');
  });

  // Remove highlight from chart containers
  document.querySelectorAll('.chart-section.highlight').forEach(el => {
    el.classList.remove('highlight');
  });
}
