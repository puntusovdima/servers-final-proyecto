import { EventEmitter } from 'events';
import { sendSlackNotification } from './slack.service.js';

class NotificationService extends EventEmitter {}
const notificationService = new NotificationService();

// Setup listeners to fulfill the Event System requirement
notificationService.on('user:registered', (email) => {
    console.log(`[Notification Service] 🆕 User Registered: ${email}`);
    sendSlackNotification(`🆕 *New User Registered*: ${email}`);
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
