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

export function determinePotionTier(percent) {
    if (percent >= 25 && percent <= 60) return "medium";
    if (percent > 60) return "high";
    return "low";
}

export function getCurrentPotionType(viscPercent, volPercent, potPercent) {
    if (potPercent === 0) return "Inert";

    const viscLabel = determinePotionTier(viscPercent);
    const volLabel = determinePotionTier(volPercent);
    const potLabel = determinePotionTier(potPercent);

    return POTION_TYPE_TABLE[viscLabel]?.[volLabel]?.[potLabel] ?? "Unknown";
}

function getGaugeState(value, total) {
    const percent = total === 0 ? 0 : (value / total) * 100;

    return {
        value,
        total,
        percent,
        label: determinePotionTier(percent),
    };
}

export function calculatePotionSummary(ingredients) {
    const normalizedIngredients = Array.isArray(ingredients) ? ingredients : [];
    const essenceValues = normalizedIngredients.map(normalizeIngredientEssence);

    const accumulatedEssences = essenceValues.reduce(
        (totals, essence) => [
            Math.max(0, totals[0] + (essence[0] ?? 0)),
            Math.max(0, totals[1] + (essence[1] ?? 0)),
            Math.max(0, totals[2] + (essence[2] ?? 0)),
        ],
        [0, 0, 0],
    );
    const [viscosity, volatility, potency] = accumulatedEssences;
    const totalEssence = viscosity + volatility + potency;

    const gauges = {
        viscosity: getGaugeState(viscosity, totalEssence),
        volatility: getGaugeState(volatility, totalEssence),
        potency: getGaugeState(potency, totalEssence),
    };

    const dominantElement = getDominantElement(normalizedIngredients);
    const potionType = getCurrentPotionType(gauges.viscosity.percent, gauges.volatility.percent, gauges.potency.percent);

    return {
        ingredientCount: normalizedIngredients.length,
        dominantElement,
        totalEssence,
        gauges,
        potionType,
    };
}

function capitalize(value) {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function brewPotionFromIngredients(ingredients, playerLevel = 1, gameState = null) {
    const summary = calculatePotionSummary(ingredients);

    let finalType = summary.potionType;
    let finalEssences = ingredients
        .flatMap((ingredient) => normalizeIngredientEssence(ingredient))
        .map((essence) => Math.max(0, essence));

    if (gameState && gameState.currentStats) {
        finalType = getCurrentPotionType(
            gameState.currentStats.viscosity,
            gameState.currentStats.volatility,
            gameState.currentStats.potency
        );

        const extFactor = Math.min(100, gameState.currentStats.extraction) / 100;
        finalEssences = finalEssences.map(e => Math.floor(e * extFactor));
    }

    const name = `${summary.dominantElement ? `${capitalize(summary.dominantElement)} ` : ""}${finalType} potion`;

    return {
        name,
        type: "potion",
        category: "alchemy",
        essences: finalEssences,
        secondaryStats: createSecondaryStats(
            ingredients.flatMap((ingredient) => ingredient?.secondary_stats ?? ingredient?.suffixStats ?? ingredient?.stats ?? []),
            playerLevel,
        ),
        damage_types: summary.dominantElement ? [summary.dominantElement] : [],
        potionType: finalType,
        dominantElement: summary.dominantElement,
        summary,
    };
}