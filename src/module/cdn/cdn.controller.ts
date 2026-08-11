import type { Context, Handler } from 'hono';
import imageResize from './image.service.js';

// Content Delivery Network Logic
const CdnController: Handler = async (c: Context) => {
    const type = (c.req.param("type") as string).toLowerCase();

    // On Type Service Call :: Poster, Banner, Preview
    if (type === 'poster' || type === 'banner' || type === 'preview') {
        const opts = (c.req.param("opts") as string).toLowerCase();
        const backdropUrl = (c.req.param("backdropUrl") as string);

        // OnType Logic
        let height, width;
        if (type === 'poster') { width = 600, height = 900 }
        if (type === 'banner') { width = 1920, height = 1080 }

        // Construct, Parse URL
        const parsed = new URL(`https://media.themoviedb.org/t/p/w${width}_and_h${height}_face/${backdropUrl}`);
        const res = await fetch(parsed, { redirect: 'follow' });

        // Get Buffer, Image Extention & Extract Opts
        const buffer = Buffer.from(await res.arrayBuffer());
        const extension = backdropUrl.split('.').pop();
        const instruction = Object.fromEntries(
            opts.split(',').map((item) => {
                const [key, value] = item.split('_');
                return [key, Number(value)];
            })
        );

        // Call Sharp Image Resizer
        const { output, contentType } = await imageResize(buffer, { width: instruction.w, height: instruction.h, quality: instruction.q }, extension as string);
        c.header('Content-Type', contentType);
        c.header('Cache-Control', 'public, max-age=31536000, immutable');
        c.header('CDN-Cache-Control', 'max-age=31536000');

        // Return
        return c.body(Uint8Array.from(output), 200);
    }
 
    // On Type Service Call :: Player / Video
    if (type === 'video' || type === 'player') {}

}

// Export
export default CdnController;