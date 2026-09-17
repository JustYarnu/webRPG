import {
    MAX_INGREDIENTS,
    loadAlchemyInventory,
    getSelectedIngredients,
    addIngredient,
    getPotionSummary,
    filterIngredients,
    brewAndSavePotion
} from "../services/alchemy_service.js";

let ingredientSearch, ingredientList, ingredientEmpty, ingredientCount, brewButton;
let potionTypeLabel, dominantElementLabel, essenceTotalLabel;
let viscosityFill, volatilityFill, potencyFill;
let viscosityLabel, volatilityLabel, potencyLabel, secondaryStatsList;

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
    viscosityFill = document.querySelector("[data-viscosity-fill]");
    volatilityFill = document.querySelector("[data-volatility-fill]");
    potencyFill = document.querySelector("[data-potency-fill]");
    viscosityLabel = document.querySelector("[data-viscosity-label]");
    volatilityLabel = document.querySelector("[data-volatility-label]");
    potencyLabel = document.querySelector("[data-potency-label]");
    secondaryStatsList = document.querySelector("[data-secondary-stats]");

    if (ingredientSearch) {
        ingredientSearch.addEventListener("input", renderIngredientList);
    }

    if (brewButton) {
        brewButton.addEventListener("click", handleBrew);
    }

    try {
        await loadAlchemyInventory();
        updateUI();
    } catch (error) {
        console.error(error);
        if (ingredientEmpty) {
            ingredientEmpty.hidden = false;
            ingredientEmpty.textContent = "Unable to load alchemy ingredients.";
        }
    }
}

function updateUI() {
    const summary = getPotionSummary();
    updateSelectedCount();
    updateGauges(summary);
    renderIngredientList();
}

async function handleBrew() {
    await brewAndSavePotion();
    updateUI();
}

function handleAddIngredient(item) {
    const added = addIngredient(item);
    if (added) {
        updateUI();
    }
}

function updateSelectedCount() {
    const selected = getSelectedIngredients();
    if (ingredientCount) {
        ingredientCount.textContent = `${selected.length} / ${MAX_INGREDIENTS} selected`;
    }

    if (brewButton) {
        brewButton.disabled = selected.length === 0;
    }
}

function updateGauges(summary) {
    if (!summary) return;

    const { gauges } = summary;

    if (viscosityFill) {
        viscosityFill.style.transform = `scaleX(${Math.min(1, (gauges.viscosity.percent || 0) / 100)})`;
    }
    if (volatilityFill) {
        volatilityFill.style.transform = `scaleX(${Math.min(1, (gauges.volatility.percent || 0) / 100)})`;
    }
    if (potencyFill) {
        potencyFill.style.transform = `scaleX(${Math.min(1, (gauges.potency.percent || 0) / 100)})`;
    }

    if (viscosityLabel) viscosityLabel.textContent = gauges.viscosity.label;
    if (volatilityLabel) volatilityLabel.textContent = gauges.volatility.label;
    if (potencyLabel) potencyLabel.textContent = gauges.potency.label;
    if (potionTypeLabel) potionTypeLabel.textContent = summary.potionType;
    if (dominantElementLabel) {
        dominantElementLabel.textContent = summary.dominantElement
            ? summary.dominantElement.replace(/\b\w/g, (letter) => letter.toUpperCase())
            : "None";
    }
    if (essenceTotalLabel) essenceTotalLabel.textContent = String(summary.totalEssence);

    renderSecondaryStats(summary);
}

function renderSecondaryStats(summary) {
    if (!secondaryStatsList) return;

    secondaryStatsList.replaceChildren();
    const selected = getSelectedIngredients();

    const stats = [...new Set(selected.flatMap((item) => item?.suffixStats ?? item?.secondary_stats ?? []))];
    if (!stats.length) {
        const placeholder = document.createElement("li");
        placeholder.className = "stat-pill placeholder";
        placeholder.textContent = summary?.ingredientCount ? "No secondary stats" : "No selected ingredients";
        secondaryStatsList.append(placeholder);
        return;
    }

    for (const stat of stats) {
        const item = document.createElement("li");
        item.className = "stat-pill";
        item.textContent = stat;
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
        const stats = (item.suffixStats ?? item.secondary_stats ?? []).join(" • ") || "No secondary stats";
        const elements = [...(item.damage_types ?? []), ...(item.prefixStats ?? [])].filter(Boolean).join(" • ") || "Neutral";
        details.textContent = `${stats} • ${elements}`;

        itemButton.append(meta, details);
        itemButton.addEventListener("click", () => handleAddIngredient(item));
        ingredientList.append(itemButton);
    }
}