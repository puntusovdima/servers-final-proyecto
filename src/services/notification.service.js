import { EventEmitter } from 'events';

class NotificationService extends EventEmitter {}
const notificationService = new NotificationService();

// Setup listeners to fulfill the Event System requirement
notificationService.on('user:registered', (email) => {
    console.log(`[Notification Service] 🆕 User Registered: ${email}`);
});

notificationService.on('user:verified', (email) => {
    console.log(`[Notification Service] ✅ User Verified: ${email}`);
});

notificationService.on('user:invited', (email) => {
    console.log(`[Notification Service] ✉️ User Invited: ${email}`);
});

export default notificationService;
