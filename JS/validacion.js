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

// Escaneo con cámara (QR)
startScanBtn.addEventListener('click', async () => {
    if (scanning) {
        html5QrCode.stop().then(() => {
            scanning = false;
            scanOverlay.classList.remove('active');
            startScanBtn.innerHTML = '<span class="icon">📸</span><span>Escanear Código QR</span>';
            startScanBtn.className = 'btn btn-primary';
            cameraStatus.textContent = "";
        }).catch(err => {
            console.error(err);
        });
        return;
    }

    html5QrCode = new Html5Qrcode("video");

    try {
        const cameras = await Html5Qrcode.getCameras();

        if (cameras && cameras.length) {
            scanning = true;
            scanOverlay.classList.add('active');
            startScanBtn.innerHTML = '<span class="icon">⏹️</span><span>Detener Escaneo</span>';
            startScanBtn.className = 'btn btn-secondary';
            cameraStatus.textContent = "📷 Cámara activa - Apunta al código";

            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                codigo => {
                    validarCodigo(codigo);
                    html5QrCode.stop();
                    scanning = false;
                    scanOverlay.classList.remove('active');
                    startScanBtn.innerHTML = '<span class="icon">📸</span><span>Escanear Código QR</span>';
                    startScanBtn.className = 'btn btn-primary';
                    cameraStatus.textContent = "";
                },
                error => {
                    // Errores de lectura silenciosos
                }
            );
        } else {
            cameraStatus.textContent = "❌ No se encontró cámara disponible";
        }
    } catch (err) {
        cameraStatus.textContent = "❌ Error al acceder a la cámara";
        console.error(err);
    }
});