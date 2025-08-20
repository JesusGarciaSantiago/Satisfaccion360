document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario");
  const otroContainer = document.getElementById("otro-input-container");
  const otroInput = document.getElementById("otro");
  const meseroActual = sessionStorage.getItem("meseroActual") || "Desconocido";
  const ruletaDeshabilitada = sessionStorage.getItem("ruletaDeshabilitada") === "true";

  // Mostrar/ocultar campo "otro"
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

  // === 📌 Precargar premios desde Google Sheet y guardarlos en localStorage ===
  const URL_RULETA = "https://script.google.com/macros/s/AKfycby34WI92Sv8szm_agBYXXDHdYkeK2QCEAjpupyQrJ7cx0nH7GO4bdzEvGLoNasL3z4/exec";

  async function precargarPremios() {
    try {
      const response = await fetch(`${URL_RULETA}?action=get`);
      const data = await response.json();
      if (data?.premios?.length) {
        localStorage.setItem("premios", JSON.stringify(data.premios));
        console.log("✅ Premios precargados y guardados en localStorage:", data.premios);
      }
    } catch (err) {
      console.error("❌ Error al precargar premios:", err);
    }
  }

  // Llamar apenas cargue la página del formulario
  precargarPremios();

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

    // Validación
    for (let campo in data) {
      if (!data[campo] && campo !== "otro" && campo !== "comentarios") {
        alert("Por favor responde todas las preguntas.");
        return;
      }
    }

    // Envío a Google Apps Script
    const url = "https://script.google.com/macros/s/AKfycbwCMj9CaPewcaZ319oBLG5ldLDZTlul5qFDx7HY29lW9ntP17EsEMsouoDWKX1VetB6/exec";

    fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(() => {
        formulario.reset();
        otroContainer.style.display = "none";

        const popup = document.getElementById("popup-encuesta");
        popup.style.display = "flex"; // aquí lo mostramos

        document.getElementById("continuar-btn").onclick = () => {
          const ruletaDeshabilitada = sessionStorage.getItem("ruletaDeshabilitada") === "true";
          if (!ruletaDeshabilitada) {
            window.location.href = "ruleta.html";
          } else {
            window.location.href = "formulario.html";
          }
        };

        document.getElementById("cambiar-btn").onclick = () => {
          window.location.href = "index.html";
        };
      })

  });
});
