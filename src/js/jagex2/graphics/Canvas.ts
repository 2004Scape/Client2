export const canvasFake: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
export const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
export const canvas2d: CanvasRenderingContext2D = canvasFake.getContext('2d', {willReadFrequently: true})!;
export const jpegCanvas: HTMLCanvasElement = document.createElement('canvas');
export const jpegImg: HTMLImageElement = document.createElement('img');
export const jpeg2d: CanvasRenderingContext2D = jpegCanvas.getContext('2d', {willReadFrequently: true})!;
export const glCanvas: HTMLCanvasElement = document.createElement('canvas');
export const gl: WebGL2RenderingContext = 
                canvas.getContext('webgl2',{willReadFrequently: true})! as WebGL2RenderingContext;
