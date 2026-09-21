import {
    MAX_INGREDIENTS,
    loadAlchemyInventory,
    getSelectedIngredients,
    addIngredient,
    getPotionSummary,
    filterIngredients,
    brewAndSavePotion,
    clearSelectedIngredients
} from "../services/potion_service.js";

import { getCurrentPotionType } from "../utils/alchemy_logic.js";
import SpriteFormatter from "../utils/sprite_formatter.js";

let ingredientSearch, ingredientList, ingredientEmpty, ingredientCount;
let targetTypeLabel, currentTypeLabel, dominantElementLabel, essenceTotalLabel, secondaryStatsList;
let secondaryStatsDialog, secondaryStatsDetails;

let viscPotFill, volPotFill, potPotFill;
let viscCurFill, volCurFill, potCurFill, extCurFill;
let viscPotLabel, volPotLabel, potPotLabel;
let viscCurLabel, volCurLabel, potCurLabel, extCurLabel;

let currentTempDisplay, addWaterBtn, startBrewBtn, pumpBellowsBtn, finishBrewBtn;

let gameLoopInterval = null;
let gameState = {
    phase: 'prep', // 'prep' or 'brew'
    active: false,
    currentTemp: 20,
    dynamicVolatility: 0,
    viscosityPenalty: 0,
    extraction: 0,
    volDangerTime: 0,
    viscDangerTime: 0,
    failed: false,
    currentStats: { viscosity: 0, volatility: 0, potency: 0, extraction: 0 }
};

export async function initAlchemyUI() {
    ingredientList = document.querySelector("[data-ingredient-list]");
    if (!ingredientList) return;

    ingredientSearch = document.querySelector("[data-ingredient-search]");
    ingredientEmpty = document.querySelector("[data-ingredient-empty]");
    ingredientCount = document.querySelector("[data-ingredient-count]");

    startBrewBtn = document.getElementById("btn-start-brew");
    pumpBellowsBtn = document.getElementById("btn-pump-bellows");
    finishBrewBtn = document.querySelector("[data-brew-button]");
    addWaterBtn = document.getElementById("btn-add-water");

    targetTypeLabel = document.querySelector("[data-target-potion-type]");
    currentTypeLabel = document.querySelector("[data-current-potion-type]");
    dominantElementLabel = document.querySelector("[data-dominant-element]");
    essenceTotalLabel = document.querySelector("[data-essence-total]");
    secondaryStatsList = document.querySelector("[data-secondary-stats]");
    secondaryStatsDialog = document.querySelector("[data-alchemy-stats-dialog]");
    secondaryStatsDetails = document.querySelector("[data-alchemy-stat-details]");

    viscPotFill = document.querySelector("[data-viscosity-potential]");
    volPotFill = document.querySelector("[data-volatility-potential]");
    potPotFill = document.querySelector("[data-potency-potential]");

    viscCurFill = document.querySelector("[data-viscosity-current]");
    volCurFill = document.querySelector("[data-volatility-current]");
    potCurFill = document.querySelector("[data-potency-current]");
    extCurFill = document.querySelector("[data-extraction-current]");

    viscPotLabel = document.querySelector("[data-viscosity-potential-label]");
    volPotLabel = document.querySelector("[data-volatility-potential-label]");
    potPotLabel = document.querySelector("[data-potency-potential-label]");

    viscCurLabel = document.querySelector("[data-viscosity-current-label]");
    volCurLabel = document.querySelector("[data-volatility-current-label]");
    potCurLabel = document.querySelector("[data-potency-current-label]");
    extCurLabel = document.querySelector("[data-extraction-current-label]");

    currentTempDisplay = document.getElementById("current-temp-val");
    const failAckBtn = document.getElementById("fail-acknowledge");

    if (failAckBtn) failAckBtn.addEventListener("click", closeFailModal);
    if (ingredientSearch) ingredientSearch.addEventListener("input", renderIngredientList);
    if (startBrewBtn) startBrewBtn.addEventListener("click", handleStartBrew);
    if (pumpBellowsBtn) pumpBellowsBtn.addEventListener("click", handlePumpBellows);
    if (finishBrewBtn) finishBrewBtn.addEventListener("click", handleFinishBrew);
    if (addWaterBtn) addWaterBtn.addEventListener("click", handleAddWater);

    try {
        await loadAlchemyInventory();
        resetMinigameState();
        updateUI();
        gameLoopInterval = setInterval(gameLoop, 100);
    } catch (error) {
        console.error(error);
        if (ingredientEmpty) {
            ingredientEmpty.hidden = false;
            ingredientEmpty.textContent = "Unable to load alchemy ingredients.";
        }
    }
}

function handleStartBrew() {
    if (getSelectedIngredients().length === 0) return;

    gameState.phase = 'brew';
    gameState.active = true;

    document.getElementById('prep-actions').style.display = 'none';
    document.getElementById('live-actions').style.display = 'flex';
    document.getElementById('current-type-container').style.display = 'block';

    document.getElementById('ingredients-panel').style.opacity = '0.5';
    document.getElementById('ingredients-panel').style.pointerEvents = 'none';

    updateUI();
}

function handlePumpBellows() {
    if (!gameState.active || gameState.phase !== 'brew') return;

    gameState.currentTemp = Math.min(200, gameState.currentTemp + 25);
    gameState.dynamicVolatility += 10;

    updateLiveUI();
}

function gameLoop() {
    if (!gameState.active || gameState.failed || gameState.phase !== 'brew') return;

    // Passive heat drain (1 degree per tick = 10 degrees per second)
    if (gameState.currentTemp > 20) {
        gameState.currentTemp = Math.max(20, gameState.currentTemp - 1);
    }

    if (gameState.currentTemp > 100) {
        const overHeat = gameState.currentTemp - 100;

        gameState.extraction += 0.5 + (overHeat * 0.015);

        if (gameState.extraction > 100) {
            gameState.viscosityPenalty += 0.2 + (overHeat * 0.005);
        }
    }

    gameState.dynamicVolatility = Math.max(0, gameState.dynamicVolatility - 0.5);

    const summary = getPotionSummary();
    const extFactor = Math.min(100, gameState.extraction) / 100;

    const curVisc = Math.min(100, (summary.gauges.viscosity.percent * extFactor) + gameState.viscosityPenalty);
    const curVol = Math.min(100, (summary.gauges.volatility.percent * extFactor) + gameState.dynamicVolatility);
    const curPot = Math.min(100, (summary.gauges.potency.percent * extFactor));

    gameState.currentStats = {
        viscosity: curVisc,
        volatility: curVol,
        potency: curPot,
        extraction: Math.min(100, gameState.extraction)
    };

    if (curVol >= 90) gameState.volDangerTime += 100;
    else gameState.volDangerTime = 0;

    if (curVisc >= 90) gameState.viscDangerTime += 100;
    else gameState.viscDangerTime = 0;

    if (gameState.volDangerTime >= 2500) return triggerFail("Explosion! Volatility stayed critically high for too long.");
    if (gameState.viscDangerTime >= 2500) return triggerFail("Solidified! The liquid boiled away and ruined the components.");

    updateLiveUI();
}

function updateUI() {
    const summary = getPotionSummary();
    const selectedCount = getSelectedIngredients().length;

    if (ingredientCount) {
        ingredientCount.textContent = `${selectedCount} / ${MAX_INGREDIENTS} selected`;
    }

    if (startBrewBtn) {
        startBrewBtn.disabled = selectedCount === 0;
    }

    if (summary) {
        if (targetTypeLabel) targetTypeLabel.textContent = summary.potionType;
        if (dominantElementLabel) {
            dominantElementLabel.textContent = summary.dominantElement
                ? summary.dominantElement.replace(/\b\w/g, (l) => l.toUpperCase())
                : "None";
        }
        if (essenceTotalLabel) essenceTotalLabel.textContent = String(summary.totalEssence);

        if (viscPotFill) viscPotFill.style.transform = `scaleX(${summary.gauges.viscosity.percent / 100})`;
        if (volPotFill) volPotFill.style.transform = `scaleX(${summary.gauges.volatility.percent / 100})`;
        if (potPotFill) potPotFill.style.transform = `scaleX(${summary.gauges.potency.percent / 100})`;

        if (viscPotLabel) viscPotLabel.textContent = `${Math.floor(summary.gauges.viscosity.percent)}%`;
        if (volPotLabel) volPotLabel.textContent = `${Math.floor(summary.gauges.volatility.percent)}%`;
        if (potPotLabel) potPotLabel.textContent = `${Math.floor(summary.gauges.potency.percent)}%`;
    }

    renderSecondaryStats(summary);
    renderIngredientList();

    if (summary) {
        updatePotionSpritePreview(summary);
    }

    if (gameState.phase === 'prep') {
        updateLiveUI();
    }
}

function updateLiveUI() {
    const curStats = gameState.currentStats;

    if (viscCurFill) viscCurFill.style.transform = `scaleX(${curStats.viscosity / 100})`;
    if (volCurFill) volCurFill.style.transform = `scaleX(${curStats.volatility / 100})`;
    if (potCurFill) potCurFill.style.transform = `scaleX(${curStats.potency / 100})`;
    if (extCurFill) extCurFill.style.transform = `scaleX(${curStats.extraction / 100})`;

    if (viscCurLabel) viscCurLabel.textContent = `${Math.floor(curStats.viscosity)}%`;
    if (volCurLabel) volCurLabel.textContent = `${Math.floor(curStats.volatility)}%`;
    if (potCurLabel) potCurLabel.textContent = `${Math.floor(curStats.potency)}%`;
    if (extCurLabel) extCurLabel.textContent = `${Math.floor(curStats.extraction)}%`;

    if (currentTempDisplay) currentTempDisplay.textContent = `${Math.floor(gameState.currentTemp)}°C`;

    const currentType = getCurrentPotionType(curStats.viscosity, curStats.volatility, curStats.potency);
    if (currentTypeLabel) currentTypeLabel.textContent = currentType;

    handleDiegeticWarnings(curStats);
    renderSecondaryStats(getPotionSummary());
}

function handleDiegeticWarnings(curStats) {
    const volCard = volCurFill?.closest('.gauge-card');
    if (volCard) {
        volCard.classList.remove('warning-shake-heavy', 'warning-shake-light');
        if (curStats.volatility >= 90) volCard.classList.add('warning-shake-heavy');
        else if (curStats.volatility > 75) volCard.classList.add('warning-shake-light');
    }

    const viscCard = viscCurFill?.closest('.gauge-card');
    if (viscCard) {
        viscCard.classList.remove('warning-harden-heavy', 'warning-harden-light');
        if (curStats.viscosity >= 90) viscCard.classList.add('warning-harden-heavy');
        else if (curStats.viscosity > 75) viscCard.classList.add('warning-harden-light');
    }
}

function handleAddWater() {
    if (!gameState.active || gameState.failed || gameState.phase !== 'brew') return;
    gameState.viscosityPenalty = Math.max(0, gameState.viscosityPenalty - 15);
    gameState.currentTemp = Math.max(20, gameState.currentTemp - 40);
    gameState.dynamicVolatility = Math.max(0, gameState.dynamicVolatility - 20);
    updateLiveUI();
}

async function handleFinishBrew() {
    gameState.active = false;
    await brewAndSavePotion(gameState);
    await loadAlchemyInventory();
    resetMinigameState();
    updateUI();
}

function handleAddIngredient(item) {
    const added = addIngredient(item);
    if (added) updateUI();
}

function renderSecondaryStats(summary) {
    if (!secondaryStatsList) return;
    secondaryStatsList.replaceChildren();

    const selected = getSelectedIngredients();
    const stats = [...new Set(selected.flatMap((item) => item?.secondary_stats ?? item?.suffixStats ?? item?.stats ?? []))];

    if (!stats.length) {
        const placeholder = document.createElement("li");
        placeholder.className = "stat-pill placeholder";
        placeholder.textContent = selected.length ? "No secondary stats" : "No selected ingredients";
        secondaryStatsList.append(placeholder);
        return;
    }

    const extractionVal = Math.floor(gameState.currentStats.extraction);
    const visibleStats = stats.slice(0, 3);

    for (const stat of visibleStats) {
        const item = document.createElement("li");
        item.className = "stat-pill";
        item.textContent = formatAlchemyStat(stat, extractionVal);
        secondaryStatsList.append(item);
    }

    if (stats.length > visibleStats.length) {
        const moreButton = document.createElement("button");
        moreButton.type = "button";
        moreButton.className = "stat-pill stat-pill--more";
        moreButton.textContent = "...";
        moreButton.setAttribute("aria-label", `Show all ${stats.length} secondary stats`);
        moreButton.addEventListener("click", () => openSecondaryStatsDialog(stats, extractionVal));
        const moreItem = document.createElement("li");
        moreItem.append(moreButton);
        secondaryStatsList.append(moreItem);
    }
}

function formatAlchemyStat(stat, extractionVal) {
    const statText = stat?.label ?? stat?.key ?? stat;
    return `${statText} (Extraction: ${extractionVal}%)`;
}

function openSecondaryStatsDialog(stats, extractionVal) {
    if (!secondaryStatsDialog || !secondaryStatsDetails) return;

    secondaryStatsDetails.replaceChildren();
    for (const stat of stats) {
        const detail = document.createElement("li");
        detail.textContent = formatAlchemyStat(stat, extractionVal);
        secondaryStatsDetails.append(detail);
    }

    if (typeof secondaryStatsDialog.showModal === "function") {
        secondaryStatsDialog.showModal();
    }
}

function renderIngredientList() {
    if (!ingredientList) return;

    const query = ingredientSearch?.value ?? "";
    const filteredInventory = filterIngredients(query);
    const selected = getSelectedIngredients();

    ingredientList.replaceChildren();

    if (!filteredInventory.length) {
        if (ingredientEmpty) ingredientEmpty.hidden = false;
        return;
    }
    if (ingredientEmpty) ingredientEmpty.hidden = true;

    for (const item of filteredInventory) {
        const itemButton = document.createElement("button");
        itemButton.type = "button";
        itemButton.className = "ingredient-item";
        itemButton.disabled = selected.includes(item) || selected.length >= MAX_INGREDIENTS;

        const meta = document.createElement("div");
        meta.className = "ingredient-item__meta";
        const name = document.createElement("span");
        name.textContent = item.name;
        const essence = document.createElement("span");
        essence.textContent = (item.essences ?? []).join(" / ");
        meta.append(name, essence);

        const details = document.createElement("div");
        details.className = "ingredient-item__details";
        const stats = (item.secondary_stats ?? item.suffixStats ?? item.stats ?? []).join(" • ") || "No secondary stats";
        const elements = [...(item.damage_types ?? item.elements ?? []), ...(item.prefixStats ?? [])].filter(Boolean).join(" • ") || "Neutral";
        details.textContent = `${stats} • ${elements}`;

        itemButton.append(meta, details);
        itemButton.addEventListener("click", () => handleAddIngredient(item));
        ingredientList.append(itemButton);
    }
}

function triggerFail(reason) {
    gameState.failed = true;
    gameState.active = false;

    const modal = document.getElementById("fail-modal");
    const reasonText = document.getElementById("fail-reason");
    if (modal && reasonText) {
        reasonText.textContent = reason;
        modal.style.display = 'flex';
    }
}

function closeFailModal() {
    const modal = document.getElementById("fail-modal");
    if (modal) modal.style.display = 'none';

    clearSelectedIngredients();
    resetMinigameState();
    updateUI();
}

function resetMinigameState() {
    gameState = {
        phase: 'prep',
        active: false,
        currentTemp: 20,
        dynamicVolatility: 0,
        viscosityPenalty: 0,
        extraction: 0,
        volDangerTime: 0,
        viscDangerTime: 0,
        failed: false,
        currentStats: { viscosity: 0, volatility: 0, potency: 0, extraction: 0 }
    };

    const prepActions = document.getElementById('prep-actions');
    const liveActions = document.getElementById('live-actions');
    const currentTypeContainer = document.getElementById('current-type-container');
    const ingredientsPanel = document.getElementById('ingredients-panel');

    if (prepActions) prepActions.style.display = 'flex';
    if (liveActions) liveActions.style.display = 'none';
    if (currentTypeContainer) currentTypeContainer.style.display = 'none';
    if (ingredientsPanel) {
        ingredientsPanel.style.opacity = '1';
        ingredientsPanel.style.pointerEvents = 'auto';
    }

    if (currentTempDisplay) currentTempDisplay.textContent = "20°C";

    updateLiveUI();
}

async function updatePotionSpritePreview(summary) {
    const previewContainer = document.getElementById("live-potion-preview");
    if (!previewContainer || !summary) return;

    // Map your summary data to the required sprite parameters.
    // Example: derive action and liquidType from summary.potionType,
    // and derive color from summary.dominantElement.
    const action = summary.action || "drink";
    const liquidType = summary.liquidType || "brew";
    const color = summary.colorRGB || [127, 255, 255];

    try {
        const canvas = await SpriteFormatter.createPotionSprite(action, liquidType, color);
        canvas.classList.add("ui-sprite", "preview-sprite");

        // Replace the old sprite with the new one
        previewContainer.replaceChildren(canvas);
    } catch (error) {
        console.error("Failed to render preview sprite:", error);
    }
}

