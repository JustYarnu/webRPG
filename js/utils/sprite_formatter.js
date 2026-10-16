export default class SpriteFormatter {
    static imageCache = new Map();

    static placeholderColors = [
        [127, 255, 255],
        [255, 127, 255],
        [255, 255, 127],
    ];
    static elementColors = {
        fire: [[255, 190, 125], [255, 105, 55], [155, 35, 25]],
        earth: [[220, 190, 145], [160, 115, 75], [90, 55, 35]],
        air: [[245, 255, 255], [175, 225, 245], [100, 155, 190]],
        water: [[150, 220, 255], [55, 140, 235], [25, 70, 155]],
        thunder: [[255, 250, 155], [255, 210, 55], [185, 115, 20]],
        necrotic: [[215, 175, 235], [145, 90, 180], [75, 40, 105]],
        radiant: [[255, 255, 220], [255, 235, 130], [205, 160, 55]],
        poison: [[200, 245, 125], [120, 195, 65], [55, 115, 35]],
    };
    static potionActions = {
        vapor: "throw",
        haze: "throw",
        miasma: "throw",
        gas: "throw",
        aerosol: "throw",
        plume: "throw",
        fume: "throw",
        cloud: "throw",
        blastwave: "throw",
        draught: "drink",
        tonic: "drink",
        elixir: "drink",
        flask: "drink",
        fluid: "drink",
        splash: "drink",
        fuming: "drink",
        brew: "drink",
        thermite: "drink",
        balm: "apply",
        oil: "apply",
        paste: "apply",
        slime: "apply",
        adhesive: "apply",
        pitch: "apply",
        reactive_gel: "apply",
        volatile_paste: "apply",
        sludge: "apply",
    };
    static potionLiquidTypes = {
        flask: "fluid",
    };

    static getElementColor(element) {
        if (!element) return null;
        return this.elementColors[String(element).toLowerCase()] ?? null;
    }

    static getPotionSpriteOptions(potionType, dominantElement) {
        const liquidType = String(potionType ?? "brew")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");

        return {
            action: this.potionActions[liquidType] ?? "drink",
            liquidType: this.potionActions[liquidType]
                ? (this.potionLiquidTypes[liquidType] ?? liquidType)
                : "brew",
            color: this.getElementColor(dominantElement),
        };
    }

    static async createPotionSprite(action, liquidType, targetColor) {
        const basePath = `../assets/potions/bottle/bottle-${action}.png`;
        const layerPath = `../assets/potions/liquid/${action}-${liquidType}.png`;

        const [baseImg, layerImg] = await Promise.all([
            this._loadImage(basePath),
            this._loadImage(layerPath)
        ]);

        const canvas = document.createElement('canvas');
        canvas.width = baseImg.naturalWidth;
        canvas.height = baseImg.naturalHeight;
        const ctx = canvas.getContext('2d');

        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = canvas.width;
        layerCanvas.height = canvas.height;
        const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true });
        layerCtx.drawImage(layerImg, 0, 0, canvas.width, canvas.height);
        this._recolorContext(layerCtx, canvas.width, canvas.height, this.placeholderColors, targetColor);

        ctx.drawImage(baseImg, 0, 0);
        ctx.drawImage(layerCanvas, 0, 0);

        return canvas;
    }

    static async _loadImage(src) {
        if (this.imageCache.has(src)) {
            return this.imageCache.get(src);
        }

        const imagePromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(src, img);
                resolve(img);
            };
            img.onerror = () => {
                this.imageCache.delete(src);
                reject(new Error(`Failed to load sprite: ${src}`));
            };
            img.src = src;
        });
        this.imageCache.set(src, imagePromise);
        return imagePromise;
    }

    static _recolorContext(ctx, width, height, sourceColors, replacementColors) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const replacementPalette = replacementColors?.length === 3 && !Array.isArray(replacementColors[0])
            ? sourceColors.map(() => replacementColors)
            : replacementColors;
        const colorMap = new Map(
            sourceColors.map((color, index) => [color.join(","), replacementPalette?.[index] ?? null]),
        );

        for (let i = 0; i < data.length; i += 4) {
            const replacementColor = colorMap.get(`${data[i]},${data[i + 1]},${data[i + 2]}`);
            if (colorMap.has(`${data[i]},${data[i + 1]},${data[i + 2]}`)) {
                if (replacementColor === null) {
                    data[i + 3] = 0;
                } else {
                    [data[i], data[i + 1], data[i + 2]] = replacementColor;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }
}