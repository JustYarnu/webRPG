let areas = [];
export let selectedArea = null;

async function loadAreas() {
    const response = await fetch("../data/areas.json", { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Could not load areas (${response.status}).`);
    }

    const areaData = await response.json();
    areas = areaData.areas;
}

function renderAreas() {
    const areaList = document.querySelector("[data-area-list]");
    areaList.replaceChildren();

    for (const area of areas) {
        const areaButton = document.createElement("button");
        areaButton.type = "button";
        areaButton.dataset.areaId = area.id;
        areaButton.textContent = area.name;
        areaButton.addEventListener("click", () => selectArea(area.id));
        areaList.append(areaButton);
    }
}

export function selectArea(areaId) {
    selectedArea = areas.find((area) => area.id === Number(areaId)) ?? null;

    if (!selectedArea) {
        throw new Error(`Area ${areaId} does not exist.`);
    }

    document.querySelector("[data-selected-area]").textContent = selectedArea.name;
    document.querySelector("[data-area-dialog]").close();
    document.dispatchEvent(
        new CustomEvent("area-selected", { detail: selectedArea }),
    );
}

async function startAreaSelection() {
    await loadAreas();
    renderAreas();
    document.querySelector("[data-area-status]").textContent =
        "Areas loaded. Select an area.";
    document.querySelector("[data-open-area-picker]").addEventListener("click", () => {
        document.querySelector("[data-area-dialog]").showModal();
    });
}

startAreaSelection().catch((error) => {
    console.error(error);
    document.querySelector("[data-area-status]").textContent =
        "Unable to load areas.";
});