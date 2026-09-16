import { getPlayerState, getRequiredExp } from "./player_controller.js";

const status = document.querySelector("[data-profile-status]");
const inventoryList = document.querySelector("[data-inventory-list]");
const emptyState = document.querySelector("[data-inventory-empty]");
const itemCount = document.querySelector("[data-inventory-count]");
const itemDialog = document.querySelector("[data-item-dialog]");

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

function renderItemDetails(item) {
    document.querySelector("[data-dialog-item-name]").textContent = item.name;
    const details = document.querySelector("[data-item-details]");
    details.replaceChildren();

    for (const [key, value] of Object.entries(item)) {
        if (key === "name") {
            continue;
        }

        const row = document.createElement("div");
        const label = document.createElement("dt");
        const detail = document.createElement("dd");
        label.textContent = key;
        detail.textContent = formatValue(value);
        row.append(label, detail);
        details.append(row);
    }

    itemDialog.showModal();
}

function renderInventory(inventory) {
    inventoryList.replaceChildren();
    itemCount.textContent = `${inventory.length} ${inventory.length === 1 ? "item" : "items"}`;
    emptyState.hidden = inventory.length > 0;

    for (const item of inventory) {
        const entry = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "inventory-item";
        button.innerHTML = `<span>${item.name}</span><span aria-hidden="true">&gt;</span>`;
        button.addEventListener("click", () => renderItemDetails(item));
        entry.append(button);
        inventoryList.append(entry);
    }
}

getPlayerState()
    .then((player) => {
        document.querySelector("[data-profile-name]").textContent = player.name;
        document.querySelector("[data-profile-level]").textContent = `Level ${player.level}`;
        document.querySelector("[data-profile-experience]").textContent = `${player.experience} / ${getRequiredExp(player.level)}`;
        document.querySelector("[data-profile-hp]").textContent =
            `${player.hp.current} / ${player.hp.maximum}`;
        document.querySelector("[data-profile-coins]").textContent = player.coins;
        document.querySelector("[data-profile-gems]").textContent = player.gems;
        renderInventory(player.inventory);
        status.textContent = "Player state loaded.";
    })
    .catch((error) => {
        console.error(error);
        status.textContent = "Unable to load player data.";
    });

