

let activeArea = null;

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
const eventDialog = document.querySelector("[data-event-dialog]");
let pendingEvent = null;

eventDialog.addEventListener("close", () => {
    if (eventDialog.returnValue === "engage" && pendingEvent) {
        const query = new URLSearchParams({ area_id: activeArea.id });
        window.location.href = `${eventPages[pendingEvent]}?${query}`;
    }

    pendingEvent = null;
});

document.querySelector("[data-explore]").addEventListener("click", () => {
    const result = explore();
    const resultElement = document.querySelector("[data-explore-result]");

    if (!eventTypes.has(result)) {
        resultElement.textContent = result;
        return;
    }

    pendingEvent = result;
    document.querySelector("[data-event-message]").textContent =
        `${result} event found. Do you want to engage?`;
    eventDialog.showModal();
});

// Disables the explore button for 3 seconds after it is clicked
function startExploreCooldown() {

}

// Updates the explore button to show how much time is left on the cooldown
function updateExploreCooldown() {

}