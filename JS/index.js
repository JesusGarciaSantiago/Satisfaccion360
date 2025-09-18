const select = document.querySelector('.custom-select');
const selected = select.querySelector('.select-selected');
const options = select.querySelector('.select-items');
const items = options.querySelectorAll('div');
let selectedValue = null;
let open = false;

function openDropdown() {
  const rect = selected.getBoundingClientRect();
  options.style.position = 'fixed';
  options.style.top = (rect.bottom + 8) + 'px';
  options.style.left = rect.left + 'px';
  options.style.width = rect.width + 'px';
  options.style.display = 'block';
  options.style.maxHeight = '40vh';
  options.style.overflowY = 'auto';
  options.style.zIndex = '99999';
  select.classList.add('open');
  open = true;
}

function closeDropdown() {
  options.style.display = 'none';
  select.classList.remove('open');
  open = false;
}

selected.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!open) openDropdown(); else closeDropdown();
});

// seleccionar opción
items.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    items.forEach(i => {
      i.querySelector('.radio').classList.remove('active');
      i.classList.remove('active');
    });
    item.querySelector('.radio').classList.add('active');
    item.classList.add('active');
    selected.textContent = item.getAttribute('data-value');
    selectedValue = item.getAttribute('data-value');
    closeDropdown();
  });
});

// cerrar si clic fuera
document.addEventListener('click', () => { if (open) closeDropdown(); });

// reposicionar en scroll/resize
window.addEventListener('resize', () => { if (open) openDropdown(); });
window.addEventListener('scroll', () => { if (open) openDropdown(); }, true);

// botón siguiente
document.querySelector('.btn').addEventListener('click', () => {
  if (!selectedValue) {
    alert("Selecciona un nombre de mesero ❗");
    return;
  }
  sessionStorage.setItem("meseroActual", selectedValue);
  window.location.href = "formulario.html";
});
