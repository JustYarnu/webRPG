import { getProfileOverview, getItemAttributes } from "../services/profile_service.js";
import { loadAreas } from "../services/areas_service.js";
import { setPlayerName } from "../services/player_service.js";
import SpriteFormatter from "../utils/sprite_formatter.js";

let inventoryListEl, emptyStateEl, itemCountEl, itemDialogEl;
let areas = [];
let profileLevel = 1;
let inventorySpriteObserver;
let inventoryPageObserver;
let inventoryItems = [];
let renderedInventoryCount = 0;
let itemDetailSpriteRequest = 0;
const INVENTORY_BATCH_SIZE = 30;

export async function initProfileUI() {
    inventoryListEl = document.querySelector("[data-inventory-list]");

    if (!inventoryListEl) return;

    emptyStateEl = document.querySelector("[data-inventory-empty]");
    itemCountEl = document.querySelector("[data-inventory-count]");
    itemDialogEl = document.querySelector("[data-item-dialog]");
    inventorySpriteObserver = typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries, observer) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observer.unobserve(entry.target);
                renderInventorySprite(entry.target);
            }
        }, { rootMargin: "100px" })
        : null;
    inventoryPageObserver = typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries, observer) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer.unobserve(inventorySentinel);
            renderNextInventoryBatch();
        }, { rootMargin: "400px" })
        : null;
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

    inventorySpriteObserver?.disconnect();
    inventoryPageObserver?.disconnect();
    inventoryListEl.replaceChildren();
    inventoryItems = inventory;
    renderedInventoryCount = 0;

    if (itemCountEl) {
        itemCountEl.textContent = `${inventory.length} ${inventory.length === 1 ? "item" : "items"}`;
    }

    if (emptyStateEl) {
        emptyStateEl.hidden = inventory.length > 0;
    }

    if (!inventory.length) return;

    if (!inventoryPageObserver) {
        while (renderedInventoryCount < inventoryItems.length) {
            appendInventoryBatch(INVENTORY_BATCH_SIZE);
        }
        return;
    }

    appendInventoryBatch(INVENTORY_BATCH_SIZE);
    if (renderedInventoryCount < inventoryItems.length) {
        inventoryPageObserver.observe(inventorySentinel);
    }
}

const inventorySentinel = document.createElement("li");
inventorySentinel.className = "inventory-list__sentinel";
inventorySentinel.setAttribute("aria-hidden", "true");

function renderNextInventoryBatch() {
    if (renderedInventoryCount >= inventoryItems.length) return;
    appendInventoryBatch(INVENTORY_BATCH_SIZE);
    if (renderedInventoryCount < inventoryItems.length) {
        inventoryPageObserver.observe(inventorySentinel);
    }
}

function appendInventoryBatch(batchSize) {
    const inventoryEntries = document.createDocumentFragment();
    const spriteContainers = [];
    const end = Math.min(renderedInventoryCount + batchSize, inventoryItems.length);
    for (; renderedInventoryCount < end; renderedInventoryCount += 1) {
        const item = inventoryItems[renderedInventoryCount];
        const entry = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "inventory-item";

        const spriteContainer = document.createElement("div");
        spriteContainer.className = "item-sprite-container";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = item.name;

        const arrowSpan = document.createElement("span");
        arrowSpan.setAttribute("aria-hidden", "true");
        arrowSpan.textContent = ">";

        button.append(spriteContainer, nameSpan, arrowSpan);
        button.addEventListener("click", () => renderItemDetails(item));
        entry.append(button);
        inventoryEntries.append(entry);

        const spriteOptions = getItemSpriteOptions(item);

        if (spriteOptions) {
            spriteContainer.dataset.spriteAction = spriteOptions.action;
            spriteContainer.dataset.spriteLiquid = spriteOptions.liquidType;
            spriteContainer.dataset.spriteColor = JSON.stringify(spriteOptions.color);
            spriteContainers.push(spriteContainer);
        }
    }
    inventoryListEl.append(inventoryEntries);
    if (inventoryPageObserver && renderedInventoryCount < inventoryItems.length) {
        inventoryListEl.append(inventorySentinel);
    } else {
        inventorySentinel.remove();
    }

    for (const container of spriteContainers) {
        if (inventorySpriteObserver) inventorySpriteObserver.observe(container);
        else renderInventorySprite(container);
    }
}

async function renderInventorySprite(container) {
    const { spriteAction: action, spriteLiquid: liquidType, spriteColor } = container.dataset;
    const color = JSON.parse(spriteColor);

    try {
        const canvas = await SpriteFormatter.createPotionSprite(action, liquidType, color);
        if (!container.isConnected) return;
        canvas.classList.add("ui-sprite");
        container.replaceChildren(canvas);
    } catch (error) {
        console.error("Failed to load inventory sprite:", error);
    }
}

function getItemSpriteOptions(item) {
    const dominantElement = item.dominantElement ?? item.summary?.dominantElement ?? item.damage_types?.[0];
    const potionType = item.potionType ?? item.summary?.potionType;

    if (item.action && item.liquidType) {
        return {
            action: item.action,
            liquidType: item.liquidType,
            color: item.colorRGB ?? SpriteFormatter.getElementColor(dominantElement),
        };
    }

    return item.type === "potion" && potionType
        ? SpriteFormatter.getPotionSpriteOptions(potionType, dominantElement)
        : null;
}

function renderItemDetails(item) {
    if (!itemDialogEl) return;

    const dialogNameEl = document.querySelector("[data-dialog-item-name]");
    const detailsEl = document.querySelector("[data-item-details]");
    const spriteContainer = document.querySelector("[data-dialog-item-sprite]");

    if (dialogNameEl) dialogNameEl.textContent = item.name;
    if (spriteContainer) {
        spriteContainer.replaceChildren();
        const spriteOptions = getItemSpriteOptions(item);
        spriteContainer.hidden = !spriteOptions;
        if (spriteOptions) {
            renderItemDetailSprite(spriteContainer, spriteOptions);
        }
    }

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

async function renderItemDetailSprite(container, spriteOptions) {
    const requestId = ++itemDetailSpriteRequest;

    try {
        const canvas = await SpriteFormatter.createPotionSprite(
            spriteOptions.action,
            spriteOptions.liquidType,
            spriteOptions.color,
        );
        if (requestId !== itemDetailSpriteRequest || !container.isConnected) return;
        canvas.classList.add("ui-sprite");
        container.replaceChildren(canvas);
    } catch (error) {
        console.error("Failed to load item detail sprite:", error);
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