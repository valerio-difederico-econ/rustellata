import { DEFAULT_PLAN, PRODUCTS, GRILLS, calculatePlan, buildShoppingText } from './planner-engine.js?v=4';

const STORAGE_KEY = 'rustellata-plan-v2';
const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const decimal = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 3 });
const whole = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 });
const byId = id => document.getElementById(id);
const keys = Object.keys(DEFAULT_PLAN);
const mealPortions = { main: 20, mixed: 10, multi: 6 };
const wizardSteps = ['company', 'spending', 'grill'];
const stepLabels = { company: 'La compagnia', spending: 'La spesa', grill: 'La fornacella' };
const stepFields = {
  company: ['people', 'portion', 'extraPercent'],
  spending: ['productPreset', 'weight', 'priceMode', 'pricePerKg', 'packPieces', 'packPrice', 'purchaseMode', 'budgetPerPerson'],
  grill: ['grillModel'],
};
let currentInput = { ...DEFAULT_PLAN };
let currentResult = null;
let activeStep = 'company';
let maxReached = 0;
let planPublished = false;
let validationAttempted = false;
let saveTimer;
let toastTimer;

function put(id, value) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function duration(minutes) {
  const rounded = Math.ceil(minutes);
  if (rounded < 60) return `${rounded} min`;
  const remainder = rounded % 60;
  return `${Math.floor(rounded / 60)} h${remainder ? ` ${remainder} min` : ''}`;
}

function toast(message) {
  const element = byId('toast');
  if (!element) return;
  clearTimeout(toastTimer);
  element.textContent = message;
  element.hidden = false;
  toastTimer = setTimeout(() => { element.hidden = true; }, 4500);
}

function knownInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const result = { ...DEFAULT_PLAN };
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) result[key] = value[key];
  }
  return result;
}

function readInitialPlan() {
  const shared = new URLSearchParams(window.location.search).get('plan');
  if (shared !== null) {
    try {
      if (shared.length > 12000) throw new Error('Piano troppo lungo');
      const input = knownInput(JSON.parse(shared));
      if (!input) throw new Error('Formato non valido');
      const result = calculatePlan(input);
      if (!result.valid) throw new Error('Dati non validi');
      return { input: result.input || input, shared: true };
    } catch {
      return { input: { ...DEFAULT_PLAN }, message: 'Il link contiene dati non validi. Abbiamo caricato un nuovo piano.' };
    }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const input = knownInput(JSON.parse(saved));
      if (input) {
        const result = calculatePlan(input);
        if (result.valid) return { input: result.input || input };
      }
    }
  } catch {
    // Local storage may be disabled; the planner remains usable.
  }
  return { input: { ...DEFAULT_PLAN } };
}

function writeForm(input) {
  currentInput = { ...DEFAULT_PLAN, ...input };
  for (const key of keys) {
    const element = byId(key);
    if (element && key !== 'purchaseMode') element.value = currentInput[key];
  }
  for (const radio of document.querySelectorAll('input[name="purchaseMode"]')) {
    radio.checked = radio.value === currentInput.purchaseMode;
  }
  if (byId('priceMode')) byId('priceMode').value = currentInput.priceMode || 'estimate';
  if (byId('custom-purchase')) byId('custom-purchase').open = currentInput.priceMode === 'custom';
  updateContext();
}

function readForm() {
  const input = { ...currentInput };
  for (const key of keys) {
    if (key === 'purchaseMode') continue;
    const element = byId(key);
    if (!element) continue;
    if (typeof DEFAULT_PLAN[key] === 'number') {
      input[key] = element.value.trim() === '' ? Number.NaN : Number(element.value);
    } else {
      input[key] = element.value;
    }
  }
  input.purchaseMode = document.querySelector('input[name="purchaseMode"]:checked')?.value || DEFAULT_PLAN.purchaseMode;
  return input;
}

function updateContext() {
  const product = PRODUCTS.find(item => item.id === (byId('productPreset')?.value || currentInput.productPreset));
  const customProduct = !product;
  let priceMode = byId('priceMode')?.value || currentInput.priceMode || 'estimate';
  if (customProduct) {
    priceMode = 'custom';
    if (byId('priceMode')) byId('priceMode').value = 'custom';
  }
  const customPrice = priceMode === 'custom';
  if (byId('weight-field')) byId('weight-field').hidden = !customProduct;
  if (byId('weight')) {
    byId('weight').readOnly = !customProduct;
    if (product) byId('weight').value = product.weight;
  }
  if (byId('custom-price-fields')) byId('custom-price-fields').hidden = !customPrice;
  if (byId('priceMode')) byId('priceMode').disabled = customProduct;
  if (!customPrice) {
    for (const radio of document.querySelectorAll('input[name="purchaseMode"]')) radio.checked = radio.value === 'kg';
  }
  const mode = customPrice
    ? document.querySelector('input[name="purchaseMode"]:checked')?.value || currentInput.purchaseMode
    : 'kg';
  if (byId('kg-fields')) byId('kg-fields').hidden = mode !== 'kg';
  if (byId('pack-fields')) byId('pack-fields').hidden = mode !== 'packs';
  for (const button of document.querySelectorAll('[data-meal]')) {
    const selected = button.dataset.meal === (byId('meal')?.value || currentInput.meal);
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
  put('product-reference', product ? `${product.label} · ${product.weight} g per pezzo` : 'Il tuo formato personalizzato');
  if (customPrice) put('price-reference', 'La previsione usa il prezzo che hai inserito in Personalizza.');
  else if (product && Number.isFinite(product.pricePerKg)) {
    const low = product.priceLow;
    const high = product.priceHigh;
    put('price-reference', `${euro.format(product.pricePerKg)}/kg di riferimento${Number.isFinite(low) && Number.isFinite(high) ? ` · fascia indicativa ${euro.format(low)}–${euro.format(high)}/kg` : ''}.`);
  } else put('price-reference', 'Il prezzo di riferimento del formato viene applicato automaticamente.');
  put('price-basis', customPrice
    ? 'Prezzo personalizzato: la fascia dei listini non viene applicata al tuo acquisto.'
    : product?.priceNote || 'Riferimento dai listini consultati. Trasporto escluso.');
  const grillId = byId('grillModel')?.value || currentInput.grillModel;
  const grill = GRILLS.find(item => item.id === grillId);
  if (byId('grill-reference')) {
    byId('grill-reference').textContent = grill
      ? `${grill.label} · ${grill.effectiveCapacity} arrosticini per cuociata`
      : 'Scegli una delle tre dimensioni per calcolare le cuociate.';
  }
  const minutes = product?.batchMinutes || currentInput.batchMinutes;
  put('time-reference', `Prevediamo ${minutes} minuti per cuociata, 25 minuti per preparare la brace e 2 minuti di cambio tra un giro e l’altro. Sono ipotesi per organizzare il servizio.`);
}

function showValidation(result) {
  const errors = result.errors || [];
  for (const key of keys) {
    const element = byId(key);
    if (!element) continue;
    const error = errors.find(item => item.field === key);
    if (error) {
      element.setAttribute('aria-invalid', 'true');
      const descriptions = new Set((element.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
      descriptions.add('field-error');
      element.setAttribute('aria-describedby', [...descriptions].join(' '));
    } else {
      element.removeAttribute('aria-invalid');
      const descriptions = (element.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== 'field-error');
      if (descriptions.length) element.setAttribute('aria-describedby', descriptions.join(' '));
      else element.removeAttribute('aria-describedby');
    }
    const errorElement = byId(`${key}-error`);
    if (errorElement) {
      errorElement.textContent = error?.message || '';
      errorElement.hidden = !error;
    }
  }
  const summary = byId('field-error');
  if (summary) {
    summary.hidden = result.valid;
    summary.textContent = result.valid ? '' : errors.map(item => item.message).join(' ');
  }
  for (const id of ['copy-plan', 'share-plan', 'print-plan']) {
    if (byId(id)) byId(id).disabled = !planPublished || !currentResult?.valid;
  }
}

function errorsForStep(result, step = activeStep) {
  return (result?.errors || []).filter(error => stepFields[step].includes(error.field));
}

function showStepErrors(errors) {
  showValidation({ valid: errors.length === 0, errors });
}

function focusError(errors) {
  const element = byId(errors[0]?.field);
  if (!element) return;
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
  element.focus();
  element.scrollIntoView({ behavior: 'auto', block: 'center' });
}

function updateWizard() {
  const index = wizardSteps.indexOf(activeStep);
  for (const button of document.querySelectorAll('[data-tab]')) {
    const buttonIndex = wizardSteps.indexOf(button.dataset.tab);
    const unavailable = planPublished || buttonIndex > maxReached;
    button.disabled = unavailable;
    button.setAttribute('aria-disabled', String(unavailable));
    button.classList.toggle('completed', buttonIndex < maxReached);
  }
  put('wizard-progress', planPublished ? 'Piano della serata pronto' : `Passaggio ${index + 1} di 3 · ${stepLabels[activeStep]}`);
  put('wizard-help', planPublished
    ? 'Ecco la spesa e il programma della tua rustellata. Puoi copiare la lista o modificare i dati.'
    : 'Completa i tre passaggi. Alla fine ti mostreremo la spesa e il piano delle cuociate.');
  if (byId('plan-form')) byId('plan-form').hidden = planPublished;
  if (byId('piano')) byId('piano').hidden = !planPublished;
  document.querySelector('.planner-layout')?.classList.toggle('has-plan', planPublished);
  if (byId('results-content')) byId('results-content').hidden = !planPublished;
  if (byId('results-invalid')) byId('results-invalid').hidden = true;
  for (const id of ['copy-plan', 'share-plan', 'print-plan']) {
    if (byId(id)) byId(id).disabled = !planPublished || !currentResult?.valid;
  }
}

function renderBatches(result) {
  const container = byId('batch-visual');
  if (!container) return;
  container.replaceChildren();
  const input = result.input || currentInput;
  const visible = Math.min(result.batches, 12);
  for (let index = 0; index < visible; index++) {
    const count = index === result.batches - 1 ? result.lastBatchPieces : input.effectiveCapacity;
    const pill = document.createElement('span');
    pill.className = 'batch-pill';
    pill.style.setProperty('--fill', `${Math.min(100, count / input.effectiveCapacity * 100)}%`);
    pill.textContent = whole.format(count);
    pill.title = `Cuociata ${index + 1}: ${count} arrosticini`;
    pill.setAttribute('aria-label', pill.title);
    container.append(pill);
  }
  if (result.batches > visible) {
    const remainder = document.createElement('span');
    remainder.className = 'batch-more';
    remainder.textContent = `+${whole.format(result.batches - visible)} cuociate`;
    container.append(remainder);
  }
}

function renderResult(result) {
  const input = result.input || currentInput;
  const over = result.balance < 0;
  const atRisk = !over && Boolean(result.budgetAtRisk);
  const estimated = input.priceMode !== 'custom';
  const buyPacks = input.purchaseMode === 'packs';
  put('result-event', String(input.eventName || DEFAULT_PLAN.eventName).slice(0, 80));
  put('result-pieces', whole.format(result.requiredPieces));
  put('result-weight', `${decimal.format(result.weightKg)} kg`);
  put('result-cost', euro.format(result.cost));
  put('result-cost-label', estimated ? 'Spesa stimata per la carne' : 'Spesa per la carne');
  put('result-cost-range', estimated && Number.isFinite(result.costLow) && Number.isFinite(result.costHigh)
    ? `Fascia indicativa: ${euro.format(result.costLow)}–${euro.format(result.costHigh)}. Il prezzo finale dipende dal venditore.`
    : 'Calcolata con il prezzo personalizzato.');
  put('result-per-person', euro.format(result.costPerPerson));
  put('result-budget', euro.format(result.meatBudget));
  put('result-reserve', over ? 'Quota esaurita' : euro.format(result.remainingPerPerson));
  put('rest-detail', over ? `Mancano ${euro.format(-result.balance)} già per gli arrosticini. Aumenta la quota o modifica le porzioni.` : `${euro.format(result.remainingBudget)} totali (${euro.format(result.remainingPerPerson)} a testa) da distribuire tra bevande, contorni, carbone e accessori. Queste spese non sono ancora stimate.`);
  put('result-balance', `${euro.format(Math.abs(result.balance))} ${over ? 'mancanti' : 'rimasti'}`);
  put('budget-status', over ? 'La quota non copre gli arrosticini' : atRisk ? 'La fascia alta supera la quota' : 'Disponibile per il resto');
  byId('budget-status')?.classList.toggle('over', over);
  byId('budget-status')?.classList.toggle('within', !over && !atRisk);
  byId('budget-status')?.classList.toggle('at-risk', atRisk);
  put('budget-detail', `${input.people} persone × ${euro.format(input.budgetPerPerson)} = ${euro.format(result.totalBudget)}. Meno ${euro.format(result.cost)} di arrosticini${over ? `: mancano ${euro.format(-result.balance)}` : `: restano ${euro.format(result.remainingBudget)}`}.${estimated ? ` Residuo indicativo: ${euro.format(result.balanceLow)}–${euro.format(result.balanceHigh)}.` : ''}`);
  if (byId('budget-fill')) {
    const percent = result.meatBudget > 0 ? result.cost / result.meatBudget * 100 : result.cost > 0 ? 100 : 0;
    byId('budget-fill').style.width = `${Math.max(0, Math.min(100, percent))}%`;
    byId('budget-fill').classList.toggle('over', over);
    byId('budget-fill').classList.toggle('at-risk', atRisk);
  }
  put('purchase-detail', buyPacks
    ? `${whole.format(result.packs)} confezion${result.packs === 1 ? 'e' : 'i'} da ${whole.format(input.packPieces)} · ${whole.format(result.purchasedPieces)} pezzi · circa ${decimal.format(result.purchasedWeightKg)} kg acquistati`
    : `${decimal.format(result.purchasedWeightKg)} kg da acquistare · ${euro.format(input.pricePerKg)}/kg ${estimated ? 'di riferimento' : 'personalizzato'}`);
  put('leftover-detail', result.leftoverPieces > 0
    ? `${whole.format(result.leftoverPieces)} pezzi oltre il piano, per l'arrotondamento alle confezioni.`
    : 'Acquisto su misura, senza eccedenze da confezionamento.');
  put('result-extra', result.extraPieces > 0
    ? `${whole.format(result.basePieces)} previsti + ${whole.format(result.extraPieces)} di scorta`
    : `${whole.format(input.portion)} a testa · nessuna scorta extra`);
  put('result-batches', whole.format(result.batches));
  put('result-capacity', `${whole.format(input.effectiveCapacity)} pezzi`);
  put('result-round-serving', `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(result.piecesPerPersonPerBatch)} pezzi`);
  put('result-total-time', duration(result.totalMinutes));
  put('result-cooking-time', duration(result.cookingMinutes));
  put('batch-detail', `Ultima cuociata: ${whole.format(result.lastBatchPieces)} pezzi. La scorta scelta è inclusa; le eccedenze delle confezioni restano fuori dal piano di cottura.`);
  renderBatches(result);
  const comparison = byId('comparison-box');
  const showComparison = (over || atRisk) && result.maxPortionWithinBudget < input.portion;
  if (comparison) comparison.hidden = !showComparison;
  if (showComparison) {
    const maximum = result.maxPortionWithinBudget;
    put('comparison-text', maximum >= 1
      ? `Con lo stesso formato e la stessa scorta, ${estimated ? 'considerando la fascia alta dei prezzi, ' : ''}nel budget entrano fino a ${maximum} arrosticini a persona. Applica la proposta se questa porzione ti va bene.`
      : 'Il budget disponibile non copre neppure un arrosticino a persona con queste condizioni di acquisto. Modifica il prezzo, la confezione o il budget.');
    if (byId('apply-budget')) {
      byId('apply-budget').disabled = maximum < 1;
      byId('apply-budget').textContent = maximum >= 1 ? `Passa a ${maximum} a testa` : 'Budget insufficiente';
    }
  }
}

function queueSave(input) {
  clearTimeout(saveTimer);
  put('save-state', 'Salvataggio…');
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
      put('save-state', 'Salvato su questo dispositivo');
    } catch {
      put('save-state', 'Piano disponibile per questa sessione');
    }
  }, 300);
}

function recalculate({ save = true, invalidate = true, amendPublished = false } = {}) {
  if (invalidate && !amendPublished) {
    planPublished = false;
    maxReached = Math.min(maxReached, wizardSteps.indexOf(activeStep));
  }
  updateContext();
  currentInput = readForm();
  currentResult = calculatePlan(currentInput);
  if (currentResult.valid) {
    currentInput = { ...currentResult.input };
    updateContext();
    if (amendPublished && planPublished) renderResult(currentResult);
    if (save) queueSave(currentResult.input || currentInput);
  } else {
    clearTimeout(saveTimer);
    put('save-state', 'Completa i campi per aggiornare il piano');
  }
  showStepErrors(validationAttempted ? errorsForStep(currentResult) : []);
  updateWizard();
  return currentResult;
}

function activateTab(name, focus = false) {
  const index = wizardSteps.indexOf(name);
  if (index < 0 || index > maxReached || planPublished) return false;
  activeStep = name;
  validationAttempted = false;
  for (const button of document.querySelectorAll('[data-tab]')) {
    const selected = button.dataset.tab === name;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    const panel = byId(`panel-${button.dataset.tab}`);
    if (panel) panel.hidden = !selected;
  }
  showStepErrors([]);
  updateWizard();
  if (focus) {
    document.querySelector(`[data-tab="${name}"]`)?.focus();
    byId('plan-form')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  return true;
}

function nextStep(target) {
  const index = wizardSteps.indexOf(activeStep);
  if (wizardSteps[index + 1] !== target || planPublished) return;
  validationAttempted = true;
  const result = recalculate({ invalidate: false });
  const errors = errorsForStep(result);
  showStepErrors(errors);
  if (errors.length) {
    focusError(errors);
    return;
  }
  maxReached = index + 1;
  activateTab(target, true);
}

function publishPlan() {
  if (planPublished || activeStep !== 'grill' || maxReached < 2) return;
  const result = recalculate({ invalidate: false });
  if (!result.valid) {
    const firstError = result.errors[0];
    const step = wizardSteps.find(name => stepFields[name].includes(firstError?.field)) || 'company';
    activateTab(step, true);
    validationAttempted = true;
    const errors = errorsForStep(result, step);
    showStepErrors(errors.length ? errors : result.errors);
    focusError(errors.length ? errors : result.errors);
    return;
  }
  planPublished = true;
  showStepErrors([]);
  renderResult(result);
  updateWizard();
  const heading = byId('result-heading');
  heading?.focus({ preventScroll: true });
  (heading || byId('piano'))?.scrollIntoView({ behavior: 'auto', block: 'start' });
}

function returnToEditing() {
  planPublished = false;
  maxReached = 0;
  validationAttempted = false;
  if (byId('copy-fallback')) byId('copy-fallback').hidden = true;
  activateTab('company', true);
}

async function copyText(text, success) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    if (byId('copy-fallback')) byId('copy-fallback').hidden = true;
    toast(success);
  } catch {
    const fallback = byId('copy-fallback');
    if (fallback) {
      fallback.value = text;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
    }
    toast('Copia il testo selezionato con il comando Copia del tuo dispositivo.');
  }
}

function attachEvents() {
  for (const key of keys) {
    const element = byId(key);
    if (!element || ['purchaseMode', 'productPreset', 'grillModel', 'priceMode'].includes(key)) continue;
    element.addEventListener('input', () => {
      recalculate();
    });
  }
  for (const radio of document.querySelectorAll('input[name="purchaseMode"]')) {
    radio.addEventListener('change', () => recalculate());
  }
  byId('productPreset')?.addEventListener('change', event => {
    const product = PRODUCTS.find(item => item.id === event.target.value);
    if (byId('priceMode')) byId('priceMode').value = product ? 'estimate' : 'custom';
    if (!product && byId('custom-purchase')) byId('custom-purchase').open = true;
    if (product) byId('weight').value = product.weight;
    recalculate();
  });
  byId('grillModel')?.addEventListener('change', () => recalculate());
  byId('priceMode')?.addEventListener('change', event => {
    if (event.target.value === 'custom' && currentResult?.valid) {
      if (byId('pricePerKg')) byId('pricePerKg').value = currentResult.input.pricePerKg;
    }
    recalculate();
  });
  for (const button of document.querySelectorAll('[data-meal]')) {
    button.addEventListener('click', () => {
      const meal = button.dataset.meal;
      currentInput.meal = meal;
      if (byId('meal')) byId('meal').value = meal;
      if (byId('portion')) byId('portion').value = mealPortions[meal];
      recalculate();
    });
  }
  for (const button of document.querySelectorAll('[data-step]')) {
    button.addEventListener('click', () => {
      const element = byId(button.dataset.field);
      if (!element) return;
      const value = Number(element.value);
      if (!Number.isFinite(value)) return;
      const next = value + Number(button.dataset.delta);
      const min = element.min === '' ? -Infinity : Number(element.min);
      const max = element.max === '' ? Infinity : Number(element.max);
      element.value = Math.max(min, Math.min(max, next));
      recalculate();
    });
  }
  const tabs = [...document.querySelectorAll('[data-tab]')];
  for (const button of tabs) {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
    button.addEventListener('keydown', event => {
      const available = tabs.filter(tab => !tab.disabled);
      const index = available.indexOf(button);
      if (index < 0) return;
      let target;
      if (event.key === 'ArrowRight') target = available[(index + 1) % available.length];
      if (event.key === 'ArrowLeft') target = available[(index - 1 + available.length) % available.length];
      if (event.key === 'Home') target = available[0];
      if (event.key === 'End') target = available.at(-1);
      if (target) {
        event.preventDefault();
        activateTab(target.dataset.tab, true);
      }
    });
  }
  for (const button of document.querySelectorAll('[data-next]')) {
    button.addEventListener('click', () => nextStep(button.dataset.next));
  }
  for (const button of document.querySelectorAll('[data-back]')) {
    button.addEventListener('click', () => activateTab(button.dataset.back, true));
  }
  byId('show-plan')?.addEventListener('click', publishPlan);
  byId('edit-plan')?.addEventListener('click', returnToEditing);
  byId('apply-budget')?.addEventListener('click', () => {
    if (!planPublished || !currentResult?.valid || currentResult.maxPortionWithinBudget < 1) return;
    byId('portion').value = currentResult.maxPortionWithinBudget;
    recalculate({ invalidate: false, amendPublished: true });
    toast('Porzione aggiornata. La proposta mantiene formato e scorta.');
  });
  byId('copy-plan')?.addEventListener('click', () => {
    if (planPublished && currentResult?.valid) copyText(buildShoppingText(currentResult.input || currentInput, currentResult), 'Lista della spesa copiata. Pronta per il gruppo!');
  });
  byId('share-plan')?.addEventListener('click', () => {
    if (!planPublished || !currentResult?.valid) return;
    if (window.location.protocol === 'file:') {
      toast('Per condividere da questo file usa Copia la lista. Il link richiede una versione online.');
      return;
    }
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    const plan = knownInput(currentResult.input || currentInput);
    url.searchParams.set('plan', JSON.stringify(plan));
    copyText(url.toString(), 'Link al piano copiato.');
  });
  byId('print-plan')?.addEventListener('click', () => {
    if (planPublished && currentResult?.valid) window.print();
  });
  byId('reset-plan')?.addEventListener('click', () => {
    clearTimeout(saveTimer);
    planPublished = false;
    maxReached = 0;
    validationAttempted = false;
    writeForm(DEFAULT_PLAN);
    const url = new URL(window.location.href);
    url.searchParams.delete('plan');
    try { window.history.replaceState(null, '', url); } catch { /* Embedded previews may restrict history. */ }
    if (byId('copy-fallback')) byId('copy-fallback').hidden = true;
    recalculate({ invalidate: false });
    activateTab('company', true);
    toast('Nuovo piano: ripartiamo dai valori iniziali.');
  });
  // Avoid accidental form submission from number inputs or the Enter key.
  document.querySelector('form')?.addEventListener('submit', event => event.preventDefault());
}

function boot() {
  // Importing the catalogue keeps preset definitions tied to the shared engine.
  if (!Array.isArray(PRODUCTS) || !Array.isArray(GRILLS)) throw new Error('Catalogo non disponibile');
  if (byId('eventName')) byId('eventName').maxLength = 80;
  const initial = readInitialPlan();
  writeForm(initial.input);
  attachEvents();
  activateTab('company');
  recalculate({ invalidate: false });
  if (window.location.hash === '#piano') {
    const url = new URL(window.location.href);
    url.hash = '';
    try { window.history.replaceState(null, '', url); } catch { /* Keep the result hidden even when history is restricted. */ }
    byId('plan-form')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  if (initial.message) toast(initial.message);
  else if (initial.shared) toast('Dati condivisi caricati. Completa i tre passaggi per vedere il piano.');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
