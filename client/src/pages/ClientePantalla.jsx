import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { socket } from '../socket';
import { useEstado } from '../hooks/useEstado';
import { anunciarTurno } from '../utils/voz';
import { colorTextoContraste } from '../utils/color';

function formatHora(ts) {
  if (!ts) return '--:--:--';
  return new Date(ts).toLocaleTimeString('es', { hour12: false });
}

export default function ClientePantalla() {
  const estado = useEstado();
  const [sonidoActivo, setSonidoActivo] = useState(false);
  const ultimaSenal = useRef(null);

  useEffect(() => {
    function onAnuncio({ ticket, caja }) {
      if (!sonidoActivo) return;
      const senal = `${ticket.id}-${ticket.vecesLlamado}`;
      if (ultimaSenal.current === senal) return;
      ultimaSenal.current = senal;
      anunciarTurno(ticket.codigo, caja.nombre);
    }
    socket.on('anuncio', onAnuncio);
    return () => socket.off('anuncio', onAnuncio);
  }, [sonidoActivo]);

  if (!estado) return <div className="loading">Conectando con el servidor...</div>;

  const { categorias, cajas, contadoresEspera, historialLlamados } = estado;

  return (
    <div className="pantalla">
      <div className="top-bar">
        <Link to="/" className="link-volver">&larr; Inicio</Link>
        {!sonidoActivo && (
          <button className="btn-sonido" onClick={() => setSonidoActivo(true)}>
            Activar anuncio por voz
          </button>
        )}
      </div>

      <h1>Turnos en Atencion</h1>

      <div className="cajas-grid">
        {Object.values(cajas).map((caja) => (
          <div key={caja.id} className="caja-card">
            <h2>{caja.nombre}</h2>
            {caja.turnoActual ? (
              <>
                <div
                  className="ticket-grande"
                  style={{
                    background: categorias[caja.turnoActual.categoria].color,
                    color: colorTextoContraste(categorias[caja.turnoActual.categoria].color),
                  }}
                >
                  {caja.turnoActual.codigo}
                </div>
                <p className="ticket-hora">Llamado a las {formatHora(caja.turnoActual.llamadoEn)}</p>
              </>
            ) : (
              <div className="ticket-vacio">Esperando siguiente turno</div>
            )}
          </div>
        ))}
      </div>

      <div className="colas-resumen pantalla-colas">
        {Object.entries(categorias).map(([cat, info]) => (
          <div key={cat} className="cola-chip" style={{ borderColor: info.color }}>
            <span className="dot" style={{ background: info.color }} />
            {info.nombre}: <strong>{contadoresEspera[cat]}</strong> en espera
          </div>
        ))}
      </div>

      <div className="historial">
        <h3>Ultimos llamados</h3>
        <ul>
          {historialLlamados.map((h, i) => (
            <li key={h.ticket.id + '-' + h.ticket.vecesLlamado + '-' + i}>
              <span
                className="dot"
                style={{ background: categorias[h.ticket.categoria].color }}
              />
              <strong>{h.ticket.codigo}</strong> &rarr; {h.caja.nombre} &middot;{' '}
              {formatHora(h.ticket.llamadoEn)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
