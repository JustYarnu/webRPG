const PERCENT_STAT_PREFIX = "p";
const NUMERICAL_STAT_PREFIX = "n";
const PERCENT_VALUE_PER_LEVEL = 5;
const NUMERICAL_VALUE_PER_LEVEL = 10;

function formatStatName(statKey) {
    return statKey
        .slice(1)
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (letter) => letter.toUpperCase());
}

export function getStatValue(statKey, playerLevel = 1) {
    const level = Math.max(1, Number(playerLevel) || 1);
    const valuePerLevel = statKey.startsWith(PERCENT_STAT_PREFIX)
        ? PERCENT_VALUE_PER_LEVEL
        : NUMERICAL_VALUE_PER_LEVEL;

    return valuePerLevel * level;
}

export function formatSecondaryStat(statKey, playerLevel = 1) {
    const value = getStatValue(statKey, playerLevel);
    const isPercent = statKey.startsWith(PERCENT_STAT_PREFIX);
    const suffix = isPercent ? "%" : "";

    return `${formatStatName(statKey)}: +${value}${suffix}`;
}

export function createSecondaryStats(statKeys, playerLevel = 1) {
    return [...new Set(statKeys)].map((key) => ({
        key,
        value: getStatValue(key, playerLevel),
        label: formatSecondaryStat(key, playerLevel),
    }));
}
