import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Returns the singleton Socket.IO client.
 * autoConnect: false — the socket does NOT connect until connectSocket() is called.
 * This prevents unauthenticated connection attempts on app startup.
 */
export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('accessToken');
    socket = io(window.location.origin, {
      path: '/socket.io',
      auth: {
        token: token ?? '',
      },
      autoConnect: false, // do not connect until explicitly called
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

/**
 * Connects the socket with the current access token.
 * Call this after successful login/session restore.
 */
export function connectSocket(): void {
  const token = localStorage.getItem('accessToken');
  if (!token) return; // don't connect without a token
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) {
    s.connect();
  }
}

export function updateSocketToken(token: string | null): void {
  if (socket) {
    if (token) {
      socket.auth = { token };
      if (!socket.connected) {
        socket.connect();
      }
    } else {
      socket.disconnect();
      socket = null;
    }
  }
}

export function subscribeToQueue(menuId: string, onUpdate: () => void): () => void {
  const s = getSocket();

  // Ensure the socket is actually connected before subscribing
  if (!s.connected) {
    connectSocket();
  }

  const handleConnect = () => {
    s.emit('join:queue', menuId);
  };

  if (s.connected) {
    s.emit('join:queue', menuId);
  } else {
    s.once('connect', handleConnect); // use once to avoid duplicate listeners
  }

  s.on('queue:updated', onUpdate);

  return () => {
    s.off('connect', handleConnect);
    s.off('queue:updated', onUpdate);
    s.emit('leave:queue', menuId);
  };
}
