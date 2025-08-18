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

  // Al enviar formulario
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
        alert("¡Gracias por enviar la encuesta!");
        formulario.reset();
        otroContainer.style.display = "none";
        const deshabilitarRuleta = document.getElementById("checkbox")?.ariaChecked;

        if (!ruletaDeshabilitada) {
          setTimeout(() => {
            window.location.href = "ruleta.html";
          }, 100);
        } else {
          window.location.href = "formulario.html"
        }
      })
      .catch(error => {
        console.error("Error al enviar:", error);
        alert("Hubo un problema al enviar la encuesta.");
      });
  });
});
