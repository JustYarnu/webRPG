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

export function savePlayer() {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(playerState));
}

function renderPlayer() {
    const playerName = document.querySelector("[data-player-name]");

    if (!playerName) {
        return;
    }

    playerName.textContent = playerState.name;
    document.querySelector("[data-player-level]").textContent = `Level ${playerState.level}`;
    document.querySelector("[data-player-experience]").textContent = playerState.experience;
    const requiredExperience = getRequiredExp(playerState.level);
    const experienceProgress = Math.min(
        100,
        (playerState.experience / requiredExperience) * 100,
    );
    const experienceProgressBar = document.querySelector("[data-xp-progress]");
    if (experienceProgressBar) {
        experienceProgressBar.style.width = `${experienceProgress}%`;
    }
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

export const playerReady = startGame();

export async function addItem(item) {
    await playerReady;
    updatePlayer((player) => {
        player.inventory.push(item);
    });
}

export async function getPlayerState() {
    await playerReady;
    return clone(playerState);
}

export function getRequiredExp(level) {
    if (level <= 1) {
        return 100;
    }

    const polynomial = 100 + 4.61 * Math.pow(level - 1, 1.25);
    const exponential = Math.exp(0.00015 * (level - 1));
    return Math.round(polynomial * exponential);
}

export async function addExperience(amount) {
    await playerReady;
    let levelsGained = 0;

    updatePlayer((player) => {
        player.experience += amount;
        while (player.experience >= getRequiredExp(player.level)) {
            player.level += 1;
            levelsGained += 1;
        }
    });

    return levelsGained;
}

async function startGame() {
    const defaultPlayer = await loadDefaultPlayer();
    playerState = readSavedPlayer() ?? clone(defaultPlayer);
    savePlayer();
    renderPlayer();
    const playerStatus = document.querySelector("[data-player-status]");
    if (playerStatus) {
        playerStatus.textContent = "Player state loaded.";
    }
}

const addExperienceButton = document.querySelector("[data-add-xp]");
if (addExperienceButton) {
    addExperienceButton.addEventListener("click", () => addExperience(10));
}

playerReady.catch((error) => {
    console.error(error);
    const playerStatus = document.querySelector("[data-player-status]");
    if (playerStatus) {
        playerStatus.textContent = "Unable to load player data.";
    }
});
