import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import UsuarioView from './pages/UsuarioView';
import ClienteSolicitar from './pages/ClienteSolicitar';
import ClientePantalla from './pages/ClientePantalla';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/usuario" element={<UsuarioView />} />
        <Route path="/cliente" element={<ClienteSolicitar />} />
        <Route path="/pantalla" element={<ClientePantalla />} />
      </Routes>
    </BrowserRouter>
  );
}
