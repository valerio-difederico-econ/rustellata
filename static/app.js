/* ================================================================
   Arrosticini Utility Optimizer — Frontend Engine
   ================================================================ */

'use strict';

// ── State ─────────────────────────────────────────────────────────

const state = {
  T: 200,
  t: 8,
  N: 1,
  type: 'Classic',
  salting: 'Before Cooking',
  utility: 100
};

// ── Chart Instances ────────────────────────────────────────────────

let chartT = null;
let chartTi = null;
let chartN = null;

// ── Debounce ───────────────────────────────────────────────────────

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Slider Percentage Fill ─────────────────────────────────────────

function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--pct', pct + '%');
}

// ── Initialize Particles ───────────────────────────────────────────

function initParticles() {
  const container = document.getElementById('particles');
  const count = 18;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    const size = Math.random() * 4 + 2;
    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      --dur: ${6 + Math.random() * 10}s;
      --delay: ${-Math.random() * 12}s;
      opacity: 0;
    `;
    // Alternate colors
    el.style.background = i % 3 === 0
      ? '#ffc857'
      : i % 3 === 1
      ? '#ff6b35'
      : 'rgba(167,139,250,0.7)';
    container.appendChild(el);
  }
}

// ── Chart.js Config ────────────────────────────────────────────────

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400, easing: 'easeInOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(8,12,20,0.95)',
      titleColor: '#ffc857',
      bodyColor: '#f0f0f0',
      borderColor: 'rgba(255,200,87,0.3)',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: ctx => ` U = ${ctx.parsed.y.toFixed(2)}`
      }
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#556677', font: { size: 9 }, maxTicksLimit: 8 }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#556677', font: { size: 9 } },
      beginAtZero: true
    }
  }
};

function buildGradient(ctx, color1, color2) {
  const h = ctx.canvas.clientHeight || 200;
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  return gradient;
}

function makeChartDataset(canvas, labels, values, color1, color2) {
  const ctx = canvas.getContext('2d');
  const grad = buildGradient(ctx, color1, color2);
  return {
    labels,
    datasets: [{
      data: values,
      fill: true,
      tension: 0.4,
      borderColor: color1,
      borderWidth: 2.5,
      backgroundColor: grad,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: color1,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2
    }]
  };
}

function initCharts() {
  const canvasT  = document.getElementById('chart-T');
  const canvasTi = document.getElementById('chart-t');
  const canvasN  = document.getElementById('chart-N');

  const dummyLabels = Array.from({length: 10}, (_, i) => i);
  const dummyValues = Array(10).fill(0);

  chartT = new Chart(canvasT, {
    type: 'line',
    data: makeChartDataset(canvasT, dummyLabels, dummyValues, '#ff6b35', 'rgba(255,107,53,0.03)'),
    options: { ...CHART_DEFAULTS }
  });

  chartTi = new Chart(canvasTi, {
    type: 'line',
    data: makeChartDataset(canvasTi, dummyLabels, dummyValues, '#ffc857', 'rgba(255,200,87,0.03)'),
    options: { ...CHART_DEFAULTS }
  });

  chartN = new Chart(canvasN, {
    type: 'line',
    data: makeChartDataset(canvasN, dummyLabels, dummyValues, '#00d4aa', 'rgba(0,212,170,0.03)'),
    options: { ...CHART_DEFAULTS }
  });
}

function updateChartData(chart, labels, values) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.update();
}

// ── Visual Result Renderer ─────────────────────────────────────────

const VISUAL_TIERS = {
  legendary: {
    min: 120,
    render: () => `
      <div class="legendary-crown tier-legendary">
        <span class="crown-sparkles">✨</span>
        <span class="result-emoji">🥩✨</span>
      </div>`,
    description: `🏆 <strong>Mannaggia la Madonna, so' perfette!</strong> Le tue rustèlle hanno raggiunte la perfezione assoluta. 
      L'ottimo de Bernoulli è stato toccate co' 'na mane sola. La teoria microeconomica dice che ste rustèlle so' 
      <strong>Pareto ottimali</strong> — nun se po' fa' de meglio manco a volerlo.`
  },
  good: {
    min: 50,
    render: () => `
      <div class="tier-good">
        <span class="result-emoji">🍢😋</span>
      </div>`,
    description: `👍 <strong>Bbòne, ma nun è che sei Escoffier.</strong> Le rustèlle so' passabili — se le magnasse pure nonno, 
      ma co' la faccia storta. Ce vòle ancora n'po' de lavoro su la furnacèlle. 
      Prova ad avvicinà la temperatura a T=200°C, ché la brace nun aspetta.`
  },
  bad: {
    min: 1,
    render: () => `
      <div class="tier-bad">
        <span class="result-emoji">🍡😢</span>
      </div>`,
    description: `⚠️ <strong>Gesù bbello, che roba.</strong> L'utilità marginale è pericolosamente bbassa. 
      Ste rustèlle fanno pena — o le hai còtte troppo, o troppo poco, o le hai girate comme un pazzo. 
      Torna a 200 gradi e nun rompere più.`
  },
  catastrophic: {
    min: 0,
    render: () => `
      <div class="tier-catastrophic" style="display:flex;align-items:center;gap:12px">
        <span class="result-emoji">🔥💀🔥</span>
        <div class="catastrophic-banner">
          <h2>⚡ DISASTRO CULINARIO TOTALE ⚡</h2>
          <p>Utilità = 0 · Le rustèlle so' diventate carbone puro</p>
        </div>
      </div>`,
    description: `💀 <strong>MANNAGGIA A MAMMETA E A CHI T'HA FATTO!</strong> Utilità zero. Le rustèlle nun esistono più — 
      nun so' "un po' bruciate", so' <strong>cenere</strong>. Il modello econometrico ha parlato e ha detto 
      che hai combinato un disastro. Questo è un crimine contro l'Abruzzo, la pecora e tutta la gente de Pescara.`
  }
};

function renderVisualResult(utility) {
  const content = document.getElementById('visual-content');
  const description = document.getElementById('visual-description');

  let tier;
  if (utility >= 120)      tier = VISUAL_TIERS.legendary;
  else if (utility >= 50)  tier = VISUAL_TIERS.good;
  else if (utility >= 1)   tier = VISUAL_TIERS.bad;
  else                     tier = VISUAL_TIERS.catastrophic;

  content.innerHTML = tier.render();
  description.innerHTML = tier.description;
}

// ── Score UI Update ────────────────────────────────────────────────

function updateScoreUI(utility) {
  const el = document.getElementById('utility-score');
  const bar = document.getElementById('score-bar');
  const tierLabel = document.getElementById('score-tier-label');

  // Animated number
  const prev = parseFloat(el.textContent) || 0;
  animateNumber(el, prev, utility, 400);

  // Bar fill (max displayable = 150)
  const pct = Math.min((utility / 150) * 100, 100);
  bar.style.width = pct + '%';

  // Colore & etichetta livello
  if (utility >= 120) {
    bar.style.background = 'linear-gradient(90deg, #ff9500, #ffd700)';
    tierLabel.textContent = '🏆 Leggendarie!';
    tierLabel.style.color = '#ffd700';
  } else if (utility >= 50) {
    bar.style.background = 'linear-gradient(90deg, #ff6b35, #ffc857)';
    tierLabel.textContent = '⭐ Zona Bbona';
    tierLabel.style.color = '#ffc857';
  } else if (utility >= 1) {
    bar.style.background = 'linear-gradient(90deg, #ff4500, #ff6b35)';
    tierLabel.textContent = '⚠️ Zona de Miseria';
    tierLabel.style.color = '#ff6b35';
  } else {
    bar.style.background = 'linear-gradient(90deg, #8b0000, #ff0000)';
    tierLabel.textContent = '💀 Catastrofe!';
    tierLabel.style.color = '#ff4444';
  }

  // Pop animation
  el.classList.remove('score-pop');
  void el.offsetWidth; // reflow
  el.classList.add('score-pop');
}

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function step(ts) {
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = (from + (to - from) * eased).toFixed(2);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = to.toFixed(2);
  }
  requestAnimationFrame(step);
}

// ── Pills Update ───────────────────────────────────────────────────

function updatePills() {
  document.getElementById('pill-T').textContent = `Calore=${state.T}°C`;
  document.getElementById('pill-t').textContent = `Tempe=${state.t}min`;
  document.getElementById('pill-N').textContent = `Girate=${state.N}`;
}

// ── Formula Display ────────────────────────────────────────────────

const M_MAP = { Classic: 100, Medium: 120, Artisanal: 150 };
const S_MAP = { 'Before Cooking': 1.0, 'During Cooking': 0.8, 'After Cooking': 0.4 };

function updateFormulaDisplay() {
  const M = M_MAP[state.type];
  const S = S_MAP[state.salting];
  const T = state.T;
  const t = state.t;
  const N = state.N;
  const formula = `U = ${S} × max(0, ${M} − 0.1(${T}−200)² − 2(${t}−8)² − 15(${N}−1)²)  →  Se esce zero, hai sbagliato tutto.`;
  document.getElementById('formula-display').textContent = formula;
}

// ── API Call ───────────────────────────────────────────────────────

const debouncedFetch = debounce(fetchUtility, 120);

async function fetchUtility() {
  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temperature: state.T,
        time: state.t,
        turns: state.N,
        type: state.type,
        salting: state.salting
      })
    });
    const data = await res.json();
    state.utility = data.utility;

    updateScoreUI(data.utility);
    updatePills();
    updateFormulaDisplay();
    renderVisualResult(data.utility);

    // Update badge labels
    document.getElementById('badge-M').textContent = `M = ${data.M}`;
    document.getElementById('badge-S').textContent = `S = ${data.S}`;
    document.getElementById('pill-M').textContent = `M=${data.M}`;
    document.getElementById('pill-S').textContent = `S=${data.S}`;

    // Update charts
    updateChartData(chartT,  data.curves.temperature.labels, data.curves.temperature.values);
    updateChartData(chartTi, data.curves.time.labels,        data.curves.time.values);
    updateChartData(chartN,  data.curves.turns.labels,       data.curves.turns.values);

    // Add current-point annotation marker on charts
    highlightCurrentPoint(chartT,  state.T,  data.curves.temperature.labels);
    highlightCurrentPoint(chartTi, state.t,  data.curves.time.labels);
    highlightCurrentPoint(chartN,  state.N,  data.curves.turns.labels);

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

function highlightCurrentPoint(chart, currentVal, labels) {
  // Find nearest label index
  let minDist = Infinity;
  let idx = 0;
  labels.forEach((l, i) => {
    const d = Math.abs(parseFloat(l) - currentVal);
    if (d < minDist) { minDist = d; idx = i; }
  });

  const dataset = chart.data.datasets[0];
  const pointRadii = labels.map((_, i) => i === idx ? 7 : 0);
  const pointBgs   = labels.map((_, i) => i === idx ? '#ffffff' : dataset.borderColor);

  dataset.pointRadius = pointRadii;
  dataset.pointBackgroundColor = pointBgs;
  chart.update('none');
}

// ── Event Listeners ────────────────────────────────────────────────

function bindControls() {
  // Temperature slider
  const sliderT = document.getElementById('temperature');
  sliderT.addEventListener('input', () => {
    state.T = parseFloat(sliderT.value);
    document.getElementById('val-T').textContent = `${state.T}°C`;
    updateSliderFill(sliderT);
    debouncedFetch();
  });

  // Time slider
  const sliderTi = document.getElementById('grill-time');
  sliderTi.addEventListener('input', () => {
    state.t = parseFloat(sliderTi.value);
    document.getElementById('val-t').textContent = `${state.t} min`;
    updateSliderFill(sliderTi);
    debouncedFetch();
  });

  // Turns slider
  const sliderN = document.getElementById('num-turns');
  sliderN.addEventListener('input', () => {
    state.N = parseInt(sliderN.value, 10);
    document.getElementById('val-N').textContent = `${state.N}`;
    updateSliderFill(sliderN);
    debouncedFetch();
  });

  // Type dropdown
  document.getElementById('arrosticini-type').addEventListener('change', e => {
    state.type = e.target.value;
    debouncedFetch();
  });

  // Salting dropdown
  document.getElementById('salting-timing').addEventListener('change', e => {
    state.salting = e.target.value;
    debouncedFetch();
  });

  // Init fills
  [sliderT, sliderTi, sliderN].forEach(updateSliderFill);
}

// ── Share Result ───────────────────────────────────────────────────

function shareResult() {
  const params = new URLSearchParams({
    T: state.T,
    t: state.t,
    N: state.N,
    type: state.type,
    salting: state.salting,
    U: state.utility.toFixed(2)
  });
  const url = `${window.location.origin}/?${params.toString()}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast());
  } else {
    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast();
  }
}

function showToast() {
  const toast = document.getElementById('share-toast');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ── Load from URL Params ───────────────────────────────────────────

function loadFromParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('T')) {
    state.T = parseFloat(params.get('T'));
    const sl = document.getElementById('temperature');
    sl.value = state.T;
    document.getElementById('val-T').textContent = `${state.T}°C`;
    updateSliderFill(sl);
  }
  if (params.get('t')) {
    state.t = parseFloat(params.get('t'));
    const sl = document.getElementById('grill-time');
    sl.value = state.t;
    document.getElementById('val-t').textContent = `${state.t} min`;
    updateSliderFill(sl);
  }
  if (params.get('N')) {
    state.N = parseInt(params.get('N'), 10);
    const sl = document.getElementById('num-turns');
    sl.value = state.N;
    document.getElementById('val-N').textContent = `${state.N}`;
    updateSliderFill(sl);
  }
  if (params.get('type')) {
    state.type = params.get('type');
    document.getElementById('arrosticini-type').value = state.type;
  }
  if (params.get('salting')) {
    state.salting = params.get('salting');
    document.getElementById('salting-timing').value = state.salting;
  }
}

// ── Boot ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCharts();
  bindControls();
  loadFromParams();
  fetchUtility();
});
