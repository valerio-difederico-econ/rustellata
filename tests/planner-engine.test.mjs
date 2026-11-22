import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PLAN, PRODUCTS, GRILLS, calculatePlan, buildShoppingText } from '../static/planner-engine.js';

test('default forecast: 200 classic pieces, 4.6 kg, €101.20 with a €92–115 planning band', () => {
  const p = calculatePlan();
  assert.equal(p.valid, true);
  assert.equal(p.requiredPieces, 200);
  assert.equal(p.weightKg, 4.6);
  assert.equal(p.cost, 101.2);
  assert.equal(p.costLow, 92);
  assert.equal(p.costHigh, 115);
  assert.equal(p.balance, 98.8);
  assert.equal(p.remainingBudget, 98.8);
  assert.equal(p.remainingPerPerson, 9.88);
  assert.equal(p.balanceLow, 85);
  assert.equal(p.balanceHigh, 108);
  assert.equal(p.costPerPerson, 10.12);
  assert.equal(p.totalPerPerson, 10.12);
  assert.equal(p.maxPortionWithinBudget, 20);
});

test('known products lock weight, time and automatic price despite stale hidden values', () => {
  const p = calculatePlan({ productPreset: 'classic', weight: 99, pricePerKg: 1, batchMinutes: NaN, prepMinutes: Infinity, changeMinutes: -20 });
  assert.equal(p.valid, true);
  assert.equal(p.input.weight, 23);
  assert.equal(p.input.pricePerKg, 22);
  assert.equal(p.input.batchMinutes, 8);
  assert.equal(p.input.prepMinutes, 25);
  assert.equal(p.input.changeMinutes, 2);
  assert.equal(p.cost, 101.2);
  const hand = calculatePlan({ productPreset: 'handmade', weight: NaN });
  assert.equal(hand.input.weight, 30);
  assert.equal(hand.input.batchMinutes, 10);
  assert.equal(hand.cost, 180);
});

test('small, medium and large grills have fixed usable planning capacities', () => {
  const loads = ['inox50', 'inox80', 'inox110'].map(grillModel => calculatePlan({ grillModel, nominalCapacity: NaN, effectiveCapacity: 300 }));
  assert.ok(loads.every(p => p.valid));
  assert.deepEqual(loads.map(p => p.input.nominalCapacity), [30, 50, 70]);
  assert.deepEqual(loads.map(p => p.input.effectiveCapacity), [20, 30, 45]);
  assert.deepEqual(loads.map(p => p.batches), [10, 7, 5]);
  assert.equal(calculatePlan({ grillModel: '<unknown>' }).input.grillModel, 'inox80');
});

test('automatic mode ignores manual prices and pack values, and uses kg estimates', () => {
  const p = calculatePlan({ purchaseMode: 'packs', pricePerKg: NaN, packPieces: '', packPrice: NaN });
  assert.equal(p.valid, true);
  assert.equal(p.input.purchaseMode, 'kg');
  assert.equal(p.packs, 0);
  assert.equal(p.input.pricePerKg, 22);
});

test('personalizing a known product changes price, never its weight or grill mechanics', () => {
  const p = calculatePlan({ priceMode: 'custom', productPreset: 'classic', weight: 38, pricePerKg: 20, effectiveCapacity: 3 });
  assert.equal(p.input.weight, 23);
  assert.equal(p.input.effectiveCapacity, 30);
  assert.equal(p.cost, 92);
  assert.equal(p.costLow, 92);
  assert.equal(p.costHigh, 92);
  assert.equal(p.balance, 108);
  assert.equal(p.budgetAtRisk, false);
});

test('packs are explicit custom purchases; surplus is not scheduled for cooking', () => {
  const p = calculatePlan({ priceMode: 'custom', purchaseMode: 'packs' });
  assert.equal(p.packs, 2);
  assert.equal(p.purchasedPieces, 224);
  assert.equal(p.cost, 158);
  assert.equal(p.leftoverPieces, 24);
  assert.equal(p.batches, 7);
  assert.equal(p.lastBatchPieces, 20);
  assert.equal(p.balance, 42);
  assert.equal(p.maxPortionWithinBudget, 20);
});

test('custom product explicitly permits its own weight and forces custom pricing', () => {
  const p = calculatePlan({ productPreset: 'custom', weight: 40, pricePerKg: 18 });
  assert.equal(p.valid, true);
  assert.equal(p.input.priceMode, 'custom');
  assert.equal(p.input.weight, 40);
  assert.equal(p.cost, 144);
  assert.equal(p.input.batchMinutes, 10);
  assert.equal(calculatePlan({ productPreset: '<unsafe>', weight: 38 }).input.productPreset, 'classic');
});

test('buffer rounds up separately and cooks with portions; pack leftovers do not', () => {
  const p = calculatePlan({ people: 3, portion: 7, extraPercent: 10, grillModel: 'inox50' });
  assert.equal(p.basePieces, 21);
  assert.equal(p.extraPieces, 3);
  assert.equal(p.requiredPieces, 24);
  assert.equal(p.batches, 2);
  assert.equal(p.lastBatchPieces, 4);
  assert.equal(calculatePlan({ people: 1, portion: 1, extraPercent: 1e-12 }).extraPieces, 1);
});

test('full loads have no empty final batch or extra changeover', () => {
  const p = calculatePlan({ grillModel: 'inox50' });
  assert.equal(p.batches, 10);
  assert.equal(p.lastBatchPieces, 20);
  assert.equal(p.cookingMinutes, 98);
  assert.equal(p.totalMinutes, 123);
  const one = calculatePlan({ people: 1, portion: 10 });
  assert.equal(one.batches, 1);
  assert.equal(one.cookingMinutes, 8);
  assert.equal(one.piecesPerPersonPerBatch, 10);
});

test('automatic budget proposals use the upper planning band, not only the central price', () => {
  const p = calculatePlan({ budgetPerPerson: 11 });
  assert.equal(p.balance, 8.8);
  assert.equal(p.balanceLow, -5);
  assert.equal(p.budgetAtRisk, true);
  assert.equal(p.maxPortionWithinBudget, 19);
  const proposal = calculatePlan({ budgetPerPerson: 11, portion: 19 });
  assert.ok(proposal.balanceLow >= 0);
  assert.equal(proposal.budgetAtRisk, false);
  assert.ok(calculatePlan({ budgetPerPerson: 11, portion: 20 }).balanceLow < 0);
});

test('custom-price exact affordability and buffer boundaries use cents', () => {
  const settings = { priceMode: 'custom', pricePerKg: 20 };
  const exact = calculatePlan({ ...settings, budgetPerPerson: 9.2 });
  assert.equal(exact.balance, 0);
  assert.equal(exact.maxPortionWithinBudget, 20);
  assert.equal(exact.affordablePieces, 200);
  const below = calculatePlan({ ...settings, budgetPerPerson: 9.19 });
  assert.equal(below.maxPortionWithinBudget, 19);
  assert.equal(below.affordablePieces, 199);
  assert.equal(calculatePlan({ ...settings, budgetPerPerson: 10, extraPercent: 10 }).maxPortionWithinBudget, 19);
});

test('zero budget never yields a free positive purchase', () => {
  const p = calculatePlan({ budgetPerPerson: 0, reservePerPerson: 0 });
  assert.equal(p.balance, -101.2);
  assert.equal(p.affordablePieces, 0);
  assert.equal(p.maxPortionWithinBudget, 0);
  const tiny = calculatePlan({ productPreset: 'custom', people: 1, portion: 1, weight: 5, pricePerKg: 0.01, budgetPerPerson: 0, reservePerPerson: 0 });
  assert.equal(tiny.cost, 0.01);
  assert.equal(tiny.affordablePieces, 0);
  assert.equal(tiny.maxPortionWithinBudget, 0);
});

test('decimal money and half-cent inputs round correctly', () => {
  const p = calculatePlan({ productPreset: 'custom', people: 3, portion: 1, weight: 100, pricePerKg: 1, budgetPerPerson: 0.1, reservePerPerson: 0 });
  assert.equal(p.totalBudget, 0.3);
  assert.equal(p.cost, 0.3);
  assert.equal(p.balance, 0);
  assert.equal(calculatePlan({ priceMode: 'custom', pricePerKg: 10.075 }).input.pricePerKg, 10.08);
  assert.equal(calculatePlan({ budgetPerPerson: 1e-7, reservePerPerson: 0 }).input.budgetPerPerson, 0);
});

test('people and custom numerical inputs reject blanks, nonfinite and out-of-range values', () => {
  assert.equal(calculatePlan({ people: '12' }).input.people, 12);
  for (const people of ['', ' ', null, true, [], {}, NaN, Infinity, 'NaN', '12x', -1, 0, 1.5, 501]) {
    const p = calculatePlan({ people });
    assert.equal(p.valid, false, `invalid people ${String(people)}`);
    assert.ok(p.errors.some(e => e.field === 'people'));
  }
  for (const raw of [null, [], true, 'plan']) assert.equal(calculatePlan(raw).valid, false);
  assert.equal(calculatePlan({ productPreset: 'custom', weight: NaN }).valid, false);
  assert.equal(calculatePlan({ priceMode: 'custom', pricePerKg: 0 }).valid, false);
  assert.equal(calculatePlan({ priceMode: 'custom', purchaseMode: 'packs', packPieces: 0 }).valid, false);
  assert.equal(calculatePlan({ priceMode: 'custom', purchaseMode: 'other' }).valid, false);
  assert.equal(calculatePlan({ priceMode: 'other' }).valid, false);
  assert.equal(calculatePlan({ reservePerPerson: 999 }).remainingBudget, 98.8); // Legacy links cannot silently reserve money.
});

test('inactive custom purchase fields do not block the selected purchase method', () => {
  assert.equal(calculatePlan({ priceMode: 'custom', packPieces: '', packPrice: NaN }).valid, true);
  assert.equal(calculatePlan({ priceMode: 'custom', purchaseMode: 'packs', pricePerKg: '' }).valid, true);
});

test('proposals maximize uniform portions within the relevant price ceiling and buffer', () => {
  for (const priceMode of ['estimate', 'custom']) for (const purchaseMode of ['kg', 'packs']) for (const extraPercent of [0, 7, 10, 50]) for (const budgetPerPerson of [0, 0.01, 10, 20, 100]) {
    const settings = { priceMode, purchaseMode, extraPercent, budgetPerPerson, reservePerPerson: 0, people: 7, portion: 23 };
    const p = calculatePlan(settings);
    assert.equal(p.valid, true);
    assert.ok(p.maxPortionWithinBudget <= settings.portion);
    if (p.maxPortionWithinBudget > 0) {
      const candidate = calculatePlan({ ...settings, portion: p.maxPortionWithinBudget });
      assert.ok(candidate.balanceLow >= 0);
      if (p.maxPortionWithinBudget < settings.portion) assert.ok(calculatePlan({ ...settings, portion: p.maxPortionWithinBudget + 1 }).balanceLow < 0);
    }
  }
});

test('catalog price envelopes are coherent and retain nominal weights and fixed grill plans', () => {
  assert.deepEqual(PRODUCTS.map(p => p.weight), [23, 25, 30, 30, 38]);
  assert.deepEqual(PRODUCTS.map(p => [p.pricePerKg, p.priceLow, p.priceHigh]), [[22,20,25],[25,20,27],[22,20,27],[30,24,32],[26.5,20,27]]);
  assert.ok(PRODUCTS.every(p => p.priceLow <= p.pricePerKg && p.pricePerKg <= p.priceHigh && p.priceNote));
  assert.deepEqual(GRILLS.map(g => g.effectiveCapacity), [20, 30, 45]);
  assert.ok(Object.isFrozen(DEFAULT_PLAN));
});

test('shopping text labels estimates, price bands and planning assumptions honestly', () => {
  const p = calculatePlan({ productPreset: 'handmade', meal: 'multi', eventName: '<Cena & amici>' });
  const text = buildShoppingText(p.input, p);
  assert.ok(text.startsWith('<Cena & amici>'));
  assert.match(text, /Formato: Fatti interamente a mano/);
  assert.match(text, /fascia indicativa/);
  assert.match(text, /trasporto escluso/);
  assert.match(text, /Ipotesi organizzative/);
  assert.equal(p.input.meal, 'multi');
  assert.match(buildShoppingText({ people: 0 }), /Completa i dati/);
  const packs = calculatePlan({ priceMode: 'custom', purchaseMode: 'packs' });
  assert.match(buildShoppingText(packs.input, packs), /24 pezzi, esclusi dalle cuociate/);
  assert.match(buildShoppingText(packs.input, packs), /158,00/);
});
