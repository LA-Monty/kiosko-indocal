import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home">
      <h1>Sistema de Turnos</h1>
      <p className="home-sub">Selecciona la vista que quieres abrir en este dispositivo</p>
      <div className="home-cards">
        <Link to="/usuario" className="home-card">
          <h2>Vista de Usuario</h2>
          <p>Panel de caja para llamar y gestionar turnos</p>
        </Link>
        <Link to="/cliente" className="home-card">
          <h2>Solicitar Turno</h2>
          <p>Kiosco para que el cliente pida su turno</p>
        </Link>
        <Link to="/pantalla" className="home-card">
          <h2>Pantalla de Turnos</h2>
          <p>Tablero publico con anuncio por voz</p>
        </Link>
      </div>
    </div>
  );
}
