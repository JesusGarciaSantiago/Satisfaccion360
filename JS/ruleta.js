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
    audio.play().catch(e => console.error("No se pudo reproducir el audio", e));
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

      // === Generar PDF con QR del premio ===
      generarPDFPremio(premioGanado);

      girando = false;
    }
  };

  animar();
}

function continuar() {
  document.getElementById("popup-premio").classList.add("hidden");
  window.location.href = "formulario.html";
}

function cambiarUsuario() {
  window.location.href = "index.html";
}

// ======= INICIALIZACIÓN =======
document.getElementById("boton-central").addEventListener("click", girarRuleta);

function inicializar() {
  const premiosGuardados = localStorage.getItem("premios");
  if (premiosGuardados) {
    premios = JSON.parse(premiosGuardados);
    colors = premios.map((_, i) => ["#8ca37c", "#e8e9e5", "#5a514a", "#bac1af", "#757a70", "#c9d4bc", "#7c8c6c", "#acb79b", "#bac1af", "#8ca37c"][i % 10]);
    dibujarRuleta();
    console.log("✅ Premios cargados desde localStorage:", premios);
  } else {
    console.error("❌ No hay premios en localStorage. Asegúrate de cargar desde formulario.js");
  }
}

inicializar();
/***************************************************************
 * 🎁 GENERAR PDF Y QR CUANDO SE GANA UN PREMIO (en tu popup)
 ***************************************************************/
async function generarPDFPremio(premio) {
  const mesero = sessionStorage.getItem("meseroActual") || "Desconocido";
  const fecha = new Date().toLocaleString();
  const uuid = crypto.randomUUID();

  // 1️⃣ Crear QR interno
  const qrCanvas = document.createElement("canvas");
  await new Promise((resolve) => {
    new QRCode(qrCanvas, {
      text: uuid,
      width: 100,
      height: 100,
      correctLevel: QRCode.CorrectLevel.H,
    });
    setTimeout(resolve, 250);
  });

  const qrDataURL = qrCanvas.querySelector("img")?.src || qrCanvas.toDataURL("image/png");

  // 2️⃣ Crear PDF con jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("🎉 ¡Felicidades!", 20, 30);
  doc.setFontSize(15);
  doc.text(`Has ganado: ${premio}`, 20, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Mesero: ${mesero}`, 20, 70);
  doc.text(`Fecha: ${fecha}`, 20, 80);
  doc.text("Código de validación:", 20, 100);
  doc.text(uuid, 20, 108);

  if (qrDataURL) doc.addImage(qrDataURL, "PNG", 150, 85, 40, 40);

  // 3️⃣ Crear el blob y el link local
  const pdfBlob = doc.output("blob");
  const pdfURL = (window.URL || window.webkitURL).createObjectURL(pdfBlob);

  // 4️⃣ Insertar el QR y el link dentro del popup
  const qrContainer = document.getElementById("qr-popup");
  const qrDiv = document.getElementById("qr-popup-code");
  const link = document.getElementById("btn-descargar-pdf");

  // Limpiar QR anterior
  qrDiv.innerHTML = "";

  // Generar QR para descargar el PDF (solo en el mismo dispositivo)
  new QRCode(qrDiv, {
    text: pdfURL,
    width: 140,
    height: 140,
    correctLevel: QRCode.CorrectLevel.H,
  });

  // Actualizar link de descarga
  link.href = pdfURL;
  link.download = `Premio-${mesero}.pdf`;
}
