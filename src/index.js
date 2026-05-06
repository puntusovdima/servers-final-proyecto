import app from './app.js';
import { connectDB } from './config/index.js';
import { env } from './config/env.js';
import mongoose from 'mongoose';

const server = app.listen(env.PORT, async () => {
    await connectDB();
    console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        console.log('HTTP server closed.');
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
    });
};

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
