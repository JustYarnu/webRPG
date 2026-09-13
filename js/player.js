const PLAYER_STORAGE_KEY = "webRPG.player.v1";

let playerState;

function clone(value) {
    return structuredClone(value);
}

async function loadDefaultPlayer() {
    const response = await fetch("../data/player.json", { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Could not load player defaults (${response.status}).`);
    }

    return response.json();
}

function readSavedPlayer() {
    const savedPlayer = localStorage.getItem(PLAYER_STORAGE_KEY);

    if (!savedPlayer) {
        return null;
    }

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
}

function renderPlayer() {
    document.querySelector("[data-player-name]").textContent = playerState.name;
    document.querySelector("[data-player-level]").textContent = `Level ${playerState.level}`;
    document.querySelector("[data-player-experience]").textContent = playerState.experience;
    document.querySelector("[data-player-hp]").textContent =
        `${playerState.hp.current} / ${playerState.hp.maximum}`;
    document.querySelector("[data-player-coins]").textContent = playerState.coins;
    document.querySelector("[data-player-gems]").textContent = playerState.gems;
}

function updatePlayer(updater) {
    updater(playerState);
    savePlayer();
    renderPlayer();
}

async function startGame() {
    const defaultPlayer = await loadDefaultPlayer();
    playerState = readSavedPlayer() ?? clone(defaultPlayer);
    savePlayer();
    renderPlayer();
    document.querySelector("[data-player-status]").textContent =
        "Player state loaded.";
}

document.querySelector("[data-add-xp]").addEventListener("click", () => {
    updatePlayer((player) => {
        player.experience += 10;
    });
});

startGame().catch((error) => {
    console.error(error);
    document.querySelector("[data-player-status]").textContent =
        "Unable to load player data.";
});
