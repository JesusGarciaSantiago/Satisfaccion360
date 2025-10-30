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
  const URL_RULETA = "https://script.google.com/macros/s/AKfycbwOSs9Ue73ipM-mt2IM1QVbff0fLeE0FdhUJXi1WxNFuV95Fv_P3i3Bx4JO2dhfBI_h/exec";

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

  // 🎨 FUNCIÓN PARA MOSTRAR ALERTAS PERSONALIZADAS CON DISEÑO
  function mostrarAlerta(mensaje) {
    // Agregar estilos de animación si no existen
    if (!document.getElementById('popup-animations')) {
      const style = document.createElement('style');
      style.id = 'popup-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popupEntrance {
          from { opacity: 0; transform: scale(0.8) translateY(-50px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    const alertaHTML = `
      <div id="alerta-custom" style="
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        animation: fadeIn 0.3s ease-out;
      ">
        <div style="
          background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
          padding: 30px 25px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
          color: #5a514a;
          max-width: 380px;
          width: 90%;
          animation: popupEntrance 0.4s ease-out;
        ">
          <div style="font-size: 3.5rem; margin-bottom: 15px;">⚠️</div>
          <h2 style="color: #7B8C6E; margin-bottom: 15px; font-size: 1.4rem; font-weight: 700;">Atención</h2>
          <p style="font-size: 1rem; margin-bottom: 25px; color: #5a514a; line-height: 1.5;">${mensaje}</p>
          <button id="alerta-btn-cerrar" style="
            padding: 12px 30px;
            background: linear-gradient(135deg, #8ca37c 0%, #7c8c6c 100%);
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
          ">
            Aceptar
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertaHTML);

    // Agregar event listener al botón
    document.getElementById('alerta-btn-cerrar').addEventListener('click', function () {
      document.getElementById('alerta-custom').remove();
    });

    // Agregar hover effects
    const btn = document.getElementById('alerta-btn-cerrar');
    btn.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.3)';
    });
    btn.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });
  }

  // === Validación de campos requeridos CON MENSAJES ESPECÍFICOS ===
  function validarFormulario(data) {
    // Campos de texto requeridos
    if (!data.ticket || !data.mesa) {
      if (!data.ticket && !data.mesa) {
        mostrarAlerta("Por favor ingresa el número de ticket y de mesa.");
      } else if (!data.ticket) {
        mostrarAlerta("Por favor ingresa el folio del ticket.");
      } else {
        mostrarAlerta("Por favor ingresa el número de mesa.");
      }
      return false;
    }

    // Validar cada pregunta con mensajes personalizados
    if (!data.personal) {
      mostrarAlerta("Por favor califica el servicio y trato del personal.");
      return false;
    }

    if (!data.bebidas) {
      mostrarAlerta("Por favor califica la calidad de las bebidas.");
      return false;
    }

    if (!data.alimentos) {
      mostrarAlerta("Por favor califica la calidad de los alimentos.");
      return false;
    }

    if (!data.limpieza) {
      mostrarAlerta("Por favor califica la limpieza del lugar.");
      return false;
    }

    if (!data.precios) {
      mostrarAlerta("Por favor indica tu percepción sobre los precios.");
      return false;
    }

    if (!data.conociste) {
      mostrarAlerta("Por favor indícanos cómo te enteraste de nosotros.");
      return false;
    }

    // Si seleccionó "Otro", debe escribir texto
    if (data.conociste === "Otro" && !otroInput.value.trim()) {
      mostrarAlerta("Por favor especifica cómo conociste el restaurante.");
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

    // 🔒 BLOQUEAR BOTÓN HOME
    bloquearBotonHome(true);

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

        setTimeout(() => {
          // 🔓 DESBLOQUEAR BOTÓN HOME
          bloquearBotonHome(false);

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
        }, 1000);
      })
      .catch(err => {
        console.error("❌ Error al enviar formulario:", err);

        // 🔓 DESBLOQUEAR BOTÓN HOME
        bloquearBotonHome(false);

        // 🔥 OCULTAR LOADER EN CASO DE ERROR
        mostrarLoader(false);
        mostrarAlerta("❌ Hubo un error al enviar la encuesta. Por favor intenta de nuevo.");
      });
  });
});