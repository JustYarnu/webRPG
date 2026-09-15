import { addItem } from "./player_controller.js";
import { generateItem } from "../generators/item_generator.js";

const params = new URLSearchParams(window.location.search);
const areaId = Number(params.get("area_id"));
const status = document.querySelector("[data-forage-status]");
const dialog = document.querySelector("[data-forage-dialog]");
const itemName = document.querySelector("[data-item-name]");

function showError(error) {
    console.error(error);
    status.textContent = "Unable to forage in this area.";
}

if (!Number.isInteger(areaId) || areaId < 1) {
    showError(new Error("A valid area_id is required."));
} else {
    try {
        const item = generateItem("alchemy", areaId);
        itemName.textContent = item.name;
        dialog.addEventListener("close", async () => {
            if (dialog.returnValue !== "take") {
                status.textContent = "You left the item behind.";
                return;
            }

            try {
                await addItem(item);
                status.textContent = `${item.name} was added to your inventory.`;
            } catch (error) {
                showError(error);
            }
        }, { once: true });
        dialog.showModal();
    } catch (error) {
        showError(error);
    }
}