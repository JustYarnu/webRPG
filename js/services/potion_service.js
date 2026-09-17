import { getPlayerState, addItem, removeItems } from "./player_service.js";
import { calculatePotionSummary, brewPotionFromIngredients } from "../utils/alchemy_logic.js";

export const MAX_INGREDIENTS = 10;
let selectedIngredients = [];
let alchemyInventory = [];

export async function loadAlchemyInventory() {
    const player = await getPlayerState();
    alchemyInventory = (player?.inventory ?? []).filter((item) => item?.type === "alchemy");
    return alchemyInventory;
}

export function getAlchemyInventory() {
    return alchemyInventory;
}

export function getSelectedIngredients() {
    return [...selectedIngredients];
}

export function addIngredient(item) {
    if (!item || selectedIngredients.includes(item) || selectedIngredients.length >= MAX_INGREDIENTS) {
        return false;
    }
    selectedIngredients.push(item);
    return true;
}

export function clearSelectedIngredients() {
    selectedIngredients = [];
}

export function getPotionSummary() {
    return calculatePotionSummary(selectedIngredients);
}

function formatIngredientText(item) {
    const elementNames = [...(item?.damage_types ?? item?.elements ?? []), ...(item?.prefixStats ?? [])]
        .filter(Boolean)
        .join(" ");
    const secondaryText = (item?.secondary_stats ?? item?.suffixStats ?? item?.stats ?? []).join(" ");
    const essenceText = (item?.essences ?? []).join(" /");

    return `${item?.name ?? ""} ${secondaryText} ${elementNames} ${essenceText}`.trim().toLowerCase();
}

export function filterIngredients(query = "") {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return alchemyInventory;

    return alchemyInventory.filter((item) => {
        const text = formatIngredientText(item);
        return text.includes(cleanQuery);
    });
}

export async function brewAndSavePotion() {
    if (!selectedIngredients.length) return null;

    const player = await getPlayerState();
    const potion = brewPotionFromIngredients(selectedIngredients, player.level);
    await removeItems(selectedIngredients);
    await addItem(potion);
    clearSelectedIngredients();
    return potion;
}