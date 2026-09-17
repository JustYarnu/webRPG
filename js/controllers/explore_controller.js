import { addExperience, playerReady } from "../services/player_service.js";
import {
    setActiveArea,
    getActiveArea,
    rollExploreOutcome,
    isEvent,
    EXPLORE_CONFIG
} from "../services/explore_service.js";

let cooldownFrame = null;
let cooldownEndsAt = 0;
let xpNotificationTimer = null;
const historyCooldowns = new Map();
const activeEventCards = new Set();

let historyBeltEl = null;
let xpNotificationEl = null;
let exploreButtonEl = null;
let cooldownBarEl = null;
let areaStatusEl = null;

export function initExploreUI() {
    exploreButtonEl = document.querySelector("[data-explore]");

    if (!exploreButtonEl) return;

    historyBeltEl = document.querySelector("[data-history-belt]");
    xpNotificationEl = document.querySelector("[data-xp-notification]");
    cooldownBarEl = document.querySelector("[data-explore-cooldown]");
    areaStatusEl = document.querySelector("[data-area-status]");

    exploreButtonEl.addEventListener("click", handleExplore);

    document.addEventListener("area-selected", (event) => {
        setActiveArea(event.detail);
        if (areaStatusEl) {
            areaStatusEl.textContent = `Exploring ${event.detail.name}: ${event.detail.description}`;
        }
    });

    playerReady.catch((error) => console.error(error));
}

async function handleExplore() {
    const activeArea = getActiveArea();

    if (!activeArea || activeEventCards.size > 0) {
        addHistoryCard("Select an area before exploring.");
        return;
    }

    const levelsGained = await addExperience(10);
    startExploreCooldown();

    const result = rollExploreOutcome(activeArea);
    showXpNotification(levelsGained);

    if (!isEvent(result)) {
        addHistoryCard(`${result}...`);
        return;
    }

    addHistoryCard(`${result} event found!`, result);
}

function startExploreCooldown() {
    cooldownEndsAt = performance.now() + EXPLORE_CONFIG.cooldownDuration;
    ensureCooldownFrame();
}

function ensureCooldownFrame() {
    if (cooldownFrame === null) {
        cooldownFrame = requestAnimationFrame(updateExploreCooldown);
    }
}

function updateExploreCooldown() {
    const remaining = Math.max(0, cooldownEndsAt - performance.now());
    const progress = remaining / EXPLORE_CONFIG.cooldownDuration;

    if (cooldownBarEl) {
        cooldownBarEl.style.transform = `scaleX(${progress})`;
    }

    updateHistoryCooldowns();
    updateExploreButtonState();

    if (remaining > 0 || historyCooldowns.size > 0) {
        cooldownFrame = requestAnimationFrame(updateExploreCooldown);
    } else {
        cooldownFrame = null;
    }
}

function updateExploreButtonState() {
    if (!exploreButtonEl) return;
    const remaining = Math.max(0, cooldownEndsAt - performance.now());
    exploreButtonEl.disabled = remaining > 0 || activeEventCards.size > 0;
}

function updateHistoryCooldowns() {
    const now = performance.now();
    for (const [card, cooldown] of historyCooldowns) {
        const remaining = Math.max(0, cooldown.endsAt - now);
        const progress = remaining / cooldown.duration;
        cooldown.bar.style.transform = `scaleX(${progress})`;
    }
}

function showXpNotification(levelsGained) {
    if (!xpNotificationEl) return;

    const levelMessage = levelsGained > 0 ? " Level up!" : "";
    xpNotificationEl.textContent = `+10 XP${levelMessage}`;
    xpNotificationEl.hidden = false;

    clearTimeout(xpNotificationTimer);
    xpNotificationTimer = setTimeout(() => {
        xpNotificationEl.hidden = true;
    }, 2200);
}

function addHistoryCard(message, eventType = null) {
    if (!historyBeltEl) return;

    const card = document.createElement("article");
    card.className = "history-card";

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    card.append(messageElement);

    const cooldownBar = document.createElement("span");
    cooldownBar.className = "history-cooldown";
    cooldownBar.setAttribute("aria-hidden", "true");
    card.append(cooldownBar);

    const duration = eventType
        ? EXPLORE_CONFIG.eventHistoryDuration
        : EXPLORE_CONFIG.historyMessageDuration;

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

        const actions = document.createElement("div");
        actions.className = "history-card__actions";

        const engageButton = document.createElement("button");
        engageButton.type = "button";
        engageButton.textContent = "Engage";
        engageButton.addEventListener("click", () => {
            const activeArea = getActiveArea();
            const query = new URLSearchParams({ area_id: activeArea.id });
            window.location.href = `${EXPLORE_CONFIG.eventPages[eventType]}?${query}`;
        });

        const leaveButton = document.createElement("button");
        leaveButton.type = "button";
        leaveButton.textContent = "Leave";
        leaveButton.addEventListener("click", () => removeHistoryCard(card));

        actions.append(engageButton, leaveButton);
        card.append(actions);
    }

    ensureCooldownFrame();
    historyBeltEl.prepend(card);
}

function removeHistoryCard(card, animate = false) {
    const cooldown = historyCooldowns.get(card);
    if (cooldown?.removing) return;

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