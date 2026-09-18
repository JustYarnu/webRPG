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

let ingredientSearch, ingredientList, ingredientEmpty, ingredientCount, brewButton;
let potionTypeLabel, dominantElementLabel, essenceTotalLabel, secondaryStatsList;
let viscosityFill, volatilityFill, potencyFill, extractionFill;
let viscosityLabel, volatilityLabel, potencyLabel, extractionLabel;
let tempSlider, targetTempDisplay, currentTempDisplay, addWaterBtn;

let gameLoopInterval = null;
let gameState = {
    active: false,
    targetTemp: 20,
    currentTemp: 20,
    potency: 0,
    volatility: 0,
    viscosity: 0,
    extraction: 0,
    volDangerTime: 0,
    viscDangerTime: 0,
    failed: false
};

export async function initAlchemyUI() {
    ingredientList = document.querySelector("[data-ingredient-list]");
    if (!ingredientList) return;

    ingredientSearch = document.querySelector("[data-ingredient-search]");
    ingredientEmpty = document.querySelector("[data-ingredient-empty]");
    ingredientCount = document.querySelector("[data-ingredient-count]");
    brewButton = document.querySelector("[data-brew-button]");

    potionTypeLabel = document.querySelector("[data-current-potion-type]");
    dominantElementLabel = document.querySelector("[data-dominant-element]");
    essenceTotalLabel = document.querySelector("[data-essence-total]");
    secondaryStatsList = document.querySelector("[data-secondary-stats]");

    viscosityFill = document.querySelector("[data-viscosity-fill]");
    volatilityFill = document.querySelector("[data-volatility-fill]");
    potencyFill = document.querySelector("[data-potency-fill]");
    extractionFill = document.querySelector("[data-extraction-fill]");

    viscosityLabel = document.querySelector("[data-viscosity-label]");
    volatilityLabel = document.querySelector("[data-volatility-label]");
    potencyLabel = document.querySelector("[data-potency-label]");
    extractionLabel = document.querySelector("[data-extraction-label]");

    tempSlider = document.getElementById("temp-slider");
    targetTempDisplay = document.getElementById("target-temp-display");
    currentTempDisplay = document.getElementById("current-temp-val");
    addWaterBtn = document.getElementById("btn-add-water");

    const failAckBtn = document.getElementById("fail-acknowledge");
    if (failAckBtn) failAckBtn.addEventListener("click", closeFailModal);

    if (ingredientSearch) ingredientSearch.addEventListener("input", renderIngredientList);
    if (brewButton) brewButton.addEventListener("click", handleBrew);
    if (addWaterBtn) addWaterBtn.addEventListener("click", handleAddWater);

    if (tempSlider) {
        tempSlider.addEventListener("input", (e) => {
            gameState.targetTemp = parseInt(e.target.value, 10);
            if (targetTempDisplay) targetTempDisplay.textContent = gameState.targetTemp;
        });
    }

    try {
        await loadAlchemyInventory();
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

function gameLoop() {
    if (!gameState.active || gameState.failed) return;

    const tempDiff = gameState.targetTemp - gameState.currentTemp;
    let tempChange = 0;

    if (Math.abs(tempDiff) > 0.5) {
        tempChange = Math.sign(tempDiff) * Math.min(Math.abs(tempDiff), 3);
        gameState.currentTemp += tempChange;
    }

    if (Math.abs(tempChange) > 1.5) {
        gameState.volatility += Math.abs(tempChange) * 0.4;
    }
    gameState.volatility = Math.max(0, gameState.volatility - 0.2);

    if (gameState.currentTemp > 100) {
        const overHeat = gameState.currentTemp - 100;

        let potencyGain = 0.05 + (overHeat * 0.001);

        if (tempChange < 0) potencyGain *= 0.1;

        gameState.potency += potencyGain;
        gameState.viscosity += 0.1 + (overHeat * 0.003);
        gameState.extraction += 0.08 + (overHeat * 0.0015);
    }

    // Clamp bounds
    gameState.volatility = Math.min(100, Math.max(0, gameState.volatility));
    gameState.potency = Math.min(100, Math.max(0, gameState.potency));
    gameState.viscosity = Math.min(100, Math.max(0, gameState.viscosity));
    gameState.extraction = Math.min(100, Math.max(0, gameState.extraction));

    if (gameState.volatility >= 90) gameState.volDangerTime += 100;
    else gameState.volDangerTime = 0;

    if (gameState.viscosity >= 90) gameState.viscDangerTime += 100;
    else gameState.viscDangerTime = 0;

    if (gameState.volDangerTime >= 2500) return triggerFail("Explosion! Volatility stayed critically high for too long.");
    if (gameState.viscDangerTime >= 2500) return triggerFail("Solidified! The liquid boiled away and ruined the components.");

    updateLiveUI();
}

function updateUI() {
    const summary = getPotionSummary();
    const selectedCount = getSelectedIngredients().length;

    updateSelectedCount();
    updateSummaryMeta(summary);
    renderSecondaryStats(summary);
    renderIngredientList();

    if (selectedCount === 0) {
        resetMinigameState();
        if (tempSlider) tempSlider.disabled = true;
        if (addWaterBtn) addWaterBtn.disabled = true;
    } else {
        if (!gameState.active && !gameState.failed) gameState.active = true;
        if (tempSlider) tempSlider.disabled = false;
        if (addWaterBtn) addWaterBtn.disabled = false;
    }
}

function updateLiveUI() {
    if (viscosityFill) viscosityFill.style.transform = `scaleX(${gameState.viscosity / 100})`;
    if (volatilityFill) volatilityFill.style.transform = `scaleX(${gameState.volatility / 100})`;
    if (potencyFill) potencyFill.style.transform = `scaleX(${gameState.potency / 100})`;
    if (extractionFill) extractionFill.style.transform = `scaleX(${gameState.extraction / 100})`;

    if (viscosityLabel) viscosityLabel.textContent = `${Math.floor(gameState.viscosity)}%`;
    if (volatilityLabel) volatilityLabel.textContent = `${Math.floor(gameState.volatility)}%`;
    if (potencyLabel) potencyLabel.textContent = `${Math.floor(gameState.potency)}%`;
    if (extractionLabel) extractionLabel.textContent = `${Math.floor(gameState.extraction)}%`;

    if (currentTempDisplay) currentTempDisplay.textContent = `${Math.floor(gameState.currentTemp)}°C`;

    handleDiegeticWarnings();

    renderSecondaryStats(getPotionSummary());
}

function handleDiegeticWarnings() {
    const volCard = volatilityFill?.closest('.gauge-card');
    if (volCard) {
        volCard.classList.remove('warning-shake-heavy', 'warning-shake-light');
        if (gameState.volatility >= 90) volCard.classList.add('warning-shake-heavy');
        else if (gameState.volatility > 75) volCard.classList.add('warning-shake-light');
    }

    const viscCard = viscosityFill?.closest('.gauge-card');
    if (viscCard) {
        viscCard.classList.remove('warning-harden-heavy', 'warning-harden-light');
        if (gameState.viscosity >= 90) viscCard.classList.add('warning-harden-heavy');
        else if (gameState.viscosity > 75) viscCard.classList.add('warning-harden-light');
    }
}

function updateSummaryMeta(summary) {
    if (!summary) return;
    if (potionTypeLabel) potionTypeLabel.textContent = summary.potionType;
    if (dominantElementLabel) {
        dominantElementLabel.textContent = summary.dominantElement
            ? summary.dominantElement.replace(/\b\w/g, (letter) => letter.toUpperCase())
            : "None";
    }
    if (essenceTotalLabel) essenceTotalLabel.textContent = String(summary.totalEssence);
}

function handleAddWater() {
    if (!gameState.active || gameState.failed) return;
    gameState.viscosity = Math.max(0, gameState.viscosity - 20);
    gameState.potency = Math.max(0, gameState.potency - 5);
    gameState.currentTemp = Math.max(20, gameState.currentTemp - 15);
    updateLiveUI();
}

async function handleBrew() {
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

function updateSelectedCount() {
    const selected = getSelectedIngredients();
    if (ingredientCount) {
        ingredientCount.textContent = `${selected.length} / ${MAX_INGREDIENTS} selected`;
    }
    if (brewButton) {
        brewButton.disabled = selected.length === 0 || gameState.failed;
    }
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

    const extractionVal = Math.floor(gameState.extraction);

    for (const stat of stats) {
        const item = document.createElement("li");
        item.className = "stat-pill";
        const statText = stat.label ?? stat;
        item.textContent = `${statText} (Extraction: ${extractionVal}%)`;
        secondaryStatsList.append(item);
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
        active: false,
        targetTemp: 20,
        currentTemp: 20,
        potency: 0,
        volatility: 0,
        viscosity: 0,
        extraction: 0,
        volDangerTime: 0,
        viscDangerTime: 0,
        failed: false
    };
    if (tempSlider) tempSlider.value = 20;
    if (targetTempDisplay) targetTempDisplay.textContent = "20";
    updateLiveUI();
}