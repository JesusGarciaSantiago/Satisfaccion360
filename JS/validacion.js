const video = document.getElementById('video');
const startScanBtn = document.getElementById('startScan');
const validarBtn = document.getElementById('validarBtn');
const input = document.getElementById('codigoInput');
const resultado = document.getElementById('resultado');
const cameraStatus = document.getElementById('cameraStatus');
const scanOverlay = document.getElementById('scanOverlay');
const loader = document.getElementById('loader');

// ⚠️ Cambia esta URL por la URL desplegada de tu Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNdss7f9lanIvAEFrlebQb2RLu0R25qDPjellurYFEgRqsJQgQPptfAllrUKX7NioE/exec";

let scanning = false;
let html5QrCode;

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
    resultado.style.display = 'block';
    resultado.className = `resultado ${success ? 'success' : 'error'}`;
    resultado.textContent = `${success ? '✅' : '❌'} ${mensaje}`;
}

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

// Función para detener el escaneo de forma segura
async function detenerEscaneo() {
    if (html5QrCode && scanning) {
        try {
            await html5QrCode.stop();
        } catch (err) {
            console.log("Error al detener cámara:", err);
        }
    }
    scanning = false;
    scanOverlay.classList.remove('active');
    startScanBtn.innerHTML = '<span class="icon">📸</span><span>Escanear Código QR</span>';
    startScanBtn.className = 'btn btn-primary';
    cameraStatus.textContent = "";
}

// Escaneo con cámara (QR)
startScanBtn.addEventListener('click', async () => {
    if (scanning) {
        await detenerEscaneo();
        return;
    }

    // Crear nueva instancia
    html5QrCode = new Html5Qrcode("video");

    try {
        cameraStatus.textContent = "⏳ Buscando cámaras...";

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
            cameraStatus.textContent = "❌ No se encontró cámara disponible";
            return;
        }

        scanning = true;
        scanOverlay.classList.add('active');
        startScanBtn.innerHTML = '<span class="icon">⏹️</span><span>Detener Escaneo</span>';
        startScanBtn.className = 'btn btn-secondary';
        cameraStatus.textContent = "📷 Iniciando cámara...";

        // Configuración mejorada para evitar timeout
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
        };

        // Intentar con la cámara trasera primero (mejor para móviles)
        let cameraId = cameras[0].id;

        // Buscar cámara trasera si existe
        const backCamera = cameras.find(camera =>
            camera.label.toLowerCase().includes('back') ||
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('trasera')
        );

        if (backCamera) {
            cameraId = backCamera.id;
        }

        await html5QrCode.start(
            cameraId,
            config,
            (decodedText) => {
                // Código escaneado exitosamente
                validarCodigo(decodedText);
                detenerEscaneo();
            },
            (errorMessage) => {
                // Errores de lectura silenciosos (normal cuando no detecta QR)
            }
        );

        cameraStatus.textContent = "📷 Cámara activa - Apunta al código";

    } catch (err) {
        console.error("Error al iniciar cámara:", err);
        scanning = false;
        scanOverlay.classList.remove('active');
        startScanBtn.innerHTML = '<span class="icon">📸</span><span>Escanear Código QR</span>';
        startScanBtn.className = 'btn btn-primary';

        // Mensajes de error más específicos
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            cameraStatus.textContent = "❌ Permiso de cámara denegado";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            cameraStatus.textContent = "❌ No se encontró cámara";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            cameraStatus.textContent = "❌ Cámara en uso por otra app";
        } else if (err.name === 'AbortError') {
            cameraStatus.textContent = "❌ Tiempo de espera agotado. Intenta de nuevo";
        } else {
            cameraStatus.textContent = "❌ Error al acceder a la cámara";
        }
    }
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', () => {
    if (scanning && html5QrCode) {
        html5QrCode.stop().catch(err => console.log(err));
    }
});