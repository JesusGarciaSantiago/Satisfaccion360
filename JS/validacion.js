const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startScanBtn = document.getElementById('startScan');
const validarBtn = document.getElementById('validarBtn');
const input = document.getElementById('codigoInput');
const resultado = document.getElementById('resultado');
const cameraStatus = document.getElementById('cameraStatus');
const scanOverlay = document.getElementById('scanOverlay');
const loader = document.getElementById('loader');
const popup = document.getElementById('popup');
const popupIcon = document.getElementById('popupIcon');
const popupTitulo = document.getElementById('popupTitulo');
const popupMensaje = document.getElementById('popupMensaje');
const popupCerrar = document.getElementById('popupCerrar');

// ⚠️ Cambia esta URL por la URL desplegada de tu Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNdss7f9lanIvAEFrlebQb2RLu0R25qDPjellurYFEgRqsJQgQPptfAllrUKX7NioE/exec";

let scanning = false;
let stream = null;
let scanInterval = null;

async function validarCodigo(codigo) {
    if (!codigo) {
        mostrarResultado(false, "Por favor ingresa un código válido");
        return;
    }

    // Mostrar loader
    loader.classList.remove('hidden');
    resultado.style.display = 'none';

    try {
        const url = `${SCRIPT_URL}?action=validar&codigo=${encodeURIComponent(codigo)}`;
        const response = await fetch(url);
        const data = await response.json();

        // Ocultar loader
        loader.classList.add('hidden');

        if (data.success) {
            mostrarResultado(true, `${data.message} (${data.premio || 'Premio no registrado'})`);
        } else {
            mostrarResultado(false, data.message);
        }
    } catch (error) {
        // Ocultar loader
        loader.classList.add('hidden');
        mostrarResultado(false, "Error de conexión. Intenta de nuevo.");
        console.error(error);
    }
}

function mostrarResultado(success, mensaje) {
    // Ocultar resultado anterior
    resultado.style.display = 'none';

    // Mostrar popup
    popup.classList.remove('hidden');

    if (success) {
        popupIcon.textContent = '✅';
        popupTitulo.textContent = '¡Cupón Válido!';
        popupMensaje.textContent = mensaje;
    } else {
        popupIcon.textContent = '❌';
        popupTitulo.textContent = 'Cupón No Válido';
        popupMensaje.textContent = mensaje;
    }
}

// Cerrar popup
popupCerrar.addEventListener('click', () => {
    popup.classList.add('hidden');
});

// Validación manual
validarBtn.addEventListener('click', () => {
    validarCodigo(input.value.trim());
    input.value = "";
});

// Validar con Enter
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        validarCodigo(input.value.trim());
        input.value = "";
    }
});

// Función para detener el escaneo
function detenerEscaneo() {
    scanning = false;
    scanOverlay.classList.remove('active');

    // Detener intervalo de escaneo
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }

    // Detener stream de video
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    video.srcObject = null;

    startScanBtn.innerHTML = '<span class="icon">📸</span><span>Escanear Código QR</span>';
    startScanBtn.className = 'btn btn-primary';
    cameraStatus.textContent = "";
}

// Función para escanear QR del video
function escanearFrame() {
    if (!scanning) return;

    try {
        // Verificar que jsQR esté cargado
        if (typeof jsQR === 'undefined') {
            console.error("jsQR no está cargado todavía");
            return;
        }

        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (canvas.width === 0 || canvas.height === 0) {
            return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            console.log("QR detectado:", code.data);
            validarCodigo(code.data);
            detenerEscaneo();
        }
    } catch (err) {
        console.error("Error al escanear frame:", err);
    }
}

// Iniciar escaneo con cámara - Versión simplificada
startScanBtn.addEventListener('click', async () => {
    if (scanning) {
        detenerEscaneo();
        return;
    }

    // Verificar que jsQR esté cargado antes de comenzar
    if (typeof jsQR === 'undefined') {
        cameraStatus.textContent = "❌ Error: Librería de escaneo no cargada. Recarga la página.";
        return;
    }

    try {
        cameraStatus.textContent = "⏳ Iniciando cámara...";

        // Verificar soporte
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            cameraStatus.textContent = "❌ Tu navegador no soporta acceso a cámara";
            return;
        }

        // Configuración FORZANDO cámara trasera para móviles
        const constraints = {
            video: {
                facingMode: { exact: "environment" } // Fuerza cámara trasera
            },
            audio: false
        };

        // Intentar primero con cámara trasera (environment)
        let camaraUsada = "trasera";
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (firstError) {
            console.log("No se pudo forzar cámara trasera, intentando con 'ideal'...");
            camaraUsada = "trasera (preferida)";
            // Si falla el 'exact', intentar con 'ideal'
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false
                });
            } catch (secondError) {
                console.log("Tampoco con 'ideal', probando configuración básica...");
                camaraUsada = "disponible";
                // Último intento: cualquier cámara
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
            }
        }

        video.srcObject = stream;

        // Esperar a que el video esté listo
        await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
                video.play()
                    .then(() => resolve())
                    .catch((err) => reject(err));
            };

            // Timeout de seguridad
            setTimeout(() => reject(new Error("Timeout al cargar video")), 10000);
        });

        scanning = true;
        scanOverlay.classList.add('active');

        startScanBtn.innerHTML = '<span class="icon">⏹️</span><span>Detener Escaneo</span>';
        startScanBtn.className = 'btn btn-secondary';
        cameraStatus.textContent = `📷 Cámara ${camaraUsada} activa - Apunta al código QR`;

        // Iniciar escaneo continuo
        scanInterval = setInterval(escanearFrame, 150); // Cada 150ms

    } catch (err) {
        console.error("Error completo:", err);

        // Mensajes de error específicos
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            cameraStatus.textContent = "❌ Debes permitir el acceso a la cámara";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            cameraStatus.textContent = "❌ No se detectó ninguna cámara";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            cameraStatus.textContent = "❌ La cámara está siendo usada por otra app. Ciérrala e intenta de nuevo.";
        } else if (err.name === 'OverconstrainedError') {
            cameraStatus.textContent = "❌ Restricciones de cámara no soportadas";
        } else if (err.name === 'AbortError') {
            cameraStatus.textContent = "❌ Timeout. Intenta de nuevo o usa ingreso manual";
        } else {
            cameraStatus.textContent = "❌ Error desconocido. Usa ingreso manual";
        }

        startScanBtn.innerHTML = '<span class="icon">📸</span><span>Escanear Código QR</span>';
        startScanBtn.className = 'btn btn-primary';
    }
});

// Limpiar al salir
window.addEventListener('beforeunload', detenerEscaneo);