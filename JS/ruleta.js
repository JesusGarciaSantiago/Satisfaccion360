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

const URL = 'https://script.google.com/macros/s/AKfycbw4zOPj8QjC3cpBpWHZFnto7r9xN0Xkx7lWluKkajkYzJREcF3ARNVx8_CfNVGWCkfn/exec';

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
// 🔒 FUNCIÓN PARA BLOQUEAR/DESBLOQUEAR BOTÓN HOME
function bloquearBotonHome(bloquear) {
  const btnHome = document.getElementById("btn-home");
  if (btnHome) {
    if (bloquear) {
      btnHome.style.opacity = "0.5";
      btnHome.style.pointerEvents = "none";
      btnHome.style.cursor = "not-allowed";
    } else {
      btnHome.style.opacity = "1";
      btnHome.style.pointerEvents = "auto";
      btnHome.style.cursor = "pointer";
    }
  }
}

// 🔒 FUNCIÓN PARA BLOQUEAR/DESBLOQUEAR BOTONES DEL POPUP
function bloquearBotonesPopup(bloquear) {
  const popupButtons = document.querySelector('.popup-buttons');
  if (popupButtons) {
    const buttons = popupButtons.querySelectorAll('button');
    buttons.forEach(btn => {
      if (bloquear) {
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
        btn.style.cursor = "not-allowed";
      } else {
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        btn.style.cursor = "pointer";
      }
    });
  }
}

function girarRuleta() {
  if (girando) return;

  girando = true;
  boton.classList.add('girando');

  // 🔒 BLOQUEAR BOTÓN HOME AL EMPEZAR A GIRAR
  bloquearBotonHome(true);

  // Reproducir sonido
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
  const vueltasMinimas = 5;

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

      setTimeout(() => {
        mostrarAnuncio(premioGanado, codigo);
        guardarGanador(premioGanado, codigo);

        // 🔒 BLOQUEAR BOTONES DEL POPUP DURANTE GENERACIÓN DE PDF
        bloquearBotonesPopup(true);

        // NOTA: El botón HOME permanece bloqueado hasta que el QR se genere
        generarPDFPremio(premioGanado, codigo);
      }, 500);

      girando = false;
    }
  };

  animar();
}

// FUNCIÓN PARA BLOQUEAR/DESBLOQUEAR BOTONES DEL POPUP
function bloquearBotonesPopup(bloquear) {
  const popupButtons = document.querySelector('.popup-buttons');
  if (popupButtons) {
    const buttons = popupButtons.querySelectorAll('button');
    buttons.forEach(btn => {
      if (bloquear) {
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
        btn.style.cursor = "not-allowed";
      } else {
        btn.style.opacity = "1";
        btn.style.pointerEvents = "auto";
        btn.style.cursor = "pointer";
      }
    });
  }
}

function continuar() {
  const popup = document.getElementById("popup-premio");
  const resultado = document.getElementById("resultado");

  popup.classList.add("hidden");
  resultado.style.display = 'none';

  //  Asegurar que el botón HOME esté desbloqueado
  bloquearBotonHome(false);

  window.location.href = "formulario.html";
}

function cambiarUsuario() {
  const popup = document.getElementById("popup-premio");
  const resultado = document.getElementById("resultado");

  popup.classList.add("hidden");
  resultado.style.display = 'none';
  
  //  Asegurar que el botón HOME esté desbloqueado
  bloquearBotonHome(false);
  
  window.location.href = "menu.html";
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
/*
 * Generar PDF y subirlo a Google Drive con código existente
 */
async function generarPDFPremio(premio, codigoValidacion) {
  const mesero = sessionStorage.getItem("meseroActual") || "Desconocido";
  const fecha = new Date().toLocaleString();
  const codigo = codigoValidacion;

  try {
    // Crear QR interno con el código de validación usando canvas directamente
    const qrCanvas = document.createElement("canvas");
    const qr = new QRCode(qrCanvas, {
      text: codigo,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    // Esperar a que el QR se genere completamente
    await new Promise(resolve => setTimeout(resolve, 500));

    // Obtener el canvas del QR generado
    const qrCanvasElement = qrCanvas.querySelector("canvas");
    const qrDataURL = qrCanvasElement ? qrCanvasElement.toDataURL("image/png") : null;

    // Cargar el logo (ajusta la ruta según tu estructura de carpetas)
    const logoURL = "/images/logo C50_Inverted.png"; // o la ruta donde tengas tu logo

    // Crear PDF con diseño mejorado
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const colorPrimario = [123, 140, 110]; // #7B8C6E en RGB
    const colorClaro = [186, 193, 175]; // Color más claro para detalles

    // === MARCO DECORATIVO ===
    // Marco exterior
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Marco interior decorativo
    doc.setDrawColor(...colorClaro);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // === HEADER CON COLOR ===
    doc.setFillColor(...colorPrimario);
    doc.rect(15, 15, pageWidth - 30, 35, 'F');

    // Intentar cargar y agregar el logo
    try {
      const logoImg = await cargarImagen(logoURL);
      doc.addImage(logoImg, 'PNG', 50, 50, 25, 25);
    } catch (error) {
      console.log("⚠️ No se pudo cargar el logo:", error);
      // Continuar sin logo
    }

    // === TÍTULO ===
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("¡FELICIDADES!", pageWidth / 2, 32, { align: 'center' });

    // === CONTENIDO ===
    doc.setTextColor(0, 0, 0);

    // Premio ganado
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Has ganado:", pageWidth / 2, 65, { align: 'center' });

    doc.setFillColor(...colorClaro);
    doc.roundedRect(25, 70, pageWidth - 50, 20, 3, 3, 'F');

    doc.setFontSize(16);
    doc.setTextColor(...colorPrimario);
    const premioLines = doc.splitTextToSize(premio, pageWidth - 60);
    doc.text(premioLines, pageWidth / 2, 82, { align: 'center' });

    // Información adicional
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Mesero: ${mesero}`, 30, 105);
    doc.text(`Fecha: ${fecha}`, 30, 112);

    // === CÓDIGO DE VALIDACIÓN ===
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorPrimario);
    doc.text("CÓDIGO DE VALIDACIÓN:", pageWidth / 2, 130, { align: 'center' });

    doc.setFillColor(240, 240, 240);
    doc.roundedRect(40, 135, pageWidth - 80, 12, 2, 2, 'F');

    doc.setFontSize(14);
    doc.setFont("courier", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(codigo, pageWidth / 2, 143, { align: 'center' });

    // === QR CODE ===
    if (qrDataURL) {
      doc.setDrawColor(...colorPrimario);
      doc.setLineWidth(1);
      const qrSize = 50;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 155;

      // Marco para el QR
      doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 2, 2);
      doc.addImage(qrDataURL, "PNG", qrX, qrY, qrSize, qrSize);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Escanea para validar", pageWidth / 2, qrY + qrSize + 8, { align: 'center' });
    }

    // === PIE DE PÁGINA ===
    doc.setDrawColor(...colorClaro);
    doc.setLineWidth(0.5);
    doc.line(30, pageHeight - 25, pageWidth - 30, pageHeight - 25);

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.text("Presenta este documento para reclamar tu premio", pageWidth / 2, pageHeight - 18, { align: 'center' });
    doc.text("¡Gracias por tu preferencia!", pageWidth / 2, pageHeight - 13, { align: 'center' });

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

      //  DESBLOQUEAR BOTONES DEL POPUP CUANDO EL PDF ESTÉ LISTO
      bloquearBotonesPopup(false);

      //  DESBLOQUEAR BOTÓN HOME CUANDO TODO ESTÉ LISTO
      bloquearBotonHome(false);

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

      //  DESBLOQUEAR BOTONES EN CASO DE ERROR
      bloquearBotonesPopup(false);
      bloquearBotonHome(false);

      mostrarError();
    }
  } catch (err) {
    console.error("❌ Error al subir el PDF:", err);

    //  DESBLOQUEAR BOTONES EN CASO DE ERROR
    bloquearBotonesPopup(false);
    bloquearBotonHome(false);

    mostrarError();
  }
}

// Función auxiliar para cargar imágenes
function cargarImagen(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}