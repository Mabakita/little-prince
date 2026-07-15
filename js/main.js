document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const expanded = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', String(expanded));
    });
  }

  document.querySelectorAll('.nav__chapter-select').forEach((select) => {
    select.addEventListener('change', () => {
      if (select.value) {
        window.location.href = select.value;
      }
    });
  });
});
