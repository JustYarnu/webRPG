import { addItem } from "./player_controller.js";
import { getForageItem } from "../services/forage_service.js";

export function initForageUI() {
    const status = document.querySelector("[data-forage-status]");
    const dialog = document.querySelector("[data-forage-dialog]");
    const itemName = document.querySelector("[data-item-name]");

    if (!status || !dialog || !itemName) return;

    function showError(error) {
        console.error(error);
        status.textContent = "Unable to forage in this area.";
    }

    try {
        const params = new URLSearchParams(window.location.search);
        const areaId = params.get("area_id");

        const item = getForageItem(areaId);

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