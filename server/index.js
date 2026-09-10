const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 4000;

// ---- Configuracion de categorias ----
const CATEGORIAS = {
  PROFORMA: { nombre: 'Proformas', prefijo: 'PR', color: '#1E3A8A' },
  CERTIFICADO: { nombre: 'Certificados', prefijo: 'CE', color: '#2563EB' },
  PAGO: { nombre: 'Pagos', prefijo: 'PA', color: '#93C5FD' },
};

const MAX_LLAMADOS = 3;

// ---- Configuracion de cajas / usuarios ----
const cajasIniciales = {
  caja1: {
    id: 'caja1',
    nombre: 'Caja 1',
    descripcion: 'Entrega de Proformas / Certificados / Pagos',
    categorias: ['PROFORMA', 'CERTIFICADO', 'PAGO'],
    turnoActual: null,
  },
  caja2: {
    id: 'caja2',
    nombre: 'Caja 2',
    descripcion: 'Pagos / Certificados',
    categorias: ['PAGO', 'CERTIFICADO'],
    turnoActual: null,
  },
};

// ---- Estado en memoria ----
let contadores = { PROFORMA: 0, CERTIFICADO: 0, PAGO: 0 };
let cola = []; // tickets en espera y ya procesados (historial simple)
let cajas = JSON.parse(JSON.stringify(cajasIniciales));
let ultimoLlamado = null; // { ticket, caja } - para anuncio de voz
let historialLlamados = []; // ultimos N llamados para el tablero

function nuevoTicketId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generarCodigo(categoria) {
  contadores[categoria] += 1;
  const numero = String(contadores[categoria]).padStart(3, '0');
  return `${CATEGORIAS[categoria].prefijo}-${numero}`;
}

function ticketsEnEspera() {
  return cola.filter((t) => t.estado === 'esperando');
}

function siguienteTicketPara(caja) {
  const permitidas = cajas[caja].categorias;
  const candidatos = ticketsEnEspera()
    .filter((t) => permitidas.includes(t.categoria))
    .sort((a, b) => a.creadoEn - b.creadoEn);
  return candidatos[0] || null;
}

function estadoPublico() {
  const cajasConTicket = {};
  for (const [id, c] of Object.entries(cajas)) {
    cajasConTicket[id] = {
      ...c,
      turnoActual: c.turnoActual ? cola.find((t) => t.id === c.turnoActual) || null : null,
    };
  }
  return {
    categorias: CATEGORIAS,
    cajas: cajasConTicket,
    contadoresEspera: {
      PROFORMA: ticketsEnEspera().filter((t) => t.categoria === 'PROFORMA').length,
      CERTIFICADO: ticketsEnEspera().filter((t) => t.categoria === 'CERTIFICADO').length,
      PAGO: ticketsEnEspera().filter((t) => t.categoria === 'PAGO').length,
    },
    historialLlamados,
    maxLlamados: MAX_LLAMADOS,
  };
}

function difundirEstado() {
  io.emit('estado', estadoPublico());
}

io.on('connection', (socket) => {
  socket.emit('estado', estadoPublico());
  if (ultimoLlamado) socket.emit('anuncio', ultimoLlamado);

  socket.on('solicitar_turno', (categoria, callback) => {
    if (!CATEGORIAS[categoria]) {
      if (callback) callback({ ok: false, error: 'Categoria invalida' });
      return;
    }
    const ticket = {
      id: nuevoTicketId(),
      codigo: generarCodigo(categoria),
      categoria,
      estado: 'esperando',
      creadoEn: Date.now(),
      llamadoEn: null,
      caja: null,
      vecesLlamado: 0,
    };
    cola.push(ticket);
    difundirEstado();
    if (callback) callback({ ok: true, ticket });
  });

  socket.on('llamar_turno', (cajaId) => {
    const caja = cajas[cajaId];
    if (!caja || caja.turnoActual) return;
    const ticket = siguienteTicketPara(cajaId);
    if (!ticket) return;
    ticket.estado = 'llamando';
    ticket.caja = cajaId;
    ticket.vecesLlamado = 1;
    ticket.llamadoEn = Date.now();
    caja.turnoActual = ticket.id;

    const anuncio = { ticket, caja: caja };
    ultimoLlamado = anuncio;
    historialLlamados.unshift(anuncio);
    historialLlamados = historialLlamados.slice(0, 10);

    io.emit('anuncio', anuncio);
    difundirEstado();
  });

  socket.on('volver_a_llamar', (cajaId) => {
    const caja = cajas[cajaId];
    if (!caja || !caja.turnoActual) return;
    const ticket = cola.find((t) => t.id === caja.turnoActual);
    if (!ticket || ticket.vecesLlamado >= MAX_LLAMADOS) return;
    ticket.vecesLlamado += 1;
    ticket.llamadoEn = Date.now();

    const anuncio = { ticket, caja };
    ultimoLlamado = anuncio;
    historialLlamados.unshift(anuncio);
    historialLlamados = historialLlamados.slice(0, 10);

    io.emit('anuncio', anuncio);
    difundirEstado();
  });

  socket.on('atender_turno', (cajaId) => {
    const caja = cajas[cajaId];
    if (!caja || !caja.turnoActual) return;
    const ticket = cola.find((t) => t.id === caja.turnoActual);
    if (ticket) ticket.estado = 'atendido';
    caja.turnoActual = null;
    difundirEstado();
  });

  socket.on('saltar_turno', (cajaId) => {
    const caja = cajas[cajaId];
    if (!caja || !caja.turnoActual) return;
    const ticket = cola.find((t) => t.id === caja.turnoActual);
    if (ticket) ticket.estado = 'saltado';
    caja.turnoActual = null;
    difundirEstado();
  });
});

app.get('/', (req, res) => {
  res.send('Servidor Sistema de Turnos activo');
});

server.listen(PORT, () => {
  console.log(`Servidor de turnos escuchando en puerto ${PORT}`);
});
