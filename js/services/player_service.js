const PLAYER_STORAGE_KEY = "webRPG.player.v1";
let playerState = null;

async function loadDefaultPlayer() {
    const response = await fetch("../data/player.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Could not load player defaults (${response.status}).`);
    }
    return response.json();
}

function readSavedPlayer() {
    const savedPlayer = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!savedPlayer) return null;

    try {
        return JSON.parse(savedPlayer);
    } catch (error) {
        console.warn("Saved player data was invalid and has been ignored.", error);
        localStorage.removeItem(PLAYER_STORAGE_KEY);
        return null;
    }
}

function savePlayer() {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(playerState));

    // Broadcast een signaal dat de data is aangepast!
    // Controllers kunnen hiernaar luisteren om de UI up te daten.
    document.dispatchEvent(new CustomEvent("player-updated", {
        detail: structuredClone(playerState)
    }));
}

// Start de data-load zodra deze service geïmporteerd wordt ergens in de app.
// Dit mag direct, want het raakt geen HTML aan, alleen fetch/localStorage.
export const playerReady = initPlayerCore();

async function initPlayerCore() {
    const defaultPlayer = await loadDefaultPlayer();
    playerState = readSavedPlayer() ?? structuredClone(defaultPlayer);
    savePlayer();
    return playerState;
}

export async function getPlayerState() {
    await playerReady;
    return structuredClone(playerState);
}

function getRequiredExp(level) {
    if (level <= 1) return 100;
    const polynomial = 100 + 4.61 * Math.pow(level - 1, 1.25);
    const exponential = Math.exp(0.00015 * (level - 1));
    return Math.round(polynomial * exponential);
}

export function getTotalRequiredExp(level) {
    if (level <= 1) return 50;
    let totalExp = 0;
    for (let i = 1; i < level; i++) {
        totalExp += getRequiredExp(i);
    }
    return totalExp;
}

export async function addItem(item) {
    await playerReady;
    playerState.inventory.push(item);
    savePlayer();
}

export async function addExperience(amount) {
    await playerReady;
    let levelsGained = 0;

    playerState.experience += amount;

    while (playerState.experience >= getTotalRequiredExp(playerState.level)) {
        playerState.level += 1;
        levelsGained += 1;
    }

    savePlayer();
    return levelsGained;
}