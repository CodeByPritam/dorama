import twilio from 'twilio';
import _appConfig from './config.js';

// Establish handshake
const twilioClient =  twilio(
    _appConfig.twilio.accountSID, 
    _appConfig.twilio.tokenforAuth,
);

// Export
export default twilioClient;