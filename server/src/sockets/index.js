const { Server } = require('socket.io');
const { verifyAccessToken } = require('../config/jwt');
const { corsOptions } = require('../config/cors');

let io = null;

function setupSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: corsOptions,
    path: '/socket.io',
  });

  // JWT Authentication middleware for Socket.IO
  io.use((socket, next) => {
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

  io.on('connection', (socket) => {
    // Room subscription: queue:<menuId>
    socket.on('join:queue', (menuId) => {
      if (typeof menuId === 'string' && menuId.trim()) {
        socket.join(`queue:${menuId}`);
      }
    });

    socket.on('leave:queue', (menuId) => {
      if (typeof menuId === 'string' && menuId.trim()) {
        socket.leave(`queue:${menuId}`);
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

function setIO(newIO) {
  io = newIO;
}

/**
 * Emits real-time queue update notification to all clients subscribed to `queue:<menuId>`.
 * Must ONLY be called AFTER the database transaction has committed.
 */
function emitQueueUpdated(menuId, payload) {
  if (io) {
    io.to(`queue:${menuId}`).emit('queue:updated', {
      menuId,
      timestamp: new Date().toISOString(),
      ...(payload || {}),
    });
  }
}

module.exports = {
  setupSocketIO,
  getIO,
  setIO,
  emitQueueUpdated,
};
