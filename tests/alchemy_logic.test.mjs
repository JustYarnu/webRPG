import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePotionSummary, POTION_TYPE_TABLE } from '../js/utils/alchemy_logic.js';

test('calculatePotionSummary resolves low/medium/high gauge states and named potion types', () => {
    const summary = calculatePotionSummary([
        { essences: [5, 40, 70, 0, 0, 0, 0] },
    ]);

    assert.equal(summary.gauges.viscosity.label, 'low');
    assert.equal(summary.gauges.volatility.label, 'medium');
    assert.equal(summary.gauges.potency.label, 'high');
    assert.equal(summary.potionType, 'Plume');
    assert.equal(POTION_TYPE_TABLE.low.medium.high, 'Plume');
});

test('calculatePotionSummary handles a zero-potency brew as inert', () => {
    const summary = calculatePotionSummary([
        { essences: [0, 20, 0, 0, 0, 0, 0] },
    ]);

    assert.equal(summary.gauges.potency.value, 0);
    assert.equal(summary.gauges.potency.total, 20);
    assert.equal(summary.potionType, 'Inert');
});
