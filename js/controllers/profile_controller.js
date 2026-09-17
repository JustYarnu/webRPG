import { getProfileOverview, getItemAttributes } from "../services/profile_service.js";
import { loadAreas } from "../services/areas_service.js";
import { setPlayerName } from "../services/player_service.js";

let inventoryListEl, emptyStateEl, itemCountEl, itemDialogEl;
let areas = [];
let profileLevel = 1;

export async function initProfileUI() {
    inventoryListEl = document.querySelector("[data-inventory-list]");

    if (!inventoryListEl) return;

    emptyStateEl = document.querySelector("[data-inventory-empty]");
    itemCountEl = document.querySelector("[data-inventory-count]");
    itemDialogEl = document.querySelector("[data-item-dialog]");
    initNameEditor();

    try {
        const profile = await getProfileOverview();
        profileLevel = profile.level;
        areas = await loadAreas();
        renderProfileStats(profile);
        renderInventory(profile.inventory);
    } catch (error) {
        console.error(error);
    }
}

function initNameEditor() {
    const changeNameButton = document.querySelector("[data-change-name]");
    const nameDialog = document.querySelector("[data-name-dialog]");
    const nameForm = document.querySelector("[data-name-form]");
    const nameInput = document.querySelector("[data-name-input]");

    if (!changeNameButton || !nameDialog || !nameForm || !nameInput) return;

    changeNameButton.addEventListener("click", () => {
        nameInput.value = document.querySelector("[data-profile-name]")?.textContent ?? "";
        nameDialog.showModal();
        nameInput.select();
    });

    nameForm.addEventListener("submit", async (event) => {
        if (nameDialog.returnValue !== "save") return;

        event.preventDefault();
        try {
            const name = await setPlayerName(nameInput.value);
            const nameEl = document.querySelector("[data-profile-name]");
            if (nameEl) nameEl.textContent = name;
            nameDialog.close();
        } catch (error) {
            console.error(error);
            nameInput.setCustomValidity(error.message);
            nameInput.reportValidity();
            nameInput.setCustomValidity("");
        }
    });
}

function renderProfileStats(profile) {
    const nameEl = document.querySelector("[data-profile-name]");
    const levelEl = document.querySelector("[data-profile-level]");
    const expEl = document.querySelector("[data-profile-experience]");
    const hpEl = document.querySelector("[data-profile-hp]");
    const coinsEl = document.querySelector("[data-profile-coins]");
    const gemsEl = document.querySelector("[data-profile-gems]");

    if (nameEl) nameEl.textContent = profile.name;
    if (levelEl) levelEl.textContent = `Level ${profile.level}`;
    if (expEl) expEl.textContent = `${profile.experience} / ${profile.requiredExp}`;
    if (hpEl) hpEl.textContent = `${profile.hp.current} / ${profile.hp.maximum}`;
    if (coinsEl) coinsEl.textContent = profile.coins;
    if (gemsEl) gemsEl.textContent = profile.gems;
}

function renderInventory(inventory) {
    if (!inventoryListEl) return;

    inventoryListEl.replaceChildren();

    if (itemCountEl) {
        itemCountEl.textContent = `${inventory.length} ${inventory.length === 1 ? "item" : "items"}`;
    }

    if (emptyStateEl) {
        emptyStateEl.hidden = inventory.length > 0;
    }

    for (const item of inventory) {
        const entry = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "inventory-item";
        button.innerHTML = `<span>${item.name}</span><span aria-hidden="true">&gt;</span>`;
        button.addEventListener("click", () => renderItemDetails(item));
        entry.append(button);
        inventoryListEl.append(entry);
    }
}

function renderItemDetails(item) {
    if (!itemDialogEl) return;

    const dialogNameEl = document.querySelector("[data-dialog-item-name]");
    const detailsEl = document.querySelector("[data-item-details]");

    if (dialogNameEl) dialogNameEl.textContent = item.name;

    if (detailsEl) {
        detailsEl.replaceChildren();
        const attributes = getItemAttributes(item, areas, profileLevel);

        for (const { label, value } of attributes) {
            const row = document.createElement("div");
            const dt = document.createElement("dt");
            const dd = document.createElement("dd");
            dt.textContent = label;
            renderDetailValue(dd, value);
            row.append(dt, dd);
            detailsEl.append(row);
        }
    }

    if (typeof itemDialogEl.showModal === "function") {
        itemDialogEl.showModal();
    }
}

function renderDetailValue(container, value) {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            container.textContent = "None";
            return;
        }

        const list = document.createElement("ul");
        list.className = "detail-values";
        for (const entry of value) {
            const listItem = document.createElement("li");
            renderDetailValue(listItem, entry);
            list.append(listItem);
        }
        container.append(list);
        return;
    }

    if (value && typeof value === "object") {
        if (typeof value.label === "string") {
            container.textContent = value.label;
            return;
        }

        const list = document.createElement("ul");
        list.className = "detail-values";
        for (const [key, nestedValue] of Object.entries(value)) {
            const listItem = document.createElement("li");
            const label = document.createElement("strong");
            label.textContent = `${key}: `;
            listItem.append(label);
            renderDetailValue(listItem, nestedValue);
            list.append(listItem);
        }
        container.append(list);
        return;
    }

    container.textContent = String(value);
}