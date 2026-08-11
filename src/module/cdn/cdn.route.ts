import { Hono } from 'hono';
import CdnController from './cdn.controller.js';

// Create :: A CDN router instance
const CdnRouter = new Hono();
CdnRouter.get('/:type/:instruction/:base64EncodedImageLink', CdnController);
CdnRouter.get('/:type/:base64EncodedVideoId', CdnController);

// Export
export default CdnRouter;