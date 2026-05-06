import express from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';
import { errorHandler } from './middleware/error-handler.js';
import AppError from './utils/AppError.js';
import UserRouter from './routes/user.routes.js';
import ClientRouter from './routes/client.routes.js';
import ProjectRouter from './routes/project.routes.js';
import DeliveryNoteRouter from './routes/deliveryNote.routes.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use((req, res, next) => {
    if (req.body) {
        mongoSanitize.sanitize(req.body, { replaceWith: '_' });
    }
    next();
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later'
});
app.use('/api', limiter);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use('/api/user', UserRouter);
app.use('/api/client', ClientRouter);
app.use('/api/project', ProjectRouter);
app.use('/api/deliverynote', DeliveryNoteRouter);

app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

export default app;
