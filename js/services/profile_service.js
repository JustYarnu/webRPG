import { getPlayerState, getTotalRequiredExp } from "./player_service.js";
import { formatSecondaryStat } from "../utils/stat_formatter.js";

const HIDDEN_ITEM_ATTRIBUTES = new Set(["name", "damage_types", "summary"]);

function capitalizeWords(value) {
    return String(value)
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatLabel(label) {
    if (label === "secondaryStats") return "Secondary Stats";
    if (label === "potionType") return "Potion Type";
    if (label === "dominantElement") return "Dominant Element";
    return capitalizeWords(label);
}

function getPotionEssenceAttributes(item) {
    const gauges = item.summary?.gauges;
    if (!gauges) return null;

    return Object.entries(gauges).map(([gaugeName, gauge]) => ({
        label: formatLabel(gaugeName),
        value: `${gauge.value} (${gauge.label})`,
    }));
}

function formatDisplayValue(value) {
    return typeof value === "string" ? capitalizeWords(value) : value;
}

export async function getProfileOverview() {
    const player = await getPlayerState();
    const requiredExp = getTotalRequiredExp(player.level);

    return {
        ...player,
        requiredExp,
    };
}

export function getItemAttributes(item, areas = [], playerLevel = 1) {
    const areaNames = new Map(areas.map((area) => [area.id, area.name]));
    const potionEssences = getPotionEssenceAttributes(item);

    return Object.entries(item)
        .filter(([key]) => !HIDDEN_ITEM_ATTRIBUTES.has(key) && key !== "essences")
        .map(([label, value]) => ({
            label: formatLabel(label),
            value: label === "areas" && Array.isArray(value)
                ? value.map((areaId) => areaNames.get(areaId) ?? areaId)
                : label === "secondary_stats" && Array.isArray(value)
                    ? value.map((stat) => formatSecondaryStat(stat, playerLevel))
                    : formatDisplayValue(value),
        }))
        .concat(potionEssences ? [{ label: "Essences", value: potionEssences }] : []);
}