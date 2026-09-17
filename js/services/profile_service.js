import { getPlayerState, getTotalRequiredExp } from "./player_service.js";

export async function getProfileOverview() {
    const player = await getPlayerState();
    const requiredExp = getTotalRequiredExp(player.level);

    return {
        ...player,
        requiredExp,
    };
}

function formatValue(value) {
    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(", ") : "None";
    }

    if (value && typeof value === "object") {
        return Object.entries(value)
            .map(([key, nestedValue]) => `${key}: ${formatValue(nestedValue)}`)
            .join("; ");
    }

    return String(value);
}

export function getItemAttributes(item) {
    return Object.entries(item)
        .filter(([key]) => key !== "name")
        .map(([key, value]) => ({
            label: key,
            value: formatValue(value),
        }));
}