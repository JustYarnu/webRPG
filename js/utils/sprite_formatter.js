export default class SpriteFormatter {
    static imageCache = new Map();

    static placeholderRGB = [127, 255, 255];

    static async createPotionSprite(action, liquidType, targetColor) {
        const basePath = `../assets/potions/bottle/bottle-${action}.png`;
        const layerPath = `../assets/potions/liquid/${action}-${liquidType}.png`;

        const [baseImg, layerImg] = await Promise.all([
            this._loadImage(basePath),
            this._loadImage(layerPath)
        ]);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        canvas.width = baseImg.naturalWidth;
        canvas.height = baseImg.naturalHeight;

        ctx.drawImage(baseImg, 0, 0);
        ctx.drawImage(layerImg, 0, 0, canvas.width, canvas.height);

        this._recolorContext(ctx, canvas.width, canvas.height, this.placeholderRGB, targetColor);

        return canvas;
    }

    static async _loadImage(src) {
        if (this.imageCache.has(src)) {
            return this.imageCache.get(src);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(src, img);
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load sprite: ${src}`));
            img.src = src;
        });
    }

    static _recolorContext(ctx, width, height, sourceRGB, replacementRGB) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const [tr, tg, tb] = sourceRGB;
        const [rr, rg, rb] = replacementRGB;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i] === tr && data[i + 1] === tg && data[i + 2] === tb) {
                data[i] = rr; // Red
                data[i + 1] = rg; // Green
                data[i + 2] = rb; // Blue
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }
}