const btn = document.getElementById('settings-btn');
const menu = document.getElementById('settings-menu');


btn.addEventListener('click', () => {
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', (e) => {
  if (!btn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});
document.querySelector(".login").addEventListener("click", () => {
  const mesero = document.getElementById("mesero").value;
  const deshabilitarRuleta = document.getElementById("checkbox").checked;
  
  if (!mesero) {
    alert("Selecciona un nombre de mesero.");
    return;
  }

  sessionStorage.setItem("meseroActual", mesero);
  sessionStorage.setItem("ruletaDeshabilitada", deshabilitarRuleta ? true : false)

  window.location.href = "index.html"; // Cambia esto al nombre real del archivo del formulario
});