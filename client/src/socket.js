import { io } from 'socket.io-client';

const SERVER_URL = `${window.location.protocol}//${window.location.hostname}:4000`;

export const socket = io(SERVER_URL, {
  autoConnect: true,
});

let estadoActual = null;
const listeners = new Set();

socket.on('estado', (data) => {
  estadoActual = data;
  listeners.forEach((fn) => fn(estadoActual));
});

export function getEstadoActual() {
  return estadoActual;
}

export function suscribirseAEstado(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
