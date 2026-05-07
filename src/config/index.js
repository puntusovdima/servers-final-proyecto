import mongoose from 'mongoose';

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
