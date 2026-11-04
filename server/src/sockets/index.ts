import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../config/jwt';
import { corsOptions } from '../config/cors';

let io: Server | null = null;

export function setupSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: corsOptions,
    path: '/socket.io',
  });

  // JWT Authentication middleware for Socket.IO
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : null);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      socket.data.user = { userId: payload.userId, role: payload.role };
      next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    // Room subscription: queue:<menuId>
    socket.on('join:queue', (menuId: string) => {
      if (typeof menuId === 'string' && menuId.trim()) {
        socket.join(`queue:${menuId}`);
      }
    });

    socket.on('leave:queue', (menuId: string) => {
      if (typeof menuId === 'string' && menuId.trim()) {
        socket.leave(`queue:${menuId}`);
      }
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function setIO(newIO: Server | null): void {
  io = newIO;
}

/**
 * Emits real-time queue update notification to all clients subscribed to `queue:<menuId>`.
 * Must ONLY be called AFTER the database transaction has committed.
 */
export function emitQueueUpdated(menuId: string, payload?: Record<string, unknown>): void {
  if (io) {
    io.to(`queue:${menuId}`).emit('queue:updated', {
      menuId,
      timestamp: new Date().toISOString(),
      ...(payload || {}),
    });
  }
}
