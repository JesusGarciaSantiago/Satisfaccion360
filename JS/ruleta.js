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

// ✅ URL ÚNICA Y CONSISTENTE
const URL_GANADORES = 'https://script.google.com/macros/s/AKfycbw4zOPj8QjC3cpBpWHZFnto7r9xN0Xkx7lWluKkajkYzJREcF3ARNVx8_CfNVGWCkfn/exec';
const URL_PDF = "https://script.google.com/macros/s/AKfycbw3KS3KgXvgQc3VTkBf1z3_lQqJLIANZbGhSEKVxUZpo95gs8TECwjE3XrupuV_5VVnqQ/exec";

// ======= FUNCIONES DE DIBUJO =======

function dibujarRuleta() {
  const num = premios.length;
  if (num === 0) return;

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

// ======= FUNCIONES DE LÓGICA =======

function generarCodigo() {
  return 'C' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function mostrarAnuncio(premio, codigo) {
  const popup = document.getElementById("popup-premio");
  const mensaje = document.getElementById("mensaje-premio");
  const resultado = document.getElementById("resultado");

  if (!popup || !mensaje || !resultado) {
    console.error("❌ Elementos del popup no encontrados");
    return;
  }

  mensaje.innerHTML = `🎁 <strong>${premio}</strong><br>Código: <strong>${codigo}</strong>`;

  // Ocultar el mensaje de resultado cuando se muestra el popup
  resultado.style.display = 'none';

  // Mostrar loader, ocultar QR
  const loader = document.getElementById("loader-pdf");
  const premioGenerado = document.getElementById("premio-generado");

  if (loader) loader.classList.remove("hidden");
  if (premioGenerado) premioGenerado.classList.add("hidden");

  popup.classList.remove("hidden");
}

async function guardarGanador(premio, codigo) {
  try {
    await fetch(`${URL_GANADORES}?action=save&premio=${encodeURIComponent(premio)}&codigo=${encodeURIComponent(codigo)}`, {
      method: 'GET'
    });
    console.log("✅ Ganador guardado:", codigo);
  } catch (error) {
    console.error("❌ Error al guardar ganador:", error);
  }
}

function girarRuleta() {
  if (girando) return;

  if (premios.length === 0) {
    alert("No hay premios disponibles. Recarga la página.");
    return;
  }

  girando = true;
  boton.classList.add('girando');

  // Reproducir sonido
  if (sonidoRuleta) {
    sonidoRuleta.volume = 0.6;
    const playPromise = sonidoRuleta.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log("✅ Sonido reproduciendo");
      }).catch(error => {
        console.log("⚠️ No se pudo reproducir el sonido:", error);
      });
    }
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

      const resultado = document.getElementById("resultado");
      if (resultado) {
        resultado.textContent = `¡Ganaste: ${premioGanado}! Código: ${codigo}`;
      }

      // Esperar 500ms antes de mostrar el popup
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

  if (popup) popup.classList.add("hidden");
  if (resultado) resultado.style.display = 'none';

  window.location.href = "formulario.html";
}

function cambiarUsuario() {
  const popup = document.getElementById("popup-premio");
  const resultado = document.getElementById("resultado");

  if (popup) popup.classList.add("hidden");
  if (resultado) resultado.style.display = 'none';

  window.location.href = "menu.html";
}

// ======= GENERACIÓN DE PDF CON LOGO GRANDE =======

async function generarPDFPremio(premio, codigoValidacion) {
  const mesero = sessionStorage.getItem("meseroActual") || "Desconocido";
  const fecha = new Date().toLocaleString('es-MX');
  const codigo = codigoValidacion;

  try {
    // Crear QR interno con el código de validación
    const qrCanvas = document.createElement("canvas");
    const qr = new QRCode(qrCanvas, {
      text: codigo,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    // Esperar a que el QR se genere
    await new Promise(resolve => setTimeout(resolve, 500));

    const qrCanvasElement = qrCanvas.querySelector("canvas");
    const qrDataURL = qrCanvasElement ? qrCanvasElement.toDataURL("image/png") : null;

    // Crear PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const colorPrimario = [123, 140, 110];
    const colorClaro = [186, 193, 175];

    // === MARCO DECORATIVO ===
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setDrawColor(...colorClaro);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // === HEADER CON FONDO ===
    doc.setFillColor(...colorPrimario);
    doc.rect(15, 15, pageWidth - 30, 50, 'F'); // ✅ Header más alto para logo grande

    // ✅ LOGO GRANDE Y CENTRADO
    try {
      const logoImg = await cargarImagen('/images/logo C50_Inverted.png');
      // Logo más grande: 60mm de ancho (antes era 25mm)
      const logoWidth = 80;
      const logoHeight = 60;
      const logoX = (pageWidth - logoWidth) / 2; // Centrado
      const logoY = 20; // Más abajo en el header

      doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      console.log("✅ Logo agregado al PDF");
    } catch (error) {
      console.log("⚠️ No se pudo cargar el logo:", error);
      // Si falla el logo, al menos mostrar el nombre
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("CARRANZA 50", pageWidth / 2, 35, { align: 'center' });
    }

    // === TÍTULO (Más abajo para dar espacio al logo) ===
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("¡FELICIDADES!", pageWidth / 2, 58, { align: 'center' });

    // === CONTENIDO ===
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Has ganado:", pageWidth / 2, 75, { align: 'center' });

    // Caja del premio
    doc.setFillColor(...colorClaro);
    doc.roundedRect(25, 80, pageWidth - 50, 25, 3, 3, 'F');

    doc.setFontSize(16);
    doc.setTextColor(...colorPrimario);
    const premioLines = doc.splitTextToSize(premio, pageWidth - 60);

    // Centrar verticalmente el texto del premio
    const textHeight = premioLines.length * 6;
    const textY = 92.5 - (textHeight / 2);
    doc.text(premioLines, pageWidth / 2, textY + 6, { align: 'center' });

    // Información del mesero y fecha
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Mesero: ${mesero}`, 30, 118);
    doc.text(`Fecha: ${fecha}`, 30, 125);

    // === CÓDIGO DE VALIDACIÓN ===
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorPrimario);
    doc.text("CÓDIGO DE VALIDACIÓN:", pageWidth / 2, 140, { align: 'center' });

    doc.setFillColor(240, 240, 240);
    doc.roundedRect(40, 145, pageWidth - 80, 14, 2, 2, 'F');

    doc.setFontSize(16);
    doc.setFont("courier", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(codigo, pageWidth / 2, 155, { align: 'center' });

    // === QR CODE ===
    if (qrDataURL) {
      doc.setDrawColor(...colorPrimario);
      doc.setLineWidth(1);
      const qrSize = 55;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 170;

      // Marco decorativo para el QR
      doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 2, 2);
      doc.addImage(qrDataURL, "PNG", qrX, qrY, qrSize, qrSize);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Escanea este código para validar tu premio", pageWidth / 2, qrY + qrSize + 8, { align: 'center' });
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

    // Subir a Google Drive
    const form = new FormData();
    form.append('fileName', fileName);
    form.append('pdfBase64', pdfBase64);

    const response = await fetch(URL_PDF, {
      method: "POST",
      body: form,
    });

    const result = await response.json();

    if (result.success) {
      const pdfPublicURL = result.url;
      const fileId = result.fileId; // ✅ Guardar el ID del archivo

      // ✅ GUARDAR FILE ID EN SESSIONSTORAGE PARA ELIMINAR DESPUÉS
      sessionStorage.setItem(`pdf_${codigo}`, fileId);
      console.log("📄 PDF ID guardado:", fileId);

      // Ocultar loader y mostrar QR
      const loader = document.getElementById("loader-pdf");
      const premioGenerado = document.getElementById("premio-generado");

      if (loader) loader.classList.add("hidden");
      if (premioGenerado) premioGenerado.classList.remove("hidden");

      // Mostrar QR descargable
      const qrDiv = document.getElementById("qr-popup-code");
      if (qrDiv) {
        qrDiv.innerHTML = "";
        new QRCode(qrDiv, {
          text: pdfPublicURL,
          width: 140,
          height: 140
        });
      }

      const link = document.getElementById("btn-descargar-pdf");
      if (link) {
        link.href = pdfPublicURL;
        link.download = fileName;
        link.textContent = "⬇️ Descargar PDF";
      }

      console.log("✅ PDF generado con código:", codigo);
    } else {
      console.error("❌ Error del servidor:", result.error);
      mostrarErrorPDF();
    }
  } catch (err) {
    console.error("❌ Error al generar PDF:", err);
    mostrarErrorPDF();
  }
}

function mostrarErrorPDF() {
  const loader = document.getElementById("loader-pdf");
  const premioGenerado = document.getElementById("premio-generado");

  if (loader) {
    loader.innerHTML = `
      <div style="text-align: center;">
        <p style="color: #d32f2f;">❌ Error al generar PDF</p>
        <p style="font-size: 0.9rem; color: #666;">Por favor toma captura de tu código</p>
      </div>
    `;
  }

  if (premioGenerado) premioGenerado.classList.add("hidden");
}

function cargarImagen(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ======= INICIALIZACIÓN =======

function inicializar() {
  const premiosGuardados = localStorage.getItem("premios");

  if (premiosGuardados) {
    try {
      premios = JSON.parse(premiosGuardados);
      colors = premios.map((_, i) => [
        "#8ca37c", "#e8e9e5", "#5a514a", "#bac1af",
        "#757a70", "#c9d4bc", "#7c8c6c", "#acb79b",
        "#bac1af", "#8ca37c"
      ][i % 10]);
      dibujarRuleta();
      console.log("✅ Premios cargados:", premios);
    } catch (error) {
      console.error("❌ Error al parsear premios:", error);
      premios = [];
    }
  } else {
    console.error("❌ No hay premios disponibles");
    premios = [];
  }
}

// Event listeners
if (boton) {
  boton.addEventListener("click", girarRuleta);
}

// Habilitar audio con primera interacción
document.body.addEventListener('click', function habilitarAudio() {
  if (sonidoRuleta) {
    sonidoRuleta.load();
    console.log("🔊 Audio habilitado");
  }
  document.body.removeEventListener('click', habilitarAudio);
}, { once: true });

// Inicializar al cargar
window.addEventListener('load', () => {
  inicializar();

  if (sonidoRuleta) {
    sonidoRuleta.addEventListener('loadeddata', () => {
      console.log("✅ Audio listo");
    });
    sonidoRuleta.addEventListener('error', (e) => {
      console.warn("⚠️ Error al cargar audio:", e);
    });
  }
});