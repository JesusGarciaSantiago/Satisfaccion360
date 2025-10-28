// URL de tu Google Apps Script
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwCMj9CaPewcaZ319oBLG5ldLDZTlul5qFDx7HY29lW9ntP17EsEMsouoDWKX1VetB6/exec';

const select = document.querySelector('.custom-select');
const selected = select.querySelector('.select-selected');
const options = select.querySelector('.select-items');
let selectedValue = null;
let open = false;
let meseros = [];

// 🎨 FUNCIÓN PARA MOSTRAR ALERTAS PERSONALIZADAS
function mostrarError(mensaje) {
  const alertaHTML = `
    <div id="alerta-custom" class="popup" style="display: flex; z-index: 99999;">
      <div class="popup-content" style="max-width: 350px;">
        <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
        <p style="font-size: 1rem; margin-bottom: 20px; color: #333;">${mensaje}</p>
        <button onclick="document.getElementById('alerta-custom').remove()" class="btn btn-primary" style="max-width: 150px; margin: 0 auto; background: #7B8C6E; color: white; padding: 12px 20px; border: none; border-radius: 12px; cursor: pointer;">Aceptar</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', alertaHTML);
}

// ======= CARGAR MESEROS DESDE CACHE O GOOGLE SHEETS =======
function cargarMeseros() {
  const meserosCache = localStorage.getItem('meseros');
  const timestamp = localStorage.getItem('meserosTimestamp');
  const CACHE_DURATION = 30 * 60 * 1000;

  if (meserosCache && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    if (age < CACHE_DURATION) {
      meseros = JSON.parse(meserosCache);
      renderizarMeseros();
      selected.textContent = 'Selecciona...';
      console.log('✅ Meseros cargados desde cache:', meseros);
      actualizarMeserosBackground();
      return;
    }
  }

  selected.textContent = 'Cargando...';
  cargarMeserosJSONP();
}

function cargarMeserosJSONP() {
  const callbackName = 'meseros_callback_' + Date.now();

  window[callbackName] = function (data) {
    try {
      if (data.success && data.meseros && data.meseros.length > 0) {
        meseros = data.meseros;
        localStorage.setItem('meseros', JSON.stringify(meseros));
        localStorage.setItem('meserosTimestamp', Date.now().toString());
        renderizarMeseros();
        selected.textContent = 'Selecciona...';
        console.log('✅ Meseros cargados desde Google Sheets:', meseros);
      } else {
        throw new Error('No se encontraron meseros');
      }
    } catch (error) {
      console.error('❌ Error procesando meseros:', error);
      usarCacheFallback();
    }

    delete window[callbackName];
    const scriptTag = document.getElementById(callbackName);
    if (scriptTag) document.body.removeChild(scriptTag);
  };

  const script = document.createElement('script');
  script.id = callbackName;
  script.src = `${SHEET_URL}?action=getMeseros&callback=${callbackName}`;
  script.onerror = function () {
    console.error('❌ Error al cargar script');
    usarCacheFallback();
    delete window[callbackName];
    const scriptTag = document.getElementById(callbackName);
    if (scriptTag) document.body.removeChild(scriptTag);
  };

  document.body.appendChild(script);
}

function usarCacheFallback() {
  const meserosCache = localStorage.getItem('meseros');
  if (meserosCache) {
    meseros = JSON.parse(meserosCache);
    renderizarMeseros();
    selected.textContent = 'Selecciona...';
    console.log('⚠️ Usando meseros del cache antiguo');
  } else {
    selected.textContent = 'Error al cargar';
    mostrarError('No se pudieron cargar los meseros. Verifica tu conexión.');
  }
}

function actualizarMeserosBackground() {
  const callbackName = 'meseros_bg_callback_' + Date.now();

  window[callbackName] = function (data) {
    try {
      if (data.success && data.meseros && data.meseros.length > 0) {
        const meserosActuales = JSON.stringify(meseros);
        const meserosNuevos = JSON.stringify(data.meseros);

        if (meserosActuales !== meserosNuevos) {
          localStorage.setItem('meseros', meserosNuevos);
          localStorage.setItem('meserosTimestamp', Date.now().toString());
          console.log('🔄 Cache de meseros actualizado en segundo plano');
        }
      }
    } catch (error) {
      console.log('⚠️ No se pudo actualizar el cache en segundo plano');
    }

    delete window[callbackName];
    const scriptTag = document.getElementById(callbackName);
    if (scriptTag) document.body.removeChild(scriptTag);
  };

  const script = document.createElement('script');
  script.id = callbackName;
  script.src = `${SHEET_URL}?action=getMeseros&callback=${callbackName}`;
  script.onerror = function () {
    delete window[callbackName];
    const scriptTag = document.getElementById(callbackName);
    if (scriptTag) document.body.removeChild(scriptTag);
  };

  document.body.appendChild(script);
}

// ======= RENDERIZAR OPCIONES DE MESEROS =======
function renderizarMeseros() {
  options.innerHTML = '';

  if (meseros.length === 0) {
    const div = document.createElement('div');
    div.textContent = 'No hay meseros disponibles';
    div.style.textAlign = 'center';
    div.style.color = '#999';
    options.appendChild(div);
    return;
  }

  meseros.forEach(mesero => {
    const div = document.createElement('div');
    div.setAttribute('data-value', mesero);
    div.innerHTML = `${mesero}<span class="radio"></span>`;

    div.addEventListener('click', (e) => {
      e.stopPropagation();

      options.querySelectorAll('div').forEach(item => {
        const radio = item.querySelector('.radio');
        if (radio) {
          radio.classList.remove('active');
          item.classList.remove('active');
        }
      });

      div.querySelector('.radio').classList.add('active');
      div.classList.add('active');
      selected.textContent = mesero;
      selectedValue = mesero;
      closeDropdown();
    });

    options.appendChild(div);
  });
}

// ======= FUNCIONES DEL DROPDOWN =======
function openDropdown() {
  const rect = selected.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom - 20;
  const spaceAbove = rect.top - 20;

  let maxHeight = Math.max(spaceBelow - 8, 200);

  if (spaceBelow < 200 && spaceAbove > spaceBelow) {
    maxHeight = Math.min(spaceAbove - 8, 400);
    options.style.bottom = (viewportHeight - rect.top + 8) + 'px';
    options.style.top = 'auto';
  } else {
    options.style.top = (rect.bottom + 8) + 'px';
    options.style.bottom = 'auto';
  }

  options.style.position = 'fixed';
  options.style.left = rect.left + 'px';
  options.style.width = rect.width + 'px';
  options.style.display = 'block';
  options.style.maxHeight = maxHeight + 'px';
  options.style.overflowY = 'auto';
  options.style.overflowX = 'hidden';
  options.style.zIndex = '99999';
  select.classList.add('open');
  open = true;
}

function closeDropdown() {
  options.style.display = 'none';
  select.classList.remove('open');
  open = false;
}

// ======= EVENT LISTENERS =======
selected.addEventListener('click', (e) => {
  e.stopPropagation();
  if (meseros.length > 0) {
    if (!open) openDropdown();
    else closeDropdown();
  } else {
    cargarMeseros();
  }
});

document.addEventListener('click', () => {
  if (open) closeDropdown();
});

window.addEventListener('resize', () => {
  if (open) openDropdown();
});

window.addEventListener('scroll', () => {
  if (open) openDropdown();
}, true);

// Botón siguiente
document.querySelector('.btn').addEventListener('click', () => {
  if (!selectedValue) {
    mostrarError("Selecciona un nombre de mesero ◀");
    return;
  }
  sessionStorage.setItem("meseroActual", selectedValue);
  window.location.href = "formulario.html";
});

// ======= INICIALIZACIÓN =======
cargarMeseros();