import { useEffect, useState } from 'react';
import { getEstadoActual, suscribirseAEstado } from '../socket';

export function useEstado() {
  const [estado, setEstado] = useState(getEstadoActual);

  useEffect(() => {
    setEstado(getEstadoActual());
    return suscribirseAEstado(setEstado);
  }, []);

  return estado;
}
