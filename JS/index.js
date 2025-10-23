// URL de tu Google Apps Script
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwCMj9CaPewcaZ319oBLG5ldLDZTlul5qFDx7HY29lW9ntP17EsEMsouoDWKX1VetB6/exec';

const select = document.querySelector('.custom-select');
const selected = select.querySelector('.select-selected');
const options = select.querySelector('.select-items');
let selectedValue = null;
let open = false;
let meseros = [];

// ======= CARGAR MESEROS DESDE CACHE O GOOGLE SHEETS =======
function cargarMeseros() {
  // Intentar cargar desde localStorage primero
  const meserosCache = localStorage.getItem('meseros');
  const timestamp = localStorage.getItem('meserosTimestamp');
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

  // Si hay cache válido, usar esos datos
  if (meserosCache && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    if (age < CACHE_DURATION) {
      meseros = JSON.parse(meserosCache);
      renderizarMeseros();
      selected.textContent = 'Selecciona...';
      console.log('✅ Meseros cargados desde cache:', meseros);

      // Actualizar en segundo plano
      actualizarMeserosBackground();
      return;
    }
  }

  // Si no hay cache o expiró, cargar desde Google Sheets usando JSONP
  selected.textContent = 'Cargando...';
  cargarMeserosJSONP();
}

// Cargar usando JSONP para evitar CORS
function cargarMeserosJSONP() {
  const callbackName = 'meseros_callback_' + Date.now();

  window[callbackName] = function (data) {
    try {
      if (data.success && data.meseros && data.meseros.length > 0) {
        meseros = data.meseros;

        // Guardar en cache
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

    // Limpiar
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

// Usar cache antiguo como fallback
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

// Actualizar meseros en segundo plano sin bloquear la UI
function actualizarMeserosBackground() {
  const callbackName = 'meseros_bg_callback_' + Date.now();

  window[callbackName] = function (data) {
    try {
      if (data.success && data.meseros && data.meseros.length > 0) {
        // Solo actualizar si hay cambios
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

    // Limpiar
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
  // Limpiar opciones existentes
  options.innerHTML = '';

  if (meseros.length === 0) {
    const div = document.createElement('div');
    div.textContent = 'No hay meseros disponibles';
    div.style.textAlign = 'center';
    div.style.color = '#999';
    options.appendChild(div);
    return;
  }

  // Crear opciones dinámicamente
  meseros.forEach(mesero => {
    const div = document.createElement('div');
    div.setAttribute('data-value', mesero);
    div.innerHTML = `${mesero}<span class="radio"></span>`;

    // Agregar evento de clic
    div.addEventListener('click', (e) => {
      e.stopPropagation();

      // Remover selección anterior
      options.querySelectorAll('div').forEach(item => {
        const radio = item.querySelector('.radio');
        if (radio) {
          radio.classList.remove('active');
          item.classList.remove('active');
        }
      });

      // Agregar selección nueva
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
  const spaceBelow = viewportHeight - rect.bottom - 20; // 20px de margen
  const spaceAbove = rect.top - 20;

  // Calcular altura máxima disponible
  let maxHeight = Math.max(spaceBelow - 8, 200); // Mínimo 200px

  // Si no hay suficiente espacio abajo pero sí arriba, abrir hacia arriba
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

function mostrarError(mensaje) {
  alert('⚠️ ' + mensaje);
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

// Cerrar si clic fuera
document.addEventListener('click', () => {
  if (open) closeDropdown();
});

// Reposicionar en scroll/resize
window.addEventListener('resize', () => {
  if (open) openDropdown();
});

window.addEventListener('scroll', () => {
  if (open) openDropdown();
}, true);

// Botón siguiente
document.querySelector('.btn').addEventListener('click', () => {
  if (!selectedValue) {
    alert("Selecciona un nombre de mesero ◀");
    return;
  }
  sessionStorage.setItem("meseroActual", selectedValue);
  window.location.href = "formulario.html";
});

// ======= INICIALIZACIÓN =======
// Cargar meseros al cargar la página
cargarMeseros();