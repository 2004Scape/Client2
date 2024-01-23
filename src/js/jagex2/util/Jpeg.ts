const canvas: HTMLCanvasElement = document.createElement('canvas');
const img: HTMLImageElement = document.createElement('img');
const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d', {willReadFrequently: true});

export const decodeJpeg = async (data: Uint8Array): Promise<ImageData> => {
    if (data[0] !== 0xff) {
        // fix invalid JPEG header
        data[0] = 0xff;
    }

    URL.revokeObjectURL(img.src); // Remove previous decoded jpeg.
    img.src = URL.createObjectURL(new Blob([data], {type: 'image/jpeg'}));

    // wait for img to load
    await new Promise<void>((resolve): (() => void) => (img.onload = (): void => resolve()));

    if (!ctx) {
        throw new Error('Canvas 2d not found!!!!!!!!');
    }
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width: number = img.naturalWidth;
    const height: number = img.naturalHeight;
    canvas.width = width;
    canvas.height = height;

    // Draw the image
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, width, height);
};
