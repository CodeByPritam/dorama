import twilio from 'twilio';
import env from './env.js';

// Configure Twilio Client
const msg = twilio(env.twilio.accountSid, env.twilio.tokenforAuth);

// Export
export default msg;