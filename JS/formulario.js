document.addEventListener("DOMContentLoaded", function () {
  const formulario = document.getElementById("formulario");

  formulario.addEventListener("submit", function (e) {
    e.preventDefault();

    const url = "https://script.google.com/macros/s/AKfycbxgNaquQ3nBgZGX0dGl9zBKcT_dw5U9rs6lBxSLp966QAY-9f1ut9a_0MDGyAwMPsS-/exec";

    const data = {
      f_ticket: document.getElementById("f_ticket")?.value || "",
      mesero: document.getElementById("mesero")?.value || "",
      mesa: document.getElementById("mesa")?.value || "",
      personal: document.querySelector('input[name="personal"]:checked')?.value || "",
      alimentos: document.querySelector('input[name="alimentos"]:checked')?.value || "",
      bebidas: document.querySelector('input[name="bebidas"]:checked')?.value || "",
      limpieza: document.querySelector('input[name="limpieza"]:checked')?.value || "",
      precios: document.querySelector('input[name="precios"]:checked')?.value || "",
      conociste: document.querySelector('input[name="conociste"]:checked')?.value || "",
      otro: document.getElementById("otro")?.value || "",
      comentarios: document.getElementById("comentarios")?.value || ""
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then(res => {
        alert("¡Gracias por tu respuesta!");
        formulario.reset();
        window.location.href = "ruleta.html";
      })
      .catch(err => {
        alert("Error al enviar la encuesta.");
        console.error(err);
      });
  });

  document.querySelectorAll('input[name="conociste"]').forEach(input => {
    input.addEventListener("change", function () {
      const otroContainer = document.getElementById("otro-input-container");
      if (this.value === "Otro") {
        otroContainer.style.display = "block";
        document.getElementById("otro").required = true;
      } else {
        otroContainer.style.display = "none";
        document.getElementById("otro").required = false;
        document.getElementById("otro").value = "";
      }
    });
  });
});
