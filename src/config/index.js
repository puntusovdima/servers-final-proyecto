import mongoose from 'mongoose';

/**
 * Connects to the MongoDB database using the URL provided in the environment.
 * Handles the actual connection so our index.js stays clean.
 */
import { env } from './env.js';

export const connectDB = async () => {
    try {
        const uri = env.MONGO_URI;
        
        await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};
