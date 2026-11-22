/**
 * Calcoli del piano: catalogo di riferimento esplicito e nessuna richiesta di rete.
 * I preset fissano le caratteristiche; solo il prezzo può essere personalizzato.
 * Gli importi del piano sono arrotondati al centesimo.
 */
export const DEFAULT_PLAN = Object.freeze({
  eventName: 'La prossima rustellata',
  people: 10,
  meal: 'main',
  portion: 20,
  productPreset: 'classic',
  weight: 23,
  priceMode: 'estimate',
  pricePerKg: 22,
  purchaseMode: 'kg',
  packPieces: 112,
  packPrice: 79,
  budgetPerPerson: 20,
  extraPercent: 0,
  grillModel: 'inox80',
  nominalCapacity: 50,
  effectiveCapacity: 30,
  batchMinutes: 8,
  prepMinutes: 25,
  changeMinutes: 2,
});

// Grammature nominali; prezzi di riferimento e intervalli verificati separatamente.
// I riferimenti sono scelte editoriali informate dai listini, non medie di mercato.
// Gli intervalli includono formati vicini: vedere docs/SOURCES.md (22/11/2026).
// I tempi sono ipotesi organizzative, non istruzioni.
export const PRODUCTS = Object.freeze([
  { id: 'classic', label: 'Classici', weight: 23, pricePerKg: 22, priceLow: 20, priceHigh: 25, priceNote: 'Riferimento da listini di formati classici vicini, da 20 a 25 g. Trasporto escluso.', batchMinutes: 8, source: 'https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-piccoli-da-20g-al-pezzo/' },
  { id: 'intermediate', label: 'Intermedi', weight: 25, pricePerKg: 25, priceLow: 20, priceHigh: 27, priceNote: 'Riferimento da un listino da 25 g e da formati vicini. Fascia indicativa, trasporto escluso.', batchMinutes: 8, source: 'https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-intermedi-da-25g-al-pezzo/' },
  { id: 'medium', label: 'Medi', weight: 30, pricePerKg: 22, priceLow: 20, priceHigh: 27, priceNote: 'Riferimento da listini da 30 g e formati vicini da 33–34 g. Trasporto escluso.', batchMinutes: 10, source: 'https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-medi-da-32g-in-cartoncino/' },
  { id: 'handmade', label: 'Fatti interamente a mano', weight: 30, pricePerKg: 30, priceLow: 24, priceHigh: 32, priceNote: 'Riferimento da listini artigianali; alcuni indicano 30–33 g o non precisano il peso. Fascia indicativa, trasporto escluso.', batchMinutes: 10, source: 'https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-fatti-a-mano-da-30g/' },
  { id: 'large', label: 'Grandi, lavorati a mano', weight: 38, pricePerKg: 26.5, priceLow: 20, priceHigh: 27, priceNote: 'Riferimento da un’offerta da 38 g e listini vicini da 34–40 g. Fascia di pianificazione, trasporto escluso.', batchMinutes: 10, source: 'https://www.abruzzoarrosticini.it/p/arrosticini-abruzzesi-lavorati-a-mano-da-38g/' },
].map(Object.freeze));

// Capienze nominali commerciali; carichi prudenziali fissi per pianificare il servizio.
// I carichi effettivi sono ipotesi del calcolatore, non misurazioni del produttore.
export const GRILLS = Object.freeze([
  { id: 'inox50', label: 'Piccola', nominalCapacity: 30, effectiveCapacity: 20, cookingArea: '39 × 11 cm', source: 'https://www.abruzzoarrosticini.it/p/fornacella-per-arrosticini-in-inox-da-50-cm/' },
  { id: 'inox80', label: 'Media', nominalCapacity: 50, effectiveCapacity: 30, cookingArea: '69 × 11 cm', source: 'https://www.abruzzoarrosticini.it/p/fornacella-per-arrosticini-in-inox-da-80-cm/' },
  { id: 'inox110', label: 'Grande', nominalCapacity: 70, effectiveCapacity: 45, cookingArea: '97 × 11 cm', source: 'https://www.abruzzoarrosticini.it/p/fornacella-per-arrosticini-in-inox-da-110-cm/' },
].map(Object.freeze));

// Decimal exponent shifting avoids binary half-cent errors (10.075 → 10.08).
const cents = value => {
  const [coefficient, exponent = '0'] = String(value).split('e');
  return Math.round(Number(`${coefficient}e${Number(exponent) + 2}`));
};
const euros = value => value / 100;
const money = value => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
const decimal = value => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 3 }).format(value);

/** Returns an invalid result rather than silently clamping a user's quantities. */
export function calculatePlan(raw = {}) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ field: 'plan', message: 'Il piano deve essere un oggetto.' }], input: {} };
  }
  const merged = { ...DEFAULT_PLAN, ...raw };
  const productPreset = [...PRODUCTS.map(product => product.id), 'custom'].includes(merged.productPreset) ? merged.productPreset : DEFAULT_PLAN.productPreset;
  const product = PRODUCTS.find(item => item.id === productPreset);
  const grill = GRILLS.find(item => item.id === merged.grillModel) || GRILLS.find(item => item.id === DEFAULT_PLAN.grillModel);
  const priceMode = productPreset === 'custom' ? 'custom' : merged.priceMode;
  // Derive before validation: stale or tampered hidden values cannot override a preset.
  if (product) {
    merged.weight = product.weight;
    merged.batchMinutes = product.batchMinutes;
    if (priceMode === 'estimate') {
      merged.pricePerKg = product.pricePerKg;
      merged.purchaseMode = 'kg';
    }
  } else merged.batchMinutes = Number(merged.weight) >= 30 ? 10 : 8;
  merged.nominalCapacity = grill.nominalCapacity;
  merged.effectiveCapacity = grill.effectiveCapacity;
  merged.prepMinutes = DEFAULT_PLAN.prepMinutes;
  merged.changeMinutes = DEFAULT_PLAN.changeMinutes;
  const input = {
    eventName: typeof merged.eventName === 'string' ? merged.eventName.trim().slice(0, 80) || DEFAULT_PLAN.eventName : DEFAULT_PLAN.eventName,
    meal: ['main', 'mixed', 'multi', 'courses', 'custom'].includes(merged.meal) ? merged.meal : 'custom',
    productPreset,
    grillModel: grill.id,
    priceMode,
    purchaseMode: merged.purchaseMode,
  };
  if (!['estimate', 'custom'].includes(input.priceMode)) errors.push({ field: 'priceMode', message: 'Scegli stima automatica oppure prezzo personalizzato.' });
  if (!['kg', 'packs'].includes(input.purchaseMode)) {
    errors.push({ field: 'purchaseMode', message: 'Scegli acquisto al kg oppure a confezioni.' });
  }
  function number(field, label, min, max, integer = false, active = true) {
    const value = merged[field];
    const numeric = (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) ? Number(value) : NaN;
    if (!Number.isFinite(numeric) || numeric < min || numeric > max || (integer && !Number.isInteger(numeric))) {
      if (active) errors.push({ field, message: `${label}: inserisci ${integer ? 'un intero' : 'un numero'} tra ${min} e ${max}.` });
      input[field] = DEFAULT_PLAN[field];
    } else input[field] = numeric;
  }
  number('people', 'Persone', 1, 500, true);
  number('portion', 'Pezzi a persona', 1, 100, true);
  number('weight', 'Grammi per pezzo', 5, 100);
  number('pricePerKg', 'Prezzo al kg', 0.01, 500, false, input.purchaseMode === 'kg');
  number('packPieces', 'Pezzi per confezione', 1, 5000, true, input.purchaseMode === 'packs');
  number('packPrice', 'Prezzo per confezione', 0.01, 10000, false, input.purchaseMode === 'packs');
  number('budgetPerPerson', 'Budget a persona', 0, 1000);
  number('extraPercent', 'Scorta aggiuntiva', 0, 50);
  number('nominalCapacity', 'Capienza dichiarata', 1, 300, true);
  number('effectiveCapacity', 'Capienza effettiva', 1, 300, true);
  number('batchMinutes', 'Minuti per cuociata', 1, 60);
  number('prepMinutes', 'Preparazione della brace', 0, 180);
  number('changeMinutes', 'Cambio tra cuociate', 0, 30);
  for (const field of ['pricePerKg', 'packPrice', 'budgetPerPerson']) input[field] = euros(cents(input[field]));
  if (errors.length) return { valid: false, errors, input };

  const basePieces = input.people * input.portion;
  const extraFor = base => {
    const exact = base * input.extraPercent / 100;
    return exact > 0 ? Math.max(1, Math.ceil(exact - Number.EPSILON * exact)) : 0;
  };
  const extraPieces = extraFor(basePieces);
  const requiredPieces = basePieces + extraPieces;
  const packs = input.purchaseMode === 'packs' ? Math.ceil(requiredPieces / input.packPieces) : 0;
  const purchasedPieces = input.purchaseMode === 'packs' ? packs * input.packPieces : requiredPieces;
  const weightKg = requiredPieces * input.weight / 1000;
  const purchasedWeightKg = purchasedPieces * input.weight / 1000;
  const priceCents = cents(input.pricePerKg);
  const lowPriceCents = input.priceMode === 'estimate' ? cents(product.priceLow) : priceCents;
  const highPriceCents = input.priceMode === 'estimate' ? cents(product.priceHigh) : priceCents;
  const packCents = cents(input.packPrice);
  const costFor = (pieces, perKgCents = priceCents) => {
    if (pieces <= 0) return 0;
    if (input.purchaseMode === 'packs') return Math.ceil(pieces / input.packPieces) * packCents;
    return Math.max(1, Math.round(pieces * input.weight * perKgCents / 1000 + 1e-9));
  };
  const totalBudgetCents = cents(input.budgetPerPerson) * input.people;
  const reservedBudgetCents = 0; // No advance allocation: the remainder is derived from the meat cost.
  const meatBudgetCents = totalBudgetCents - reservedBudgetCents;
  const costCents = costFor(requiredPieces);
  const lowCostCents = costFor(requiredPieces, lowPriceCents);
  const highCostCents = costFor(requiredPieces, highPriceCents);
  const affordablePieces = meatBudgetCents === 0 ? 0 : input.purchaseMode === 'packs'
    ? Math.floor(meatBudgetCents / packCents) * input.packPieces
    : Math.max(0, Math.floor((meatBudgetCents + 0.5 - 1e-7) * 1000 / (input.weight * highPriceCents)));
  let maxPortionWithinBudget = 0;
  for (let portion = 1; portion <= input.portion; portion++) {
    const base = input.people * portion;
    if (costFor(base + extraFor(base), highPriceCents) <= meatBudgetCents) maxPortionWithinBudget = portion;
    else break;
  }
  const batches = Math.ceil(requiredPieces / input.effectiveCapacity);
  const lastBatchPieces = requiredPieces - (batches - 1) * input.effectiveCapacity;
  const cookingMinutes = batches * input.batchMinutes + Math.max(0, batches - 1) * input.changeMinutes;
  return {
    valid: true, errors: [], input,
    basePieces, extraPieces, requiredPieces, purchasedPieces, packs,
    weightKg, purchasedWeightKg,
    cost: euros(costCents),
    costLow: euros(lowCostCents),
    costHigh: euros(highCostCents),
    totalBudget: euros(totalBudgetCents),
    reservedBudget: euros(reservedBudgetCents),
    meatBudget: euros(meatBudgetCents),
    balance: euros(meatBudgetCents - costCents),
    balanceLow: euros(meatBudgetCents - highCostCents),
    balanceHigh: euros(meatBudgetCents - lowCostCents),
    budgetAtRisk: highCostCents > meatBudgetCents && costCents <= meatBudgetCents,
    costPerPerson: euros(Math.round(costCents / input.people)),
    totalPerPerson: euros(Math.round(costCents / input.people)),
    remainingBudget: euros(totalBudgetCents - costCents),
    remainingPerPerson: euros(Math.round((totalBudgetCents - costCents) / input.people)),
    leftoverPieces: purchasedPieces - requiredPieces,
    batches, lastBatchPieces,
    piecesPerPersonPerBatch: Math.min(input.effectiveCapacity, requiredPieces) / input.people,
    cookingMinutes,
    totalMinutes: input.prepMinutes + cookingMinutes,
    affordablePieces, maxPortionWithinBudget,
  };
}

/** Plain text keeps copying/downloading safe even with a user-provided title. */
export function buildShoppingText(raw, result = calculatePlan(raw)) {
  if (!result.valid) return 'Completa i dati del piano prima di creare la lista della spesa.';
  const p = result.input;
  const productLabel = PRODUCTS.find(product => product.id === p.productPreset)?.label || 'Formato personalizzato';
  const grillLabel = GRILLS.find(grill => grill.id === p.grillModel).label;
  const estimated = p.priceMode === 'estimate';
  const product = PRODUCTS.find(item => item.id === p.productPreset);
  const lines = [
    p.eventName,
    `${p.people} persone · ${p.portion} arrosticini a testa`,
    '',
    'LISTA DELLA SPESA',
    `Formato: ${productLabel}.`,
    `Arrosticini: ${result.purchasedPieces} pezzi, circa ${decimal(result.purchasedWeightKg)} kg (${decimal(p.weight)} g/pezzo).`,
    p.purchaseMode === 'packs'
      ? `${result.packs} confezioni da ${p.packPieces} pezzi a ${money(p.packPrice)} ciascuna.`
      : estimated
        ? `Prezzo di riferimento: ${money(p.pricePerKg)}/kg (fascia indicativa ${money(product.priceLow)}–${money(product.priceHigh)}/kg).`
        : `Prezzo al kg personalizzato: ${money(p.pricePerKg)}.`,
    `Totale arrosticini: ${money(result.cost)} (${money(result.costPerPerson)} a testa, quota arrotondata).`,
    ...(estimated ? [`Intervallo di spesa stimato: ${money(result.costLow)}–${money(result.costHigh)}, trasporto escluso.`] : []),
    ...(estimated ? [product.priceNote] : []),
    `Porzioni: ${result.basePieces} pezzi + ${result.extraPieces} di scorta da cuocere.`,
    ...(result.leftoverPieces ? [`Avanzo da confezioni: ${result.leftoverPieces} pezzi, esclusi dalle cuociate.`] : []),
    '',
    'BUDGET',
    `Quota: ${money(p.budgetPerPerson)} × ${p.people} persone = ${money(result.totalBudget)}.`,
    `Meno arrosticini: ${money(result.cost)}.`,
    result.balance >= 0 ? `Restano per bevande, contorni e accessori: ${money(result.remainingBudget)} (${money(result.remainingPerPerson)} a testa).` : `Gli arrosticini superano la quota totale di ${money(-result.balance)}.`,
    ...(estimated ? [`Residuo indicativo: ${money(result.balanceLow)}–${money(result.balanceHigh)}. Le altre spese non sono ancora stimate.`] : []),
    ...(result.budgetAtRisk ? ['Il limite alto della previsione supera il budget: tieni un margine o personalizza il prezzo.'] : []),
    '',
    'FORNACELLA',
    `Fornacella ${grillLabel.toLowerCase()}: carico di pianificazione ${p.effectiveCapacity} pezzi per cuociata.`,
    `${result.batches} cuociate; ultima da ${result.lastBatchPieces} pezzi.`,
    `Stima: ${decimal(result.cookingMinutes)} minuti di servizio, ${decimal(result.totalMinutes)} con la preparazione della brace.`,
    `Ipotesi organizzative: ${decimal(p.batchMinutes)} min/cuociata, ${decimal(p.changeMinutes)} min/cambio, ${decimal(p.prepMinutes)} min di preparazione.`,
    '',
    'Prezzi di riferimento indicativi e peso nominale. Carichi e tempi sono ipotesi di pianificazione, non misure né istruzioni di cottura.',
  ];
  return lines.join('\n');
}
