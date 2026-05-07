import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET.trim());
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      socket.companyId = user.company?.toString();
      
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id} (User: ${socket.user.email})`);

    if (socket.companyId) {
      socket.join(socket.companyId);
      console.log(`🏢 User ${socket.user.email} joined company room: ${socket.companyId}`);
    }

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const notifyCompany = (companyId, event, data) => {
  if (io && companyId) {
    io.to(companyId.toString()).emit(event, data);
  }
};

export const notifyClient = (clientId, event, data) => {
  if (io) {
    io.to(clientId).emit(event, data);
  }
};
