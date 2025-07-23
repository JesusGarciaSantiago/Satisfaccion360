document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario");

  formulario.addEventListener("submit", function (e) {
    e.preventDefault(); // Previene que el formulario se envíe por defecto

    const url = "https://script.google.com/macros/s/AKfycbymIckFtg0sYJk_bfF5TyCbrw2vo4Fhpa9IDA55fQ45QC_10uv3WGaJgm2i6Nux1XC6Jw/exec";
    // Recolectar valores del formulario después de que el usuario lo envíe
    const data = {
      personal: document.querySelector('input[name="personal"]:checked')?.value || "",
      bebidas: document.querySelector('input[name="bebidas"]:checked')?.value || "",
      alimentos: document.querySelector('input[name="alimentos"]:checked')?.value || "",
      limpieza: document.querySelector('input[name="limpieza"]:checked')?.value || "",
      precios: document.querySelector('input[name="precios"]:checked')?.value || "",
      conociste: document.querySelector('input[name="conociste"]:checked')?.value || ""
    };

    // Validación rápida (opcional)
    if (!data.personal || !data.bebidas || !data.alimentos || !data.limpieza || !data.precios || !data.conociste) {
      alert("Por favor responde todas las preguntas.");
      return;
    }

    // Enviar los datos a Google Sheets
    fetch(url, {
      method: "POST",
      mode: "no-cors", // esto evita el error de CORS
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(response => response.text())
      .then(result => {
        console.log("Resultado:", result);
        alert("¡Gracias por enviar la encuesta!");
        formulario.reset();

        // Redirigir después de 1 segundo
        setTimeout(() => {
          window.location.href = "ruleta.html";
        }, 1000);
      })
      .catch(error => {
        console.error("Error al enviar:", error);
        alert("Hubo un problema al enviar la encuesta.");
      });
  });
});

document.querySelectorAll('input[name="conociste"]').forEach(input => {
  input.addEventListener('change', function () {
    const otroContainer = document.getElementById("otro-input-container");
    if (this.value === "Otro") {
      otroContainer.style.display = "block";
      document.getElementById("otro").required = true;
    } else {
      otroContainer.style.display = "none";
      document.getElementById("otro").required = false;
      document.getElementById("otro").value = ""; // limpiar
    }
  });
});

