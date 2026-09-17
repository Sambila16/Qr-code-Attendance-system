import { io } from 'socket.io-client';
import { API_BASE_URL } from './client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE_URL, { autoConnect: true, transports: ['websocket', 'polling'] });
  }
  return socket;
}
