const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const size = canvas.width;
const radius = size / 2;
let anguloInicial = 0;
let girando = false;
let premios = [];
let colors = [];

const sonidoRuleta = document.getElementById("sonidoRuleta");
const boton = document.getElementById("boton-central");


const URL = 'https://script.google.com/macros/s/AKfycby34WI92Sv8szm_agBYXXDHdYkeK2QCEAjpupyQrJ7cx0nH7GO4bdzEvGLoNasL3z4/exec';

// ======= FUNCIONES =======

async function obtenerPremiosDesdeSheet() {
  try {
    const response = await fetch(`${URL}?action=get`);
    const data = await response.json();
    return data.premios;
  } catch (error) {
    console.error("Error al obtener premios:", error);
    return [];
  }
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
  const popup = document.getElementById("popup-premio");
  const mensaje = document.getElementById("mensaje-premio");
  mensaje.innerHTML = `🎁 <strong>${premio}</strong><br>Código: <strong>${codigo}</strong>`;
  popup.classList.remove("hidden");
}


async function guardarGanador(premio, codigo) {
  try {
    await fetch(`${URL}?action=save&premio=${encodeURIComponent(premio)}&codigo=${encodeURIComponent(codigo)}`);
  } catch (error) {
    console.error("Error al guardar ganador:", error);
  }
}

function girarRuleta() {
  const audio = document.getElementById('sonidoRuleta');
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => {
      console.error("No se pudo reproducir el audio", e);
    });
  }
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


    if (velocidad > 0.002) {
      requestAnimationFrame(animar);
    } else {
      const numPremios = premios.length;
      const anguloPorPremio = 2 * Math.PI / numPremios;
      const anguloFinal = (anguloInicial + Math.PI / 2) % (2 * Math.PI);
      const index = Math.floor(numPremios - (anguloFinal / anguloPorPremio)) % numPremios;
      const premioGanado = premios[index];


      const codigo = generarCodigo();

      document.getElementById("resultado").textContent = `¡Ganaste: ${premioGanado}! Código: ${codigo}`;
      mostrarAnuncio(premioGanado, codigo);
      guardarGanador(premioGanado, codigo);
      girando = false;
    }
  };

  animar();
}
function continuar() {
  document.getElementById("popup-premio").classList.add("hidden");
  window.location.href = "index.html"
}

function cambiarUsuario() {
  window.location.href = "login.html"; 
}


// ======= INICIALIZACIÓN =======

document.getElementById("boton-central").addEventListener("click", girarRuleta);

async function inicializar() {
  premios = await obtenerPremiosDesdeSheet();
  colors = premios.map((_, i) => ["#8ca37c", "#e8e9e5", "#5a514a", "#bac1af", "#757a70", "#c9d4bc", "#7c8c6c", "#acb79b", "#bac1af", "#8ca37c"][i % 10]);
  dibujarRuleta();
}

inicializar();
