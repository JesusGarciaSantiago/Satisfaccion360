// footer.js - controla modal de ajustes y boton home
document.addEventListener("DOMContentLoaded", () => {
  const ajustesBtn = document.getElementById("btn-ajustes");
  const homeBtn = document.getElementById("btn-home");
  const modal = document.getElementById("ajustes-modal");
  const checkbox = document.getElementById("checkbox-ruleta");

  // Cargar estado guardado
  try {
    const ruletaDeshabilitada = sessionStorage.getItem("ruletaDeshabilitada") === "true";
    if (checkbox) checkbox.checked = ruletaDeshabilitada;
  } catch (e) {
    console.warn("No se pudo leer sessionStorage:", e);
  }

  // Toggle modal ajustes
  if (ajustesBtn && modal) {
    ajustesBtn.addEventListener("click", () => {
      modal.classList.toggle("hidden");
      document.body.classList.toggle("no-scroll", !modal.classList.contains("hidden"));
    });
  }

  // Cerrar modal clic fuera
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
        document.body.classList.remove("no-scroll");
      }
    });
  }

  // Guardar checkbox
  if (checkbox) {
    checkbox.addEventListener("change", () => {
      sessionStorage.setItem("ruletaDeshabilitada", checkbox.checked ? "true" : "false");
    });
  }

  // Home button redirige a index
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
});
