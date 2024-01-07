import Draw2D from './Draw2D';

import {decodeJpeg} from '../util/JsUtil';
import Archive from '../io/Archive';
import Packet from '../io/Packet';

export default class Pix24 {
  // constructor
  readonly pixels: Uint32Array;
  readonly width: number;
  readonly height: number;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;

  constructor(width: number, height: number) {
    this.pixels = new Uint32Array(width * height);
    this.width = this.cropW = width;
    this.height = this.cropH = height;
    this.cropX = this.cropY = 0;
  }

  static fromJpeg = async (archive: Archive, name: string): Promise<Pix24> => {
    const dat = archive.read(name + '.dat');
    const jpeg = await decodeJpeg(dat);
    const image = new Pix24(jpeg.width, jpeg.height);

    // copy pixels (uint32) to imageData (uint8)
    const pixels = image.pixels;
    const data = jpeg.data;
    for (let i = 0; i < pixels.length; i++) {
      const index = i * 4;
      pixels[i] = (data[index + 3] << 24) | (data[index + 0] << 16) | (data[index + 1] << 8) | (data[index + 2] << 0);
    }

    return image;
  };

  static fromArchive = (archive: Archive, name: string, sprite: number = 0): Pix24 => {
    const dat = new Packet(archive.read(name + '.dat'));
    const index = new Packet(archive.read('ind ex.dat'));

    // cropW/cropH are shared across all sprites in a single image
    index.pos = dat.g2;
    const cropW = index.g2;
    const cropH = index.g2;

    // palette is shared across all images in a single archive
    const paletteCount = index.g1;
    const palette = new Uint32Array(paletteCount);
    const length = paletteCount - 1;
    for (let i = 0; i < length; i++) {
      // the first color (0) is reserved for transparency
      palette[i + 1] = index.g3;

      // black (0) will become transparent, make it black (1) so it's visible
      if (palette[i + 1] === 0) {
        palette[i + 1] = 1;
      }
    }

    // advance to sprite
    for (let i = 0; i < sprite; i++) {
      index.pos += 2;
      dat.pos += index.g2 * index.g2;
      index.pos += 1;
    }

    // read sprite
    const cropX = index.g1;
    const cropY = index.g1;
    const width = index.g2;
    const height = index.g2;

    const image = new Pix24(width, height);
    image.cropX = cropX;
    image.cropY = cropY;
    image.cropW = cropW;
    image.cropH = cropH;

    const pixelOrder = index.g1;
    if (pixelOrder === 0) {
      const length = image.width * image.height;
      for (let i = 0; i < length; i++) {
        image.pixels[i] = palette[dat.g1];
      }
    } else if (pixelOrder === 1) {
      const width = image.width;
      for (let x = 0; x < width; x++) {
        const height = image.height;
        for (let y = 0; y < height; y++) {
          image.pixels[x + y * width] = palette[dat.g1];
        }
      }
    }

    return image;
  };

  draw = (x: number, y: number): void => {
    x = x | 0;
    y = y | 0;

    x += this.cropX;
    y += this.cropY;

    let dstOff = x + y * Draw2D.width;
    let srcOff = 0;

    let h = this.height;
    let w = this.width;

    let dstStep = Draw2D.width - w;
    let srcStep = 0;

    if (y < Draw2D.top) {
      const cutoff = Draw2D.top - y;
      h -= cutoff;
      y = Draw2D.top;
      srcOff += cutoff * w;
      dstOff += cutoff * Draw2D.width;
    }

    if (y + h > Draw2D.bottom) {
      h -= y + h - Draw2D.bottom;
    }

    if (x < Draw2D.left) {
      const cutoff = Draw2D.left - x;
      w -= cutoff;
      x = Draw2D.left;
      srcOff += cutoff;
      dstOff += cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }

    if (x + w > Draw2D.right) {
      const cutoff = x + w - Draw2D.right;
      w -= cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }

    if (w > 0 && h > 0) {
      this.copyImageDraw(w, h, this.pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep);
    }
  };

  blitOpaque = (x: number, y: number): void => {
    x = x | 0;
    y = y | 0;

    x += this.cropX;
    y += this.cropY;

    let dstOff = x + y * Draw2D.width;
    let srcOff = 0;

    let h = this.height;
    let w = this.width;

    let dstStep = Draw2D.width - w;
    let srcStep = 0;

    if (y < Draw2D.top) {
      const cutoff = Draw2D.top - y;
      h -= cutoff;
      y = Draw2D.top;
      srcOff += cutoff * w;
      dstOff += cutoff * Draw2D.width;
    }

    if (y + h > Draw2D.bottom) {
      h -= y + h - Draw2D.bottom;
    }

    if (x < Draw2D.left) {
      const cutoff = Draw2D.left - x;
      w -= cutoff;
      x = Draw2D.left;
      srcOff += cutoff;
      dstOff += cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }

    if (x + w > Draw2D.right) {
      const cutoff = x + w - Draw2D.right;
      w -= cutoff;
      srcStep += cutoff;
      dstStep += cutoff;
    }

    if (w > 0 && h > 0) {
      this.copyImageBlitOpaque(w, h, this.pixels, srcOff, srcStep, Draw2D.pixels, dstOff, dstStep);
    }
  };

  flipHorizontally = (): void => {
    const pixels = this.pixels;
    const width = this.width;
    const height = this.height;

    for (let y = 0; y < height; y++) {
      const div = width / 2;
      for (let x = 0; x < div; x++) {
        const off1 = x + y * width;
        const off2 = width - x - 1 + y * width;

        const tmp = pixels[off1];
        pixels[off1] = pixels[off2];
        pixels[off2] = tmp;
      }
    }
  };

  flipVertically = (): void => {
    const pixels = this.pixels;
    const width = this.width;
    const height = this.height;

    for (let y = 0; y < height / 2; y++) {
      for (let x = 0; x < width; x++) {
        const off1 = x + y * width;
        const off2 = x + (height - y - 1) * width;

        const tmp = pixels[off1];
        pixels[off1] = pixels[off2];
        pixels[off2] = tmp;
      }
    }
  };

  private copyImageBlitOpaque = (
    w: number,
    h: number,
    src: Uint32Array,
    srcOff: number,
    srcStep: number,
    dst: Uint32Array,
    dstOff: number,
    dstStep: number
  ): void => {
    const qw = -(w >> 2);
    w = -(w & 0x3);

    for (let y = -h; y < 0; y++) {
      for (let x = qw; x < 0; x++) {
        dst[dstOff++] = src[srcOff++];
        dst[dstOff++] = src[srcOff++];
        dst[dstOff++] = src[srcOff++];
        dst[dstOff++] = src[srcOff++];
      }

      for (let x = w; x < 0; x++) {
        dst[dstOff++] = src[srcOff++];
      }

      dstOff += dstStep;
      srcOff += srcStep;
    }
  };

  private copyImageDraw = (
    w: number,
    h: number,
    src: Uint32Array,
    srcOff: number,
    srcStep: number,
    dst: Uint32Array,
    dstOff: number,
    dstStep: number
  ): void => {
    const qw = -(w >> 2);
    w = -(w & 0x3);

    for (let y = -h; y < 0; y++) {
      for (let x = qw; x < 0; x++) {
        let rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }

        rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }

        rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }

        rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
      }

      for (let x = w; x < 0; x++) {
        const rgb = src[srcOff++];
        if (rgb === 0) {
          dstOff++;
        } else {
          dst[dstOff++] = rgb;
        }
      }

      dstOff += dstStep;
      srcOff += srcStep;
    }
  };
}
