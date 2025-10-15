const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const size = canvas.width;
const radius = size / 2;
let anguloInicial = 0;
let girando = false;
let premios = [];
let colors = [];

// Audio de la ruleta
const sonidoRuleta = document.getElementById("sonido-ruleta");
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

    // Borde entre segmentos
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dibujar texto
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle + arco / 2);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Ajustar tamaño de fuente según longitud del texto
    const texto = premios[i];
    let fontSize = 14;

    if (texto.length > 20) {
      fontSize = 10;
    } else if (texto.length > 15) {
      fontSize = 11;
    } else if (texto.length > 10) {
      fontSize = 12;
    }

    ctx.font = `bold ${fontSize}px Arial`;

    // Dividir texto si es muy largo
    const maxChars = 18;
    if (texto.length > maxChars) {
      const palabras = texto.split(' ');
      let linea1 = '';
      let linea2 = '';
      let lineaActual = linea1;

      palabras.forEach(palabra => {
        if ((lineaActual + palabra).length <= maxChars) {
          lineaActual += (lineaActual ? ' ' : '') + palabra;
        } else {
          if (lineaActual === linea1) {
            linea1 = lineaActual;
            lineaActual = linea2 = palabra;
          } else {
            linea2 += (linea2 ? ' ' : '') + palabra;
          }
        }
      });

      if (lineaActual === linea1 || !linea2) {
        linea1 = lineaActual;
      }

      // Dibujar dos líneas
      if (linea2) {
        ctx.fillText(linea1, radius - 20, 0);
        ctx.fillText(linea2, radius - 20, fontSize + 4);
      } else {
        ctx.fillText(linea1, radius - 20, fontSize / 2);
      }
    } else {
      // Texto en una sola línea
      ctx.fillText(texto, radius - 20, fontSize / 2);
    }

    ctx.restore();
  }
}

function generarCodigo() {
  return 'C' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function mostrarAnuncio(premio, codigo) {
  const popup = document.getElementById("popup-premio");
  const mensaje = document.getElementById("mensaje-premio");
  const resultado = document.getElementById("resultado");

  mensaje.innerHTML = `🎁 <strong>${premio}</strong><br>Código: <strong>${codigo}</strong>`;

  // Ocultar el mensaje de resultado cuando se muestra el popup
  resultado.style.display = 'none';

  // Mostrar loader, ocultar QR
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
  if (girando) return;

  girando = true;
  boton.classList.add('girando');

  // Reproducir sonido - intento mejorado
  if (sonidoRuleta) {
    sonidoRuleta.volume = 0.6;
    const playPromise = sonidoRuleta.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log("✅ Sonido reproduciendo");
      }).catch(error => {
        console.log("❌ Error reproduciendo sonido:", error);
      });
    }
  } else {
    console.log("❌ Elemento de audio no encontrado");
  }

  let giro = 0;
  let velocidad = Math.random() * 0.3 + 0.25;
  const desaceleracion = 0.995;
  const vueltasMinimas = 5; // Mínimo 5 vueltas completas

  const animar = () => {
    giro += velocidad;
    velocidad *= desaceleracion;
    anguloInicial += velocidad;
    anguloInicial %= 2 * Math.PI;
    ctx.clearRect(0, 0, size, size);
    dibujarRuleta();

    if (velocidad > 0.002 || giro < vueltasMinimas * 2 * Math.PI) {
      requestAnimationFrame(animar);
    } else {
      // Detener sonido al finalizar
      if (sonidoRuleta) {
        sonidoRuleta.pause();
        sonidoRuleta.currentTime = 0;
      }

      boton.classList.remove('girando');

      const numPremios = premios.length;
      const anguloPorPremio = 2 * Math.PI / numPremios;
      const anguloFinal = (anguloInicial + Math.PI / 2) % (2 * Math.PI);
      const index = Math.floor(numPremios - (anguloFinal / anguloPorPremio)) % numPremios;
      const premioGanado = premios[index];

      const codigo = generarCodigo();

      document.getElementById("resultado").textContent = `¡Ganaste: ${premioGanado}! Código: ${codigo}`;

      // Esperar 500ms antes de mostrar el popup para efecto dramático
      setTimeout(() => {
        mostrarAnuncio(premioGanado, codigo);
        guardarGanador(premioGanado, codigo);
        generarPDFPremio(premioGanado, codigo);
      }, 500);

      girando = false;
    }
  };

  animar();
}

function continuar() {
  const popup = document.getElementById("popup-premio");
  const resultado = document.getElementById("resultado");

  popup.classList.add("hidden");
  resultado.style.display = 'none'; // Ocultar también al continuar
  window.location.href = "formulario.html";
}

function cambiarUsuario() {
  const popup = document.getElementById("popup-premio");
  const resultado = document.getElementById("resultado");

  popup.classList.add("hidden");
  resultado.style.display = 'none'; // Ocultar también al cambiar usuario
  window.location.href = "index.html";
}

// ======= INICIALIZACIÓN =======
document.getElementById("boton-central").addEventListener("click", girarRuleta);

// Habilitar audio con primera interacción
document.body.addEventListener('click', function habilitarAudio() {
  if (sonidoRuleta) {
    sonidoRuleta.load();
    console.log("🔊 Audio habilitado");
  }
  document.body.removeEventListener('click', habilitarAudio);
}, { once: true });

// Verificar que el audio esté cargado
window.addEventListener('load', () => {
  if (sonidoRuleta) {
    console.log("✅ Elemento de audio encontrado");
    sonidoRuleta.addEventListener('loadeddata', () => {
      console.log("✅ Audio cargado correctamente");
    });
    sonidoRuleta.addEventListener('error', (e) => {
      console.error("❌ Error cargando audio:", e);
    });
  } else {
    console.error("❌ Elemento de audio NO encontrado");
  }
});

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
    const qrDataURL = qrCanvas.querySelector("img")?.src || qrCanvas.toDataURL("image/png");

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

      // Ocultar loader y mostrar QR
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

// Función para mostrar error si falla
function mostrarError() {
  document.getElementById("loader-pdf").classList.add("hidden");
  document.getElementById("premio-generado").innerHTML = `
    <p style="color: red;">⚠️ Error al generar el PDF. Intenta de nuevo.</p>
  `;
  document.getElementById("premio-generado").classList.remove("hidden");
}