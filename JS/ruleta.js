const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const size = canvas.width;
const radius = size / 2;
let anguloInicial = 0;
let girando = false;
let premios = [];
let colors = [];

const sonidoRuleta = document.getElementById("/sounds/ruleta.mp3");
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
  
  // 🔥 MOSTRAR LOADER, OCULTAR QR
  document.getElementById("loader-pdf").classList.remove("hidden");
  document.getElementById("premio-generado").classList.add("hidden");
  
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

  if (sonidoRuleta) {
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
      
      // 🔥 MOSTRAR POPUP CON LOADER INMEDIATAMENTE
      mostrarAnuncio(premioGanado, codigo);
      
      // 🔥 GUARDAR Y GENERAR PDF EN PARALELO (async)
      guardarGanador(premioGanado, codigo);
      generarPDFPremio(premioGanado, codigo);

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
 * 🎁 Generar PDF y subirlo a Google Drive con código existente
 ***************************************************************/
async function generarPDFPremio(premio, codigoValidacion) {
  const mesero = sessionStorage.getItem("meseroActual") || "Desconocido";
  const fecha = new Date().toLocaleString();
  const codigo = codigoValidacion;

  try {
    // Crear QR interno con el código de validación
    const qrCanvas = document.createElement("canvas");
    await new Promise((resolve) => {
      new QRCode(qrCanvas, { 
        text: codigo, 
        width: 100, 
        height: 100 
      });
      setTimeout(resolve, 250);
    });
    const qrDataURL = qrCanvas.querySelector("img")?.src || qrCanvas.toDataURL("/images/");

    // Crear PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("🎉 ¡Felicidades!", 20, 30);
    doc.setFontSize(16);
    doc.text(`Has ganado: ${premio}`, 20, 50);
    doc.setFontSize(12);
    doc.text(`Mesero: ${mesero}`, 20, 70);
    doc.text(`Fecha: ${fecha}`, 20, 80);
    doc.text(`Código de validación:`, 20, 100);
    doc.text(codigo, 20, 108);
    if (qrDataURL) doc.addImage(qrDataURL, "PNG", 150, 85, 40, 40);

    // Convertir PDF a Base64
    const pdfBase64 = btoa(
      new Uint8Array(doc.output("arraybuffer")).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const fileName = `Premio-${mesero}-${codigo}.pdf`;
    const scriptURL = "https://script.google.com/macros/s/AKfycbw3KS3KgXvgQc3VTkBf1z3_lQqJLIANZbGhSEKVxUZpo95gs8TECwjE3XrupuV_5VVnqQ/exec";

    // Subir a Google Drive
    const form = new FormData();
    form.append('fileName', fileName);
    form.append('pdfBase64', pdfBase64);

    const response = await fetch(scriptURL, {
      method: "POST",
      body: form,
    });

    const result = await response.json();

    if (result.success) {
      const pdfPublicURL = result.url;

      // 🔥 OCULTAR LOADER Y MOSTRAR QR
      document.getElementById("loader-pdf").classList.add("hidden");
      document.getElementById("premio-generado").classList.remove("hidden");

      // Mostrar QR descargable
      const qrDiv = document.getElementById("qr-popup-code");
      qrDiv.innerHTML = "";
      new QRCode(qrDiv, { 
        text: pdfPublicURL, 
        width: 140, 
        height: 140 
      });

      const link = document.getElementById("btn-descargar-pdf");
      link.href = pdfPublicURL;
      link.download = fileName;
      link.textContent = "⬇️ Descargar PDF";

      console.log("✅ PDF subido con código:", codigo);
      console.log("📄 URL del PDF:", pdfPublicURL);
    } else {
      console.error("❌ Error desde el servidor:", result.error);
      mostrarError();
    }
  } catch (err) {
    console.error("❌ Error al subir el PDF:", err);
    mostrarError();
  }
}

// 🔥 Función para mostrar error si falla
function mostrarError() {
  document.getElementById("loader-pdf").classList.add("hidden");
  document.getElementById("premio-generado").innerHTML = `
    <p style="color: red;">⚠️ Error al generar el PDF. Intenta de nuevo.</p>
  `;
  document.getElementById("premio-generado").classList.remove("hidden");
}