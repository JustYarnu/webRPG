import {
    playerReady,
    getPlayerState,
    getTotalRequiredExp,
    addExperience
} from "../services/player_service.js";

let nameEl, levelEl, expEl, expProgressEl, hpEl, coinsEl, gemsEl;

export function initPlayerUI() {
    nameEl = document.querySelector("[data-player-name]");

    if (!nameEl) return;

    levelEl = document.querySelector("[data-player-level]");
    expEl = document.querySelector("[data-player-experience]");
    expProgressEl = document.querySelector("[data-xp-progress]");
    hpEl = document.querySelector("[data-player-hp]");
    coinsEl = document.querySelector("[data-player-coins]");
    gemsEl = document.querySelector("[data-player-gems]");

    const statusEl = document.querySelector("[data-player-status]");
    const addExperienceButton = document.querySelector("[data-add-xp]");

    if (addExperienceButton) {
        addExperienceButton.addEventListener("click", () => addExperience(10));
    }

    document.addEventListener("player-updated", (event) => {
        renderPlayer(event.detail);
    });

    playerReady
        .then(async () => {
            if (statusEl) statusEl.textContent = "Player state loaded.";

            const state = await getPlayerState();
            renderPlayer(state);
        })
        .catch((error) => {
            console.error(error);
            if (statusEl) statusEl.textContent = "Unable to load player data.";
        });
}

function renderPlayer(state) {
    if (!nameEl) return;

    nameEl.textContent = state.name;

    if (levelEl) levelEl.textContent = `Level ${state.level}`;
    if (expEl) expEl.textContent = state.experience;

    if (expProgressEl) {
        const requiredExperience = getTotalRequiredExp(state.level);
        const experienceProgress = Math.min(
            100,
            (state.experience / requiredExperience) * 100,
        );
        expProgressEl.style.width = `${experienceProgress}%`;
    }

    if (hpEl) hpEl.textContent = `${state.hp.current} / ${state.hp.maximum}`;
    if (coinsEl) coinsEl.textContent = state.coins;
    if (gemsEl) gemsEl.textContent = state.gems;
}