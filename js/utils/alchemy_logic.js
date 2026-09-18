import { createSecondaryStats } from "./stat_formatter.js";

export const ELEMENT_TYPES = [
    "fire",
    "earth",
    "air",
    "water",
    "thunder",
    "necrotic",
    "radiant",
    "poison",
];

export const POTION_TYPE_TABLE = {
    low: {
        low: { low: "Vapor", medium: "Haze", high: "Miasma" },
        medium: { low: "Gas", medium: "Aerosol", high: "Plume" },
        high: { low: "Fume", medium: "Cloud", high: "Blastwave" },
    },
    medium: {
        low: { low: "Draught", medium: "Tonic", high: "Elixir" },
        medium: { low: "Fluid", medium: "Flask", high: "Splash" },
        high: { low: "Fuming", medium: "Brew", high: "Thermite" },
    },
    high: {
        low: { low: "Balm", medium: "Oil", high: "Paste" },
        medium: { low: "Slime", medium: "Adhesive", high: "Pitch" },
        high: { low: "Reactive Gel", medium: "Volatile Paste", high: "Sludge" },
    },
};

function normalizeIngredientEssence(ingredient) {
    const rawEssence = Array.isArray(ingredient?.essences) ? ingredient.essences : [0, 0, 0];
    return rawEssence.slice(0, 3).map((value) => Number(value) || 0);
}

function getDominantElement(ingredients) {
    const counts = new Map();

    for (const ingredient of ingredients) {
        const elementList = [
            ...(ingredient?.damage_types ?? ingredient?.elements ?? []),
            ...(ingredient?.prefixStats ?? []),
        ];
        for (const element of elementList) {
            if (!element || !ELEMENT_TYPES.includes(String(element).toLowerCase())) {
                continue;
            }
            const normalized = String(element).toLowerCase();
            counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
        }
    }

    if (counts.size === 0) {
        return null;
    }

    let dominantElement = null;
    let dominantValue = -1;
    for (const [element, value] of counts.entries()) {
        if (value > dominantValue) {
            dominantValue = value;
            dominantElement = element;
        }
    }

    return dominantElement;
}

function getGaugeState(value, total) {
    const percent = total === 0 ? 0 : (value / total) * 100;

    let label = "low";
    if (percent >= 25 && percent <= 60) {
        label = "medium";
    } else if (percent > 60) {
        label = "high";
    }

    return {
        value,
        total,
        percent,
        label,
    };
}

export function calculatePotionSummary(ingredients) {
    const normalizedIngredients = Array.isArray(ingredients) ? ingredients : [];
    const essenceValues = normalizedIngredients.map(normalizeIngredientEssence);

    const viscosity = essenceValues.reduce((total, essence) => total + (essence[0] ?? 0), 0);
    const volatility = essenceValues.reduce((total, essence) => total + (essence[1] ?? 0), 0);
    const potency = essenceValues.reduce((total, essence) => total + (essence[2] ?? 0), 0);
    const totalEssence = viscosity + volatility + potency;

    const gauges = {
        viscosity: getGaugeState(viscosity, totalEssence),
        volatility: getGaugeState(volatility, totalEssence),
        potency: getGaugeState(potency, totalEssence),
    };

    const dominantElement = getDominantElement(normalizedIngredients);
    const potionType =
        potency === 0
            ? "Inert"
            : POTION_TYPE_TABLE[gauges.viscosity.label]?.[gauges.volatility.label]?.[gauges.potency.label] ?? "Unknown";

    return {
        ingredientCount: normalizedIngredients.length,
        dominantElement,
        totalEssence,
        gauges,
        potionType,
    };
}

export function brewPotionFromIngredients(ingredients, playerLevel = 1) {
    const summary = calculatePotionSummary(ingredients);
    const name = `${summary.dominantElement ? `${capitalize(summary.dominantElement)} ` : ""}${summary.potionType} potion`;

    return {
        name,
        type: "potion",
        category: "alchemy",
        essences: ingredients.flatMap((ingredient) => normalizeIngredientEssence(ingredient)),
        secondaryStats: createSecondaryStats(
            ingredients.flatMap((ingredient) => ingredient?.secondary_stats ?? ingredient?.suffixStats ?? ingredient?.stats ?? []),
            playerLevel,
        ),
        damage_types: summary.dominantElement ? [summary.dominantElement] : [],
        potionType: summary.potionType,
        dominantElement: summary.dominantElement,
        summary,
    };
}

function capitalize(value) {
    if (!value) {
        return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}
