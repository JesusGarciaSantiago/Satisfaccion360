const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const size = canvas.width;
const radius = size / 2;
let anguloInicial = 0;
let girando = false;
let premios = [];
let colors = [];

const sonidoRuleta = document.getElementById("sonidoRuleta");

// Reemplaza esta URL con tu propia Web App URL de Google Sheets que entrega un JSON tipo ["Premio1", "Premio2", ...]
const URL_GET = "https://script.google.com/macros/s/TU_SCRIPT_ID/exec";
const URL_POST = "https://script.google.com/macros/s/TU_SCRIPT_ID/exec";

// ======= FUNCIONES =======

async function obtenerPremiosDesdeSheet() {
  const res = await fetch(URL_GET);
  const data = await res.json();
  return data;
}

function dibujarRuleta() {
  const num = premios.length;
  const arco = 2 * Math.PI / num;

  for (let i = 0; i < num; i++) {
    const angle = anguloInicial + i * arco;
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, angle, angle + arco);
    ctx.fill();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle + arco / 2);
    ctx.fillStyle = "#000";
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    ctx.fillText(premios[i], radius - 10, 10);
    ctx.restore();
  }

  // Flecha
  ctx.fillStyle = "#5a514a";
  ctx.beginPath();
  ctx.moveTo(radius - 10, 0);
  ctx.lineTo(radius + 10, 0);
  ctx.lineTo(radius, 20);
  ctx.closePath();
  ctx.fill();
}

function generarCodigo() {
  return 'C' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function mostrarAnuncio(premio, codigo) {
  alert(`🎉 ¡Ganaste: ${premio}!\n🎁 Código de canje: ${codigo}`);
}

function guardarGanador(premio, codigo) {
  fetch(URL_POST, {
    method: "POST",
    body: JSON.stringify({ premio, codigo, fecha: new Date().toISOString() }),
    headers: { "Content-Type": "application/json" }
  });
}

function girarRuleta() {
  if (girando) return;
  girando = true;

  let giro = 0;
  let velocidad = Math.random() * 0.3 + 0.25;
  const desaceleracion = 0.995;

  const animar = () => {
    giro += velocidad;
    velocidad *= desaceleracion;
    anguloInicial += velocidad;
    anguloInicial %= 2 * Math.PI;
    ctx.clearRect(0, 0, size, size);
    dibujarRuleta();
    sonidoRuleta.currentTime = 0;
    sonidoRuleta.play();

    if (velocidad > 0.002) {
      requestAnimationFrame(animar);
    } else {
      const grados = anguloInicial * (180 / Math.PI);
      const index = premios.length - Math.floor((grados % 360) / (360 / premios.length)) - 1;
      const premioGanado = premios[index < 0 ? premios.length - 1 : index];
      const codigo = generarCodigo();

      document.getElementById("resultado").textContent = `¡Ganaste: ${premioGanado}! Código: ${codigo}`;
      mostrarAnuncio(premioGanado, codigo);
      guardarGanador(premioGanado, codigo);
      girando = false;
    }
  };

  animar();
}

// ======= INICIALIZACIÓN =======

document.getElementById("boton-central").addEventListener("click", girarRuleta);

async function inicializar() {
  premios = await obtenerPremiosDesdeSheet();
  colors = premios.map((_, i) => ["#8ca37c", "#e8e9e5", "#5a514a", "#bac1af", "#757a70", "#c9d4bc", "#7c8c6c", "#acb79b", "#bac1af", "#8ca37c"][i % 10]);
  dibujarRuleta();
}

inicializar();
