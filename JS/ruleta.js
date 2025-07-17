const premios = [
  "Descuento 10%",
  "Bebida gratis",
  "Postre gratis",
  "Entrada gratis",
  "Gracias por participar",
  "Descuento 15%",
  "Combo especial",
  "Regalo sorpresa",
  "Platillo a mitad de precio",
  "Siguiente visita gratis"
];

const colors = [
  "#8ca37c", "#e8e9e5", "#5a514a", "#bac1af", "#757a70",
  "#c9d4bc", "#7c8c6c", "#acb79b", "#bac1af", "#8ca37c"
];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const size = canvas.width;
const radius = size / 2;
let anguloInicial = 0;
let girando = false;

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

  ctx.fillStyle = "#5a514a";
  ctx.beginPath();
  ctx.moveTo(radius - 10, 0);
  ctx.lineTo(radius + 10, 0);
  ctx.lineTo(radius, 20);
  ctx.closePath();
  ctx.fill();
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

    if (velocidad > 0.002) {
      requestAnimationFrame(animar);
    } else {
      const grados = anguloInicial * (180 / Math.PI);
      const index = premios.length - Math.floor((grados % 360) / (360 / premios.length)) - 1;
      document.getElementById("resultado").textContent = `¡Ganaste: ${premios[index < 0 ? premios.length - 1 : index]}!`;
      girando = false;
    }
  };

  animar();
}

document.getElementById("spin").addEventListener("click", girarRuleta);
dibujarRuleta();