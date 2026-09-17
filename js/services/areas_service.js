let areas = [];
export let selectedArea = null;

export async function loadAreas() {
    if (areas.length > 0) return areas;

    const response = await fetch("../data/areas.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Could not load areas (${response.status}).`);
    }

    const areaData = await response.json();
    areas = areaData.areas;
    return areas;
}

export function selectArea(areaId) {
    selectedArea = areas.find((area) => area.id === Number(areaId)) ?? null;

    if (!selectedArea) {
        throw new Error(`Area ${areaId} does not exist.`);
    }

    document.dispatchEvent(
        new CustomEvent("area-selected", { detail: selectedArea }),
    );
    return selectedArea;
}