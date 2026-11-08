const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const size = canvas.width;
const radius = size / 2;
let anguloInicial = 0;
let girando = false;
let premios = [];
let colors = [];
let yaGiro = sessionStorage.getItem('yaGiroRuleta') === 'true';

// Audio de la ruleta
const sonidoRuleta = document.getElementById("sonido-ruleta");
const boton = document.getElementById("boton-central");

// ✅ URL ÚNICA Y CONSISTENTE
//url ganadores, lista de meseros etc
const URL_GANADORES = 'https://script.google.com/macros/s/AKfycbxkKZtbrslQZW1srwV6Ei8AWJTtQ0pWxgM4j3ihhQ0XNs-FwcVccXTzqYID7zXGXGRyzg/exec';
const URL_PDF = "https://script.google.com/macros/s/AKfycbxkKZtbrslQZW1srwV6Ei8AWJTtQ0pWxgM4j3ihhQ0XNs-FwcVccXTzqYID7zXGXGRyzg/exec";

// ⏰ CONFIGURACIÓN DE AUTO-ELIMINACIÓN DE PDFs (en días)
const DIAS_ANTES_ELIMINAR = 3;

// 📋 TÉRMINOS Y CONDICIONES
const TERMINOS_CONDICIONES = {
  normasGenerales: [
    "Válido solo en la próxima visita dentro de los 30 días posteriores a ganar.",
    "No canjeable el mismo día de la encuesta.",
    "No combinable con otras promociones, descuentos o membresías.",
    "Para canjear, presentar el comprobante digital o código de la ruleta.",
    "Se canjeará un solo premio por mesa por visita.",
    "Es necesario reservar al 442 212 3031 (sujeto a disponibilidad).",
    "Todas las promociones aplican de lunes a sábado desde las 14:00 hrs hasta las 22:00 hrs.",
    "Requiere un consumo mínimo total de $1,000 MXN por mesa."
  ],
  terminosEspecificos: {
    "10% de descuento": "Se aplica un 10% de descuento al total de la cuenta.",
    "15% de descuento": "Se aplica un 15% de descuento al total de la cuenta.",
    "$200 MXN de descuento": "Se aplica un descuento de $200 pesos al total de la cuenta.",
    "Mezcalita de la casa": "Se entrega una mezcalita por cada comensal adulto en la mesa.",
    "Botella de vino de la casa": "Se entrega una botella de vino de la casa (Puerto Nuevo) para que disfrute toda la mesa, independientemente del número de personas.",
    "Mezcal de cortesía": "Se entrega una copa de mezcal por cada comensal adulto en la mesa.",
    "Postre para cada uno": "Se entrega un postre para que disfrute toda la mesa.",
    "Entrada para compartir": "Se entrega una orden de la entrada o botana seleccionada para que disfrute toda la mesa."
  }
};

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

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle + arco / 2);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const texto = premios[i];

    // 🎯 MEJORADO: Ajuste dinámico del tamaño de fuente
    let fontSize = 16;
    if (texto.length > 25) fontSize = 9;
    else if (texto.length > 20) fontSize = 10;
    else if (texto.length > 15) fontSize = 12;
    else if (texto.length > 10) fontSize = 13;

    ctx.font = `bold ${fontSize}px Arial`;

    // 🎯 MEJORADO: División inteligente de texto en líneas
    const maxWidth = radius - 35; // Espacio máximo para el texto
    const palabras = texto.split(' ');
    let lineas = [];
    let lineaActual = '';

    palabras.forEach(palabra => {
      const testLine = lineaActual ? `${lineaActual} ${palabra}` : palabra;
      const medida = ctx.measureText(testLine);

      if (medida.width > maxWidth && lineaActual) {
        lineas.push(lineaActual);
        lineaActual = palabra;
      } else {
        lineaActual = testLine;
      }
    });

    if (lineaActual) {
      lineas.push(lineaActual);
    }

    // Limitar a máximo 3 líneas
    if (lineas.length > 3) {
      lineas = lineas.slice(0, 3);
      lineas[2] = lineas[2].substring(0, 12) + '...';
    }

    // 🎯 MEJORADO: Dibujar texto centrado verticalmente
    const lineHeight = fontSize + 3;
    const totalHeight = lineas.length * lineHeight;
    const startY = -(totalHeight / 2) + (lineHeight / 2);

    lineas.forEach((linea, index) => {
      const y = startY + (index * lineHeight);
      ctx.fillText(linea, radius - 25, y);
    });

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
  resultado.style.display = 'none';

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
  if (yaGiro) {
    alert("Ya has girado la ruleta. Por favor continúa al formulario.");
    return;
  }

  if (girando) return;

  if (premios.length === 0) {
    alert("No hay premios disponibles. Recarga la página.");
    return;
  }

  girando = true;
  boton.classList.add('girando');

  sessionStorage.setItem('yaGiroRuleta', 'true');
  yaGiro = true;

  deshabilitarBotonHome(true);

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

  // 🎲 MEJORADA: Mayor variabilidad en la velocidad y vueltas
  let giro = 0;
  // Rango de velocidad más amplio: 0.2 a 0.6 (antes era 0.25 a 0.55)
  let velocidad = Math.random() * 0.4 + 0.2;
  // Desaceleración variable entre 0.992 y 0.997 (más natural)
  const desaceleracion = 0.992 + Math.random() * 0.005;
  // Vueltas mínimas variables entre 5 y 8 (antes era fijo en 5)
  const vueltasMinimas = 5 + Math.floor(Math.random() * 4);

  console.log(`🎲 Giro: velocidad=${velocidad.toFixed(3)}, desaceleración=${desaceleracion.toFixed(4)}, vueltas=${vueltasMinimas}`);

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

  deshabilitarBotonHome(false);
  sessionStorage.removeItem('yaGiroRuleta');

  window.location.href = "formulario.html";
}

function deshabilitarBotonHome(deshabilitar) {
  const btnHome = document.getElementById("btn-home");
  if (btnHome) {
    if (deshabilitar) {
      btnHome.style.opacity = "0.3";
      btnHome.style.pointerEvents = "none";
      btnHome.style.cursor = "not-allowed";
    } else {
      btnHome.style.opacity = "1";
      btnHome.style.pointerEvents = "auto";
      btnHome.style.cursor = "pointer";
    }
  }
}

// ======= GENERACIÓN DE PDF CON TÉRMINOS Y CONDICIONES =======

async function generarPDFPremio(premio, codigoValidacion) {
  const mesero = sessionStorage.getItem("meseroActual") || "Desconocido";
  const fecha = new Date().toLocaleString('es-MX');
  const codigo = codigoValidacion;

  try {
    const qrCanvas = document.createElement("canvas");
    const qr = new QRCode(qrCanvas, {
      text: codigo,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const qrCanvasElement = qrCanvas.querySelector("canvas");
    const qrDataURL = qrCanvasElement ? qrCanvasElement.toDataURL("image/png") : null;

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

    // ========== PÁGINA 1: PREMIO ==========
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setDrawColor(...colorClaro);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    doc.setFillColor(...colorPrimario);
    doc.rect(15, 15, pageWidth - 30, 65, 'F');

    try {
      const logoImg = await cargarImagen('/images/logo C50_Inverted.png');
      const logoWidth = 90;
      const logoHeight = 45;
      const logoX = (pageWidth - logoWidth) / 2;
      const logoY = 22;
      doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      console.log("✅ Logo agregado al PDF");
    } catch (error) {
      console.log("⚠️ No se pudo cargar el logo:", error);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("CARRANZA 50", pageWidth / 2, 50, { align: 'center' });
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("¡FELICIDADES!", pageWidth / 2, 73, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Has ganado:", pageWidth / 2, 85, { align: 'center' });

    doc.setFillColor(...colorClaro);
    doc.roundedRect(25, 90, pageWidth - 50, 25, 3, 3, 'F');

    doc.setFontSize(16);
    doc.setTextColor(...colorPrimario);
    const premioLines = doc.splitTextToSize(premio, pageWidth - 60);
    const textHeight = premioLines.length * 6;
    const textY = 102.5 - (textHeight / 2);
    doc.text(premioLines, pageWidth / 2, textY + 6, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Mesero: ${mesero}`, 30, 128);
    doc.text(`Fecha: ${fecha}`, 30, 135);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorPrimario);
    doc.text("CÓDIGO DE VALIDACIÓN:", pageWidth / 2, 150, { align: 'center' });

    doc.setFillColor(240, 240, 240);
    doc.roundedRect(40, 155, pageWidth - 80, 14, 2, 2, 'F');

    doc.setFontSize(16);
    doc.setFont("courier", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(codigo, pageWidth / 2, 165, { align: 'center' });

    if (qrDataURL) {
      doc.setDrawColor(...colorPrimario);
      doc.setLineWidth(1);
      const qrSize = 55;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 180;
      doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 2, 2);
      doc.addImage(qrDataURL, "PNG", qrX, qrY, qrSize, qrSize);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Escanea este código para validar tu premio", pageWidth / 2, qrY + qrSize + 8, { align: 'center' });
    }

    doc.setDrawColor(...colorClaro);
    doc.setLineWidth(0.5);
    doc.line(30, pageHeight - 25, pageWidth - 30, pageHeight - 25);

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.text("Presenta este documento para reclamar tu premio", pageWidth / 2, pageHeight - 18, { align: 'center' });
    doc.text("Ver términos y condiciones en la siguiente página", pageWidth / 2, pageHeight - 13, { align: 'center' });

    // ========== PÁGINA 2: TÉRMINOS Y CONDICIONES ==========
    doc.addPage();

    // Encabezado de la página
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setFillColor(...colorPrimario);
    doc.rect(15, 15, pageWidth - 30, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TÉRMINOS Y CONDICIONES", pageWidth / 2, 30, { align: 'center' });

    let yPos = 50;

    // Normas Generales
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Normas Generales:", 20, yPos);
    yPos += 8;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    TERMINOS_CONDICIONES.normasGenerales.forEach((norma, index) => {
      const lines = doc.splitTextToSize(`• ${norma}`, pageWidth - 50);
      lines.forEach(line => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 25, yPos);
        yPos += 5;
      });
      yPos += 1;
    });

    yPos += 5;

    // Términos Específicos del Premio
    if (TERMINOS_CONDICIONES.terminosEspecificos[premio]) {
      doc.setTextColor(...colorPrimario);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");

      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.text("Términos Específicos de tu Premio:", 20, yPos);
      yPos += 8;

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const terminoEspecifico = doc.splitTextToSize(
        `• ${premio}: ${TERMINOS_CONDICIONES.terminosEspecificos[premio]}`,
        pageWidth - 50
      );

      terminoEspecifico.forEach(line => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 25, yPos);
        yPos += 6;
      });
    }

    // Información de contacto al final
    yPos = pageHeight - 20;
    doc.setDrawColor(...colorClaro);
    doc.setLineWidth(0.5);
    doc.line(30, yPos - 5, pageWidth - 30, yPos - 5);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Para reservaciones: 442 212 3031", pageWidth / 2, yPos, { align: 'center' });
    doc.text("¡Gracias por tu preferencia!", pageWidth / 2, yPos + 5, { align: 'center' });

    // Convertir a Base64 y subir
    const pdfBase64 = btoa(
      new Uint8Array(doc.output("arraybuffer")).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const fileName = `Premio-${mesero}-${codigo}.pdf`;

    const form = new FormData();
    form.append('fileName', fileName);
    form.append('pdfBase64', pdfBase64);
    form.append('diasExpiracion', DIAS_ANTES_ELIMINAR);

    const response = await fetch(URL_PDF, {
      method: "POST",
      body: form,
    });

    const result = await response.json();

    if (result.success) {
      const pdfPublicURL = result.url;

      const loader = document.getElementById("loader-pdf");
      const premioGenerado = document.getElementById("premio-generado");

      if (loader) loader.classList.add("hidden");
      if (premioGenerado) premioGenerado.classList.remove("hidden");

      const qrDiv = document.getElementById("qr-popup-code");
      if (qrDiv) {
        qrDiv.innerHTML = "";
        new QRCode(qrDiv, {
          text: pdfPublicURL,
          width: 140,
          height: 140
        });
      }

      deshabilitarBotonHome(false);
      console.log(`✅ PDF generado con código: ${codigo} (expira en ${DIAS_ANTES_ELIMINAR} días)`);
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
  deshabilitarBotonHome(false);
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

  if (yaGiro && boton) {
    boton.style.opacity = "0.5";
    boton.style.cursor = "not-allowed";
    boton.style.pointerEvents = "none";
    const textoGirar = boton.querySelector('.girar-text');
    if (textoGirar) textoGirar.textContent = "YA GIRASTE";
  }
}

if (boton) {
  boton.addEventListener("click", girarRuleta);
}

document.body.addEventListener('click', function habilitarAudio() {
  if (sonidoRuleta) {
    sonidoRuleta.load();
    console.log("🔊 Audio habilitado");
  }
  document.body.removeEventListener('click', habilitarAudio);
}, { once: true });

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

// Navegación controlada - sin bloqueo forzado
console.log("✅ Script de ruleta cargado");