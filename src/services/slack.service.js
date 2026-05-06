import { IncomingWebhook } from '@slack/webhook';
import { env } from '../config/env.js';

const url = env.SLACK_WEBHOOK;
const webhook = url ? new IncomingWebhook(url) : null;

export const sendSlackNotification = async (message) => {
  if (!webhook) {
    console.log(`[Slack Simulation] 📢 ${message}`);
    return;
  }

  try {
    await webhook.send({
      text: message,
      attachments: [
        {
          color: '#36a64f',
          fields: [
            {
              title: 'Environment',
              value: env.NODE_ENV,
              short: true
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error);
  }
};
