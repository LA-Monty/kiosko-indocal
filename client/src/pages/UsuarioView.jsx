import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { socket } from '../socket';
import { useEstado } from '../hooks/useEstado';
import { colorTextoContraste } from '../utils/color';

function formatHora(ts) {
  if (!ts) return '--:--:--';
  return new Date(ts).toLocaleTimeString('es', { hour12: false });
}

export default function UsuarioView() {
  const estado = useEstado();
  const [cajaId, setCajaId] = useState(
    () => localStorage.getItem('caja_id') || 'caja1'
  );

  useEffect(() => {
    localStorage.setItem('caja_id', cajaId);
  }, [cajaId]);

  if (!estado) return <div className="loading">Conectando con el servidor...</div>;

  const { categorias, cajas, contadoresEspera, maxLlamados } = estado;
  const caja = cajas[cajaId];
  const turnoActual = caja.turnoActual;

  return (
    <div className="usuario-view">
      <div className="top-bar">
        <Link to="/" className="link-volver">&larr; Inicio</Link>
        <div className="selector-caja">
          <label>Estacion:</label>
          <select value={cajaId} onChange={(e) => setCajaId(e.target.value)}>
            {Object.values(cajas).map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <h1>{caja.nombre}</h1>
      <p className="caja-desc">{caja.descripcion}</p>

      <div className="colas-resumen">
        {caja.categorias.map((cat) => (
          <div key={cat} className="cola-chip" style={{ borderColor: categorias[cat].color }}>
            <span className="dot" style={{ background: categorias[cat].color }} />
            {categorias[cat].nombre}: <strong>{contadoresEspera[cat]}</strong> en espera
          </div>
        ))}
      </div>

      <div className="panel-actual">
        {turnoActual ? (
          <>
            <div
              className="ticket-grande"
              style={{
                background: categorias[turnoActual.categoria].color,
                color: colorTextoContraste(categorias[turnoActual.categoria].color),
              }}
            >
              {turnoActual.codigo}
            </div>
            <p className="ticket-info">
              Categoria: {categorias[turnoActual.categoria].nombre} &middot; Llamado{' '}
              {turnoActual.vecesLlamado}/{maxLlamados} veces &middot; Ultima llamada:{' '}
              {formatHora(turnoActual.llamadoEn)}
            </p>
            <div className="acciones">
              <button
                disabled={turnoActual.vecesLlamado >= maxLlamados}
                onClick={() => socket.emit('volver_a_llamar', cajaId)}
              >
                Volver a llamar
              </button>
              <button
                className="btn-saltar"
                onClick={() => socket.emit('saltar_turno', cajaId)}
              >
                Saltar turno
              </button>
              <button
                className="btn-atender"
                onClick={() => socket.emit('atender_turno', cajaId)}
              >
                Finalizar atencion
              </button>
            </div>
          </>
        ) : (
          <div className="sin-turno">
            <p>No hay ningun turno en atencion en esta estacion.</p>
            <button
              className="btn-llamar"
              onClick={() => socket.emit('llamar_turno', cajaId)}
            >
              Llamar siguiente turno
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
