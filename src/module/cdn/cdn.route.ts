import { Hono } from 'hono';
import CdnController from './cdn.controller.js';

// Create :: A CDN router instance
const CdnRouter = new Hono();
CdnRouter.get('/:type/:opts/:backdropUrl', CdnController);
CdnRouter.get('/:type/:r2VideoKey', CdnController);

// Export
export default CdnRouter;