import { generateItem } from "../generators/item_generator.js";

export function getForageItem(areaId) {
    const numericId = Number(areaId);

    if (!Number.isInteger(numericId) || numericId < 1) {
        throw new Error("A valid area_id is required.");
    }

    return generateItem("alchemy", numericId);
}