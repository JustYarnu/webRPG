let activeArea = null;

export const EXPLORE_CONFIG = {
    cooldownDuration: 3000,
    historyMessageDuration: 3240,
    eventHistoryDuration: 12000,
    eventPages: {
        Forage: "forage_event.html",
        Encounter: "encounter_event.html",
        Loot: "loot_event.html",
        Locate: "locate_event.html",
    }
};

const eventTypes = new Set(Object.keys(EXPLORE_CONFIG.eventPages));

export function setActiveArea(area) {
    activeArea = area;
}

export function getActiveArea() {
    return activeArea;
}

export function isEvent(result) {
    return eventTypes.has(result);
}

// Pure game logica: bepaalt de uitkomst van een verkenning
export function rollExploreOutcome(area = activeArea) {
    if (!area) {
        throw new Error("Select an area before exploring.");
    }

    const rng = Math.random();
    if (rng < 0.3) return "Nothing happens";
    if (rng < 0.5) return "Forage";
    if (rng < 0.7) return "Encounter";
    if (rng < 0.9) return "Loot";
    return "Locate";
}