import { getSavedAreaId, loadAreas, selectArea } from "../services/areas_service.js";

const DEFAULT_THEME = {
    "--ink": "#53675a",
    "--muted": "#718278",
    "--paper": "#f7f8f2",
    "--secondary": "#dfe9df",
    "--line": "#bdcdbf",
    "--accent": "#668873",
    "--accent-dark": "#4f715b",
    "--grid-line": "rgba(102, 136, 115, .06)",
    "--hover": "#d3dce7",
    "--gauge-end": "#8aa698",
};

const AREA_THEMES = {
    "plains": ["#5f5138", "#87795c", "#faf6e9", "#eee2bd", "#d8c58f", "#b4873d", "#8f672a", "#e8d7a9", "#d2af68"],
    "forest": ["#304f42", "#5e7a68", "#eef5ed", "#d2e4d1", "#a9c5a9", "#4e815f", "#356346", "#c1d9c2", "#82ad89"],
    "windswept desert": ["#664737", "#96755d", "#fcf1df", "#f0d4a9", "#ddb98a", "#c56f3f", "#9f512f", "#e9bd8a", "#df9b59"],
    "torn taiga": ["#294c50", "#5b7b7b", "#edf5f2", "#cfe3dc", "#a5c5bc", "#3e7d78", "#2e605e", "#bad8d0", "#75aaa0"],
    "rocky mountains": ["#3f4d59", "#71808b", "#f1f4f5", "#d8e0e3", "#b5c3c9", "#647f8d", "#496370", "#c8d4d9", "#8faab4"],
    "volcano": ["#572f2c", "#8b5a4e", "#fbefea", "#efd0c3", "#d9a99a", "#bd503d", "#96392f", "#e7b5a6", "#d37a5b"],
    "tundra": ["#3c5360", "#718995", "#f0f7f8", "#d5e8eb", "#b2d0d6", "#5b93a3", "#407485", "#c2dfe4", "#8fc0c9"],
    "arctic": ["#344b67", "#7188a1", "#eef4fc", "#d5e2f2", "#b1c6df", "#547dab", "#3e628b", "#c4d6eb", "#88acd0"],
    "stony shore": ["#3f5557", "#72898a", "#eff6f4", "#d4e6e1", "#b0cbc5", "#4d8a83", "#376c67", "#c1ddd7", "#83b5ac"],
};

function themeFromValues(values) {
    const [ink, muted, paper, secondary, line, accent, accentDark, hover, gaugeEnd] = values;
    return {
        "--ink": ink,
        "--muted": muted,
        "--paper": paper,
        "--secondary": secondary,
        "--line": line,
        "--accent": accent,
        "--accent-dark": accentDark,
        "--grid-line": `color-mix(in srgb, ${accent} 8%, transparent)`,
        "--hover": hover,
        "--gauge-end": gaugeEnd,
    };
}

export function applyAreaTheme(area) {
    const areaName = area?.name?.toLowerCase();
    const theme = AREA_THEMES[areaName]
        ? themeFromValues(AREA_THEMES[areaName])
        : DEFAULT_THEME;
    const previousAccent = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || DEFAULT_THEME["--accent"];

    for (const [property, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(property, value);
    }
    document.documentElement.style.setProperty("--theme-transition-from", previousAccent);
    document.documentElement.style.setProperty("--theme-transition-to", theme["--accent"]);

    document.body?.classList.remove("area-theme-changing");
    if (document.body) {
        void document.body.offsetWidth;
        document.body.classList.add("area-theme-changing");
    }
}

export async function initAreaTheme() {
    const areas = await loadAreas();
    const savedArea = areas.find((area) => area.id === getSavedAreaId());
    applyAreaTheme(savedArea ?? { name: "Starting grounds" });
}

function renderAreas(areas) {
    const areaList = document.querySelector("[data-area-list]");
    if (!areaList) return;

    areaList.replaceChildren();

    for (const area of areas) {
        const areaItem = document.createElement("li");
        const areaButton = document.createElement("button");
        areaButton.type = "button";
        areaButton.dataset.areaId = area.id;
        areaButton.textContent = area.name;
        areaButton.addEventListener("click", () => {
            const selected = selectArea(area.id);
            document.querySelector("[data-selected-area]").textContent = selected.name;
            applyAreaTheme(selected);
            document.querySelector("[data-area-dialog]")?.close();
        });
        areaItem.append(areaButton);
        areaList.append(areaItem);
    }
}

export async function initAreaPicker() {
    const statusEl = document.querySelector("[data-area-status]");
    const openBtn = document.querySelector("[data-open-area-picker]");

    if (!statusEl || !openBtn) return;

    try {
        const areas = await loadAreas();
        renderAreas(areas);

        const savedArea = areas.find((area) => area.id === getSavedAreaId());
        if (savedArea) {
            const selected = selectArea(savedArea.id);
            document.querySelector("[data-selected-area]").textContent = selected.name;
            applyAreaTheme(selected);
            statusEl.textContent = `Exploring ${selected.name}: ${selected.description}`;
        } else {
            initAreaTheme();
            statusEl.textContent = "Areas loaded. Select an area.";
        }

        openBtn.addEventListener("click", () => {
            document.querySelector("[data-area-dialog]")?.showModal();
        });
    } catch (error) {
        console.error(error);
        statusEl.textContent = "Unable to load areas.";
    }
}