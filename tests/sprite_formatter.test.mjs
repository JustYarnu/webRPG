import test from 'node:test';
import assert from 'node:assert/strict';
import SpriteFormatter from '../js/utils/sprite_formatter.js';

test('getPotionSpriteOptions selects an action and matching liquid layer', () => {
    assert.deepEqual(SpriteFormatter.getPotionSpriteOptions('Reactive Gel', 'Fire'), {
        action: 'apply',
        liquidType: 'reactive_gel',
        color: SpriteFormatter.elementColors.fire,
    });
    assert.deepEqual(SpriteFormatter.getPotionSpriteOptions('Plume', 'Water'), {
        action: 'throw',
        liquidType: 'plume',
        color: SpriteFormatter.elementColors.water,
    });
    assert.deepEqual(SpriteFormatter.getPotionSpriteOptions('Tonic', 'Radiant'), {
        action: 'drink',
        liquidType: 'tonic',
        color: SpriteFormatter.elementColors.radiant,
    });
    assert.deepEqual(SpriteFormatter.getPotionSpriteOptions('Flask', 'Earth'), {
        action: 'drink',
        liquidType: 'fluid',
        color: SpriteFormatter.elementColors.earth,
    });
});

test('getPotionSpriteOptions uses a transparent liquid if the element is unknown', () => {
    assert.deepEqual(SpriteFormatter.getPotionSpriteOptions('Inert', null), {
        action: 'drink',
        liquidType: 'brew',
        color: null,
    });
    assert.equal(SpriteFormatter.getElementColor('unknown'), null);
});

test('createPotionSprite recoloring makes placeholder pixels transparent without changing other pixels', () => {
    const imageData = {
        data: new Uint8ClampedArray([
            127, 255, 255, 255,
            10, 20, 30, 255,
        ]),
    };
    const context = {
        getImageData: () => imageData,
        putImageData: () => {},
    };

    SpriteFormatter._recolorContext(context, 2, 1, SpriteFormatter.placeholderColors, null);

    assert.deepEqual([...imageData.data], [
        127, 255, 255, 0,
        10, 20, 30, 255,
    ]);
});

test('every supported element has a sprite color', () => {
    for (const element of ['fire', 'earth', 'air', 'water', 'thunder', 'necrotic', 'radiant', 'poison']) {
        const palette = SpriteFormatter.getElementColor(element);
        assert.equal(palette.length, 3);
        assert.ok(palette.every((color) => color.length === 3));
    }
});

test('createPotionSprite recolors all three placeholder shades light-to-dark', () => {
    const imageData = {
        data: new Uint8ClampedArray([
            127, 255, 255, 255,
            255, 127, 255, 255,
            255, 255, 127, 255,
        ]),
    };
    const context = {
        getImageData: () => imageData,
        putImageData: () => {},
    };
    const palette = SpriteFormatter.getElementColor('fire');

    SpriteFormatter._recolorContext(context, 3, 1, SpriteFormatter.placeholderColors, palette);

    assert.deepEqual([...imageData.data], [
        ...palette[0], 255,
        ...palette[1], 255,
        ...palette[2], 255,
    ]);
});

test('createPotionSprite supports a legacy single-color replacement', () => {
    const imageData = {
        data: new Uint8ClampedArray([
            255, 255, 127, 255,
            255, 127, 255, 255,
            127, 255, 255, 255,
        ]),
    };
    const context = {
        getImageData: () => imageData,
        putImageData: () => {},
    };

    SpriteFormatter._recolorContext(
        context,
        3,
        1,
        SpriteFormatter.placeholderColors,
        [20, 30, 40],
    );

    assert.deepEqual([...imageData.data], [
        20, 30, 40, 255,
        20, 30, 40, 255,
        20, 30, 40, 255,
    ]);
});

test('createPotionSprite makes each placeholder shade transparent without a palette', () => {
    const imageData = {
        data: new Uint8ClampedArray([
            255, 255, 127, 255,
            255, 127, 255, 255,
            127, 255, 255, 255,
        ]),
    };
    const context = {
        getImageData: () => imageData,
        putImageData: () => {},
    };

    SpriteFormatter._recolorContext(context, 3, 1, SpriteFormatter.placeholderColors, null);

    assert.deepEqual([...imageData.data], [
        255, 255, 127, 0,
        255, 127, 255, 0,
        127, 255, 255, 0,
    ]);
});
