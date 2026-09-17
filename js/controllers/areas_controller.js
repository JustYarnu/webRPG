import { loadAreas, selectArea } from "../services/areas_service.js";

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
        statusEl.textContent = "Areas loaded. Select an area.";

        openBtn.addEventListener("click", () => {
            document.querySelector("[data-area-dialog]")?.showModal();
        });
    } catch (error) {
        console.error(error);
        statusEl.textContent = "Unable to load areas.";
    }
}