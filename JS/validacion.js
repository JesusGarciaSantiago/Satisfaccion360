const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startScanBtn = document.getElementById('startScan');
const cameraStatus = document.getElementById('cameraStatus');
const scanOverlay = document.getElementById('scanOverlay');
const loader = document.getElementById('loader');
const popup = document.getElementById('popup');
const popupIcon = document.getElementById('popupIcon');
const popupTitulo = document.getElementById('popupTitulo');
const popupMensaje = document.getElementById('popupMensaje');
const popupCerrar = document.getElementById('popupCerrar');
const videoContainer = document.querySelector('.video-container');
const validarBtn = document.getElementById('validarBtn');
const input = document.getElementById('codigoInput');

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwS7mNjfP3S2x6-WOPdRn1TDm1dXzZ8ddyzcdxgbvWblTLIp_aUZ6kRjSo1meOI-pGJKQ/exec";

let scanning = false;
let stream = null;
let scanInterval = null;

//  Crear placeholder para cuando no hay video
const placeholder = document.createElement('div');
placeholder.className = 'video-placeholder';
placeholder.innerHTML = '📷';
videoContainer.insertBefore(placeholder, videoContainer.firstChild);

// 🔥 Forzar mayúsculas en tiempo real
input.addEventListener('input', function () {
    this.value = this.value.toUpperCase();
});

async function validarCodigo(codigo) {
    if (!codigo) {
        mostrarResultado(false, "Por favor ingresa un código válido");
        return;
    }

    // Mostrar loader
    loader.classList.remove('hidden');

    try {
        const url = `${SCRIPT_URL}?action=validar&codigo=${encodeURIComponent(codigo)}`;
        const response = await fetch(url);
        const data = await response.json();

        // Ocultar loader
        loader.classList.add('hidden');

        //  SOLO MOSTRAR RESULTADO UNA VEZ
        if (data.success) {
            mostrarResultado(true, `${data.message}${data.premio ? ' - ' + data.premio : ''}`);
        } else {
            mostrarResultado(false, data.message || "Código no válido");
        }
    } catch (error) {
        // Ocultar loader
        loader.classList.add('hidden');
        mostrarResultado(false, "Error de conexión. Intenta de nuevo.");
        console.error(error);
    }
}

function mostrarResultado(success, mensaje) {
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
        stream.getTracks().forEach(track => {
            track.stop();
            console.log('Track detenido:', track.kind);
        });
        stream = null;
    }

    video.srcObject = null;
    video.classList.remove('active');
    placeholder.classList.remove('hidden');

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
            console.log("✅ QR detectado:", code.data);
            validarCodigo(code.data);
            detenerEscaneo();
        }
    } catch (err) {
        console.error("Error al escanear frame:", err);
    }
}

//  INICIAR CÁMARA CON BOTÓN
startScanBtn.addEventListener('click', async () => {
    if (scanning) {
        detenerEscaneo();
        return;
    }

    // Verificar que jsQR esté cargado
    if (typeof jsQR === 'undefined') {
        cameraStatus.textContent = "❌ Error: Librería de escaneo no cargada. Recarga la página.";
        cameraStatus.style.color = '#d32f2f';
        return;
    }

    try {
        cameraStatus.textContent = "⏳ Solicitando acceso a la cámara...";
        cameraStatus.style.color = '#f57c00';

        // Verificar soporte
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('NotSupported');
        }

        //  SOLICITAR PERMISOS EXPLÍCITAMENTE
        let camaraUsada = "trasera";

        console.log("📸 Solicitando permisos de cámara...");

        try {
            // Intentar con cámara trasera
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            console.log("✅ Cámara trasera obtenida");
        } catch (firstError) {
            console.log("Intentando con cualquier cámara...");
            camaraUsada = "disponible";

            // Si falla, intentar con cualquier cámara
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            console.log("✅ Cámara obtenida");
        }

        //  Configurar video
        video.srcObject = stream;
        cameraStatus.textContent = "⏳ Iniciando cámara...";

        //  Esperar a que el video esté listo
        await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
                console.log("✅ Metadata del video cargada");
                video.play()
                    .then(() => {
                        console.log("✅ Video reproduciendo");
                        resolve();
                    })
                    .catch((err) => {
                        console.error("❌ Error al reproducir video:", err);
                        reject(err);
                    });
            };

            video.onerror = (err) => {
                console.error("❌ Error en el video:", err);
                reject(err);
            };

            // Timeout de seguridad
            setTimeout(() => reject(new Error("Timeout")), 15000);
        });

        //  Mostrar video y ocultar placeholder
        placeholder.classList.add('hidden');
        video.classList.add('active');

        scanning = true;
        scanOverlay.classList.add('active');

        startScanBtn.innerHTML = '<span class="icon">⏹️</span><span>Detener Escaneo</span>';
        startScanBtn.className = 'btn btn-secondary';

        cameraStatus.textContent = `✅ Cámara ${camaraUsada} activa - Apunta al código QR`;
        cameraStatus.style.color = '#388e3c';

        // Iniciar escaneo continuo
        scanInterval = setInterval(escanearFrame, 200);

        console.log("✅ Escaneo iniciado correctamente");

    } catch (err) {
        console.error("❌ Error al iniciar cámara:", err);

        // Limpiar cualquier stream parcial
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        // Asegurar que el video esté oculto
        video.classList.remove('active');
        placeholder.classList.remove('hidden');

        // Mensajes de error específicos
        let errorMsg = "";

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMsg = "❌ Permiso denegado. Verifica los permisos de la app en Configuración de Android.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMsg = "❌ No se detectó ninguna cámara";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMsg = "❌ La cámara está siendo usada por otra app";
        } else if (err.name === 'OverconstrainedError') {
            errorMsg = "❌ Restricciones de cámara no compatibles";
        } else if (err.message === 'Timeout') {
            errorMsg = "❌ Tiempo de espera agotado";
        } else if (err.message === 'NotSupported') {
            errorMsg = "❌ WebView no soporta acceso a cámara";
        } else {
            errorMsg = "❌ Error al acceder a la cámara. Usa ingreso manual.";
        }

        cameraStatus.textContent = errorMsg;
        cameraStatus.style.color = '#d32f2f';

        startScanBtn.innerHTML = '<span class="icon">📸</span><span>Escanear Código QR</span>';
        startScanBtn.className = 'btn btn-primary';
    }
});

// Manejar cambios de orientación SIN reiniciar
let isOrientationChanging = false;

window.addEventListener('orientationchange', () => {
    console.log('🔄 Cambio de orientación detectado');
    isOrientationChanging = true;

    setTimeout(() => {
        isOrientationChanging = false;
        console.log('✅ Orientación estabilizada');
    }, 500);
});

//  Manejar visibilidad de página
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 Página oculta');
    } else {
        console.log('📱 Página visible');
        // Si estaba escaneando, continuar
        if (scanning && !scanInterval && stream) {
            scanInterval = setInterval(escanearFrame, 200);
            console.log('▶️ Escaneo reanudado');
        }
    }
});

//  Limpiar al salir
window.addEventListener('beforeunload', () => {
    console.log('👋 Limpiando recursos...');
    detenerEscaneo();
});

console.log("✅ Script de validación cargado correctamente");