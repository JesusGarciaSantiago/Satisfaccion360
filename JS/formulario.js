document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario");
  const otroContainer = document.getElementById("otro-input-container");
  const otroInput = document.getElementById("otro");
  const meseroActual = sessionStorage.getItem("meseroActual") || "Desconocido";
  const ruletaDeshabilitada = sessionStorage.getItem("ruletaDeshabilitada") === "true";

  // === Mostrar/ocultar campo "Otro" ===
  document.querySelectorAll('input[name="conociste"]').forEach(input => {
    input.addEventListener('change', function () {
      if (this.labels[0]?.textContent.toUpperCase() === "OTRO") {
        otroContainer.style.display = "block";
        otroInput.required = true;
      } else {
        otroContainer.style.display = "none";
        otroInput.required = false;
        otroInput.value = "";
      }
    });
  });

  // === 📌 Precargar premios desde Google Sheet ===
  const URL_RULETA = "https://script.google.com/macros/s/AKfycby34WI92Sv8szm_agBYXXDHdYkeK2QCEAjpupyQrJ7cx0nH7GO4bdzEvGLoNasL3z4/exec";

  async function precargarPremios() {
    try {
      const response = await fetch(`${URL_RULETA}?action=get`);
      const data = await response.json();
      if (data?.premios?.length) {
        localStorage.setItem("premios", JSON.stringify(data.premios));
        console.log("✅ Premios precargados:", data.premios);
      }
    } catch (err) {
      console.error("❌ Error al precargar premios:", err);
    }
  }

  precargarPremios();

  // === Validación de campos requeridos ===
  function validarFormulario(data) {
    // Campos de texto requeridos
    if (!data.ticket || !data.mesa) {
      alert("Por favor ingresa el número de ticket y de mesa.");
      return false;
    }

    // Campos tipo 'radio' requeridos
    const grupos = ["personal", "bebidas", "alimentos", "limpieza", "precios", "conociste"];
    for (const grupo of grupos) {
      if (!document.querySelector(`input[name="${grupo}"]:checked`)) {
        alert(`Por favor responde la pregunta sobre ${grupo}.`);
        return false;
      }
    }

    // Si seleccionó "Otro", debe escribir texto
    if (data.conociste === "Otro" && !otroInput.value.trim()) {
      alert("Por favor especifica cómo conociste el restaurante.");
      return false;
    }

    return true;
  }

  // 🔥 FUNCIÓN PARA MOSTRAR/OCULTAR LOADER
  function mostrarLoader(mostrar) {
    const loader = document.getElementById("loader-formulario");
    if (mostrar) {
      loader.classList.remove("hidden");
    } else {
      loader.classList.add("hidden");
    }
  }

  // 🔥 FUNCIÓN PARA MOSTRAR/OCULTAR POPUP
  function mostrarPopup(mostrar) {
    const popup = document.getElementById("popup-encuesta");
    if (mostrar) {
      popup.classList.remove("hidden");
    } else {
      popup.classList.add("hidden");
    }
  }

  // === Envío del formulario ===
  formulario.addEventListener("submit", function (e) {
    e.preventDefault();

    const conocisteSeleccion = document.querySelector('input[name="conociste"]:checked')?.value || "";
    const conocisteFinal = conocisteSeleccion === "Otro" ? otroInput.value.trim() : conocisteSeleccion;

    const data = {
      ticket: document.getElementById("ticket")?.value.trim(),
      mesero: meseroActual,
      mesa: document.getElementById("mesa")?.value.trim(),
      personal: document.querySelector('input[name="personal"]:checked')?.value || "",
      bebidas: document.querySelector('input[name="bebidas"]:checked')?.value || "",
      alimentos: document.querySelector('input[name="alimentos"]:checked')?.value || "",
      limpieza: document.querySelector('input[name="limpieza"]:checked')?.value || "",
      precios: document.querySelector('input[name="precios"]:checked')?.value || "",
      conociste: conocisteFinal,
      otro: otroInput.value.trim(),
      comentarios: document.getElementById("comentarios")?.value.trim() || ""
    };

    // 🚫 Validar antes de enviar
    if (!validarFormulario(data)) return;

    // 🔥 MOSTRAR LOADER ANTES DE ENVIAR
    mostrarLoader(true);

    // === Envío a Google Apps Script ===
    const url = "https://script.google.com/macros/s/AKfycbwCMj9CaPewcaZ319oBLG5ldLDZTlul5qFDx7HY29lW9ntP17EsEMsouoDWKX1VetB6/exec";

    fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(() => {
        console.log("✅ Formulario enviado");
        
        // Delay mínimo para que se vea el loader
        setTimeout(() => {
          // 🔥 OCULTAR LOADER
          mostrarLoader(false);

          // Limpiar formulario
          formulario.reset();
          otroContainer.style.display = "none";

          // 🔥 MOSTRAR POPUP
          mostrarPopup(true);

          // Configurar botones del popup
          document.getElementById("continuar-btn").onclick = () => {
            const ruletaDeshabilitada = sessionStorage.getItem("ruletaDeshabilitada") === "true";
            if (!ruletaDeshabilitada) {
              window.location.href = "ruleta.html";
            } else {
              window.location.href = "formulario.html";
            }
          };

          document.getElementById("cambiar-btn").onclick = () => {
            window.location.href = "menu.html";
          };
        }, 1000); // Delay de 1 segundo
      })
      .catch(err => {
        console.error("❌ Error al enviar formulario:", err);
        
        // 🔥 OCULTAR LOADER EN CASO DE ERROR
        mostrarLoader(false);
        alert("❌ Hubo un error al enviar la encuesta. Por favor intenta de nuevo.");
      });
  });
});