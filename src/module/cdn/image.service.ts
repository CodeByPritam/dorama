import sharp from 'sharp';
import type { FormatEnum, OutputOptions } from 'sharp';

// Disable sharp internal cache,
// Set concurrency equals to system cpu core count
sharp.cache(false);
sharp.concurrency(2);

// @type interface :: ResizeOpts
interface ImageResizeOpts {
    width: number;
    height: number;
    quality?: number;
}

// Default Content Type
const CONTENT_TYPE: Record<string, string> = {
    webp: 'image/webp',
    avif: 'image/avif',
    jpg: 'image/jpeg',
    png: 'image/png',
}

// Image Resize Logic
async function imageResize(buf: Buffer, opts: ImageResizeOpts, ext: string) {
    const { width, height, quality = 80 } = opts;
    const format = ext === 'jpg' ? 'jpeg' : (ext as keyof FormatEnum)

    // Sharp output, with ~16384x16384 cap
    const output = await sharp(buf, { limitInputPixels: 268402689 })
    .resize(width, height, { fit: 'cover' })
    .toFormat(format, { quality: quality } as OutputOptions)
    .toBuffer();

    // Return
    return { output, contentType: CONTENT_TYPE[ext] || 'application/octet-stream' };
}

// Export
export default imageResize;