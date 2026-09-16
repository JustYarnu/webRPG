import { addExperience, playerReady } from "./player_controller.js";

let activeArea = null;
const exploreCooldownDuration = 3000;
const historyMessageDuration = 3240;
const eventHistoryDuration = 12000;
let cooldownFrame = null;
let cooldownEndsAt = 0;

document.addEventListener("area-selected", (event) => {
    activeArea = event.detail;
    document.querySelector("[data-area-status]").textContent =
        `Exploring ${activeArea.name}: ${activeArea.description}`;
});

export function explore(area = activeArea) {
    if (!area) {
        throw new Error("Select an area before exploring.");
    }

    let rng = Math.random();
    if (rng < 0.3) {
        return "Nothing happens";
    }
    if (rng < 0.4) {
        return "Forage";
    }
    if (rng < 0.6) {
        return "Encounter";
    }
    if (rng < 0.9) {
        return "Loot";
    }
    return "Locate";
}

const eventTypes = new Set(["Forage", "Encounter", "Loot", "Locate"]);
const eventPages = {
    Forage: "forage_event.html",
    Encounter: "encounter_event.html",
    Loot: "loot_event.html",
    Locate: "locate_event.html",
};
const historyBelt = document.querySelector("[data-history-belt]");
const xpNotification = document.querySelector("[data-xp-notification]");
let xpNotificationTimer = null;
const historyCooldowns = new Map();
const activeEventCards = new Set();

function removeHistoryCard(card, animate = false) {
    const cooldown = historyCooldowns.get(card);
    if (cooldown?.removing) {
        return;
    }

    activeEventCards.delete(card);
    historyCooldowns.delete(card);
    clearTimeout(cooldown?.expiryTimer);

    if (!animate) {
        card.remove();
        return;
    }

    cooldown.removing = true;
    card.classList.add("history-card--leaving");
    setTimeout(() => card.remove(), 260);
}

function updateHistoryCooldowns() {
    const now = performance.now();

    for (const [card, cooldown] of historyCooldowns) {
        const remaining = Math.max(0, cooldown.endsAt - now);
        const progress = remaining / cooldown.duration;
        cooldown.bar.style.transform = `scaleX(${progress})`;

    }
}

function updateExploreButtonState() {
    const exploreButton = document.querySelector("[data-explore]");
    const remaining = Math.max(0, cooldownEndsAt - performance.now());

    exploreButton.disabled = remaining > 0 || activeEventCards.size > 0;
}

function ensureCooldownFrame() {
    if (cooldownFrame === null) {
        cooldownFrame = requestAnimationFrame(updateExploreCooldown);
    }
}

function updateExploreCooldown() {
    const exploreButton = document.querySelector("[data-explore]");
    const cooldownBar = document.querySelector("[data-explore-cooldown]");
    const remaining = Math.max(0, cooldownEndsAt - performance.now());
    const progress = remaining / exploreCooldownDuration;

    cooldownBar.style.transform = `scaleX(${progress})`;
    updateHistoryCooldowns();
    updateExploreButtonState();

    if (remaining > 0 || historyCooldowns.size > 0) {
        cooldownFrame = requestAnimationFrame(updateExploreCooldown);
    } else {
        cooldownFrame = null;
    }
}

function showXpNotification(levelsGained) {
    const levelMessage = levelsGained > 0 ? " Level up!" : "";
    xpNotification.textContent = `+10 XP${levelMessage}`;
    xpNotification.hidden = false;
    clearTimeout(xpNotificationTimer);
    xpNotificationTimer = setTimeout(() => {
        xpNotification.hidden = true;
    }, 2200);
}

function addHistoryCard(message, eventType = null) {
    const card = document.createElement("article");
    card.className = "history-card";

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    card.append(messageElement);

    const cooldownBar = document.createElement("span");
    cooldownBar.className = "history-cooldown";
    cooldownBar.setAttribute("aria-hidden", "true");
    card.append(cooldownBar);

    const duration = eventType ? eventHistoryDuration : historyMessageDuration;
    const cooldown = {
        bar: cooldownBar,
        duration,
        endsAt: performance.now() + duration,
        eventCard: Boolean(eventType),
        removing: false,
        expiryTimer: null,
    };
    historyCooldowns.set(card, cooldown);
    cooldown.expiryTimer = setTimeout(() => removeHistoryCard(card, true), duration);

    if (eventType) {
        activeEventCards.add(card);
    }
    ensureCooldownFrame();

    if (eventType) {
        const actions = document.createElement("div");
        actions.className = "history-card__actions";

        const engageButton = document.createElement("button");
        engageButton.type = "button";
        engageButton.textContent = "Engage";
        engageButton.addEventListener("click", () => {
            const query = new URLSearchParams({ area_id: activeArea.id });
            window.location.href = `${eventPages[eventType]}?${query}`;
        });

        const leaveButton = document.createElement("button");
        leaveButton.type = "button";
        leaveButton.textContent = "Leave";
        leaveButton.addEventListener("click", () => removeHistoryCard(card));

        actions.append(engageButton, leaveButton);
        card.append(actions);
    }

    historyBelt.prepend(card);
}

function startExploreCooldown() {
    cooldownEndsAt = performance.now() + exploreCooldownDuration;
    ensureCooldownFrame();
}

async function handleExplore() {
    if (!activeArea || activeEventCards.size > 0) {
        addHistoryCard("Select an area before exploring.");
        return;
    }

    const levelsGained = await addExperience(10);
    startExploreCooldown();

    const result = explore();
    showXpNotification(levelsGained);

    if (!eventTypes.has(result)) {
        addHistoryCard(`${result}...`);
        return;
    }

    addHistoryCard(`${result} event found!`, result);
}

document.querySelector("[data-explore]").addEventListener("click", handleExplore);
playerReady.catch((error) => console.error(error));