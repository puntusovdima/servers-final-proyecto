import { sendSlackNotification } from '../services/slack.service.js';

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.name === 'CastError') {
        statusCode = 404;
        message = `Resource not found with id of ${err.value}`;
    }
    
    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value entered';
    }

    const response = {
        status: "error",
        message
    };

    if (statusCode >= 500) {
        const slackMessage = `🚨 *5XX Error Detected*\n` +
            `*Method:* ${req.method}\n` +
            `*Path:* ${req.originalUrl}\n` +
            `*Status Code:* ${statusCode}\n` +
            `*Message:* ${message}\n` +
            `*Stack Trace:* \`\`\`${err.stack}\`\`\``;
        sendSlackNotification(slackMessage);
    }

    console.error(`[Error Handler] ${statusCode} - ${message}`);

    res.status(statusCode).json(response);
};
