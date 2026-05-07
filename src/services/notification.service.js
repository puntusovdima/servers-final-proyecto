import { EventEmitter } from 'events';
import { sendSlackNotification } from './slack.service.js';
import { sendVerificationEmail } from './mail.service.js';

class NotificationService extends EventEmitter {}
const notificationService = new NotificationService();

notificationService.on('user:registered', ({ email, code }) => {
    console.log(`[Notification Service] 🆕 User Registered: ${email}`);
    sendSlackNotification(`🆕 *New User Registered*: ${email}`);
    sendVerificationEmail(email, code);
});

notificationService.on('user:verified', (email) => {
    console.log(`[Notification Service] ✅ User Verified: ${email}`);
    sendSlackNotification(`✅ *User Verified*: ${email}`);
});

notificationService.on('user:invited', (email) => {
    console.log(`[Notification Service] ✉️ User Invited: ${email}`);
    sendSlackNotification(`✉️ *User Invited*: ${email}`);
});

export default notificationService;
