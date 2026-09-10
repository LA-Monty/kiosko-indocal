import { useState } from 'react';
import { Link } from 'react-router-dom';
import { socket } from '../socket';
import { useEstado } from '../hooks/useEstado';
import { colorTextoContraste } from '../utils/color';

const OPCIONES = [
  { categoria: 'PROFORMA', titulo: 'Proformas', detalle: 'Solicitar una proforma' },
  { categoria: 'PAGO', titulo: 'Pago de Facturas', detalle: 'Pagar una factura pendiente' },
  { categoria: 'CERTIFICADO', titulo: 'Pago de Certificaciones', detalle: 'Pagar una certificacion' },
];

export default function ClienteSolicitar() {
  const estado = useEstado();
  const [ticket, setTicket] = useState(null);
  const [cargando, setCargando] = useState(false);

  if (!estado) return <div className="loading">Conectando con el servidor...</div>;

  function solicitar(categoria) {
    setCargando(true);
    socket.emit('solicitar_turno', categoria, (res) => {
      setCargando(false);
      if (res?.ok) setTicket(res.ticket);
    });
  }

  return (
    <div className="cliente-solicitar">
      <Link to="/" className="link-volver">&larr; Inicio</Link>
      <h1>Solicitar Turno</h1>

      {ticket ? (
        <div className="ticket-confirmacion">
          <p>Su turno es</p>
          <div
            className="ticket-grande"
            style={{
              background: estado.categorias[ticket.categoria].color,
              color: colorTextoContraste(estado.categorias[ticket.categoria].color),
            }}
          >
            {ticket.codigo}
          </div>
          <p>{estado.categorias[ticket.categoria].nombre}</p>
          <button onClick={() => setTicket(null)}>Solicitar otro turno</button>
        </div>
      ) : (
        <>
          <p className="home-sub">Seleccione el tramite que desea realizar</p>
          <div className="opciones-grid">
            {OPCIONES.map((op) => (
              <button
                key={op.categoria}
                className="opcion-card"
                disabled={cargando}
                style={{ borderColor: estado.categorias[op.categoria].color }}
                onClick={() => solicitar(op.categoria)}
              >
                <span
                  className="dot grande"
                  style={{ background: estado.categorias[op.categoria].color }}
                />
                <h2>{op.titulo}</h2>
                <p>{op.detalle}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
