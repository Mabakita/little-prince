document.addEventListener('DOMContentLoaded', () => {
  const chapterEntries = [
    { chapterFile: 'chapter-01.html', menuLabel: 'פרק 1 - נחש הבואה', cardNumber: 'פרק 1', cardTitle: 'נחש הבואה', icon: '1', enabled: true },
    { chapterFile: 'chapter-02.html', menuLabel: 'פרק 2 - המפגש בסהרה', cardNumber: 'פרק 2', cardTitle: 'המפגש בסהרה', icon: '2', enabled: true },
    { chapterFile: 'chapter-03.html', menuLabel: 'פרק 3 - הכוכב הזעיר', cardNumber: 'פרק 3', cardTitle: 'הכוכב הזעיר', icon: '3', enabled: true },
    { chapterFile: 'chapter-04.html', menuLabel: 'פרק 4 - האסטרונום הטורקי', cardNumber: 'פרק 4', cardTitle: 'האסטרונום הטורקי', icon: '4', enabled: true },
    { chapterFile: 'chapter-05.html', menuLabel: 'פרק 5 - עצי הבאובב', cardNumber: 'פרק 5', cardTitle: 'עצי הבאובב', icon: '5', enabled: true },
    { chapterFile: 'chapter-06.html', menuLabel: 'פרק 6 - ארבעים וארבע שקיעות', cardNumber: 'פרק 6', cardTitle: 'ארבעים וארבע שקיעות', icon: '6', enabled: true },
    { chapterFile: 'chapter-07.html', menuLabel: 'פרק 7 - קוצים ושושנים', cardNumber: 'פרק 7', cardTitle: 'קוצים ושושנים', icon: '7', enabled: true },
    { chapterFile: 'chapter-08.html', menuLabel: 'פרקים 8-9 - השושנה הגנדרנית', cardNumber: 'פרקים 8-9', cardTitle: 'השושנה הגנדרנית', icon: '8', enabled: true },
    { chapterFile: 'chapter-10.html', menuLabel: 'פרק 10 - המלך', cardNumber: 'פרק 10', cardTitle: 'המלך', icon: '10', enabled: true },
    { chapterFile: 'chapter-11.html', menuLabel: 'פרקים 11-12 - השחצן והשיכור', cardNumber: 'פרקים 11-12', cardTitle: 'השחצן והשיכור', icon: '11', enabled: true },
    { chapterFile: 'chapter-13.html', menuLabel: 'פרק 13 - איש העסקים', cardNumber: 'פרק 13', cardTitle: 'איש העסקים', icon: '13', enabled: true },
    { chapterFile: 'chapter-14.html', menuLabel: 'פרק 14 - מדליק הפנסים', cardNumber: 'פרק 14', cardTitle: 'מדליק הפנסים', icon: '14', enabled: true },
    { chapterFile: 'chapter-15.html', menuLabel: 'פרק 15 - הגיאוגרף', cardNumber: 'פרק 15', cardTitle: 'הגיאוגרף', icon: '15', enabled: true },
    { chapterFile: 'chapter-16.html', menuLabel: 'פרק 16 - כדור הארץ', cardNumber: 'פרק 16', cardTitle: 'כדור הארץ', icon: '16', enabled: true },
    { chapterFile: 'chapter-17.html', menuLabel: 'פרק 17 - הנחש בסהרה ושיח על בדידות', cardNumber: 'פרק 17', cardTitle: 'הנחש בסהרה ושיח על בדידות', icon: '17', enabled: true },
    { chapterFile: 'chapter-18.html', menuLabel: 'פרקים 18-19 - קולות במספר', cardNumber: 'פרקים 18-19', cardTitle: 'קולות במספר', icon: '18', enabled: true },
    { chapterFile: 'chapter-20.html', menuLabel: 'פרקים 20-21 - גן השושנים והמפגש עם השועל', cardNumber: 'פרקים 20-21', cardTitle: 'גן השושנים והמפגש עם השועל', icon: '20', enabled: true },
    { menuLabel: 'פרק 22 - פקיד הרכבת (בקרוב)', cardNumber: 'פרק 22', cardTitle: 'פקיד הרכבת', icon: '22', enabled: false },
    { menuLabel: 'פרק 23 - הרוכל (בקרוב)', cardNumber: 'פרק 23', cardTitle: 'הרוכל', icon: '23', enabled: false },
    { menuLabel: 'פרק 24 - הבאר (בקרוב)', cardNumber: 'פרק 24', cardTitle: 'הבאר', icon: '24', enabled: false },
    { menuLabel: 'פרק 25 - דלי המים (בקרוב)', cardNumber: 'פרק 25', cardTitle: 'דלי המים', icon: '25', enabled: false },
    { menuLabel: 'פרק 26 - הפרידה מן הנחש (בקרוב)', cardNumber: 'פרק 26', cardTitle: 'הפרידה מן הנחש', icon: '26', enabled: false },
    { menuLabel: 'פרק 27 - מבט אל הכוכבים (בקרוב)', cardNumber: 'פרק 27', cardTitle: 'מבט אל הכוכבים', icon: '27', enabled: false }
  ];

  function getCurrentChapterPage() {
    const match = window.location.pathname.match(/chapter-(\d{2})\.html$/);
    return match ? `chapter-${match[1]}.html` : '';
  }

  function getOptionValue(rawValue) {
    if (!rawValue) {
      return '';
    }

    const isChapterPage = window.location.pathname.includes('/chapters/');
    return isChapterPage ? rawValue : `chapters/${rawValue}`;
  }

  function resolveAssetPath(path) {
    const isChapterPage = window.location.pathname.includes('/chapters/');
    return isChapterPage ? `../${path}` : path;
  }

  function populateChapterSelect(select) {
    const currentChapterPage = getCurrentChapterPage();
    const previousValue = select.value;

    select.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'עבור/י לפרק...';
    select.appendChild(placeholder);

    chapterEntries.forEach((entry) => {
      const option = document.createElement('option');
      option.textContent = entry.menuLabel;
      option.disabled = !entry.enabled;
      option.value = entry.chapterFile ? getOptionValue(entry.chapterFile) : '';
      select.appendChild(option);
    });

    if (currentChapterPage) {
      select.value = getOptionValue(currentChapterPage);
    } else if (previousValue) {
      select.value = previousValue;
    }
  }

  function populateHomeChapterCards() {
    const isHomePage = /\/(index\.html)?$/.test(window.location.pathname);
    if (!isHomePage) {
      return;
    }

    const grid = document.querySelector('.chapters-grid');
    if (!grid) {
      return;
    }

    grid.innerHTML = '';

    chapterEntries.forEach((entry) => {
      const card = document.createElement(entry.enabled ? 'a' : 'div');
      card.className = `chapter-card ${entry.enabled ? 'active' : 'disabled'}`;

      if (entry.enabled && entry.chapterFile) {
        card.href = resolveAssetPath(`chapters/${entry.chapterFile}`);
      }

      const number = document.createElement('span');
      number.className = 'chapter-card__num';
      number.textContent = entry.cardNumber;

      const icon = document.createElement('img');
      icon.className = 'chapter-card__icon';
      icon.src = resolveAssetPath(`images/menu/${entry.icon}.png`);
      icon.alt = '';
      icon.loading = 'lazy';

      const dot = document.createElement('span');
      dot.className = 'chapter-card__dot';
      dot.innerHTML = '&#10022;';

      const title = document.createElement('span');
      title.className = 'chapter-card__title';
      title.textContent = entry.cardTitle;

      card.appendChild(number);
      card.appendChild(icon);
      card.appendChild(dot);
      card.appendChild(title);
      grid.appendChild(card);
    });
  }

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
    populateChapterSelect(select);

    select.addEventListener('change', () => {
      if (select.value) {
        window.location.href = select.value;
      }
    });
  });

  populateHomeChapterCards();
});
