let vocesCache = [];

function cargarVoces() {
  if (!('speechSynthesis' in window)) return;
  const voces = window.speechSynthesis.getVoices();
  if (voces.length) vocesCache = voces;
}

if ('speechSynthesis' in window) {
  cargarVoces();
  window.speechSynthesis.onvoiceschanged = cargarVoces;
}

function elegirVozEspanola() {
  if (!vocesCache.length) cargarVoces();
  return (
    vocesCache.find((v) => v.lang === 'es-ES') ||
    vocesCache.find((v) => v.lang?.toLowerCase().startsWith('es')) ||
    null
  );
}

export function anunciarTurno(codigo, nombreCaja) {
  if (!('speechSynthesis' in window)) return;

  const texto = `Turno ${deletrearCodigo(codigo)}, pasar a ${nombreCaja}`;
  const utter = new SpeechSynthesisUtterance(texto);
  const voz = elegirVozEspanola();
  if (voz) {
    utter.voice = voz;
    utter.lang = voz.lang;
  } else {
    utter.lang = 'es-ES';
  }
  utter.rate = 0.95;
  utter.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function deletrearCodigo(codigo) {
  return codigo
    .split('')
    .map((c) => (c === '-' ? ', ' : c))
    .join(' ');
}
