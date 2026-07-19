import { toggleTheme } from './theme';

function getRootUrl(): string {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  // If we are in dev mode and not on the selector port (5173), point back to selector
  if (isLocalhost && window.location.port !== '5173') {
    return 'http://localhost:5173/';
  }
  return '../../';
}

export function createHeader(options: { showBackButton: boolean; title?: string }): void {
  const header = document.createElement('header');
  header.className = 'sp-header';

  const leftDiv = document.createElement('div');
  leftDiv.className = 'sp-header-left';

  const appendThemeParam = (element: HTMLAnchorElement) => {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      const currentTheme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
      const url = new URL(element.href, window.location.href);
      url.searchParams.set('theme', currentTheme);
      window.location.href = url.toString();
    });
  };

  if (options.showBackButton) {
    const backBtn = document.createElement('a');
    backBtn.href = getRootUrl();
    backBtn.className = 'sp-back-btn';
    backBtn.textContent = '← Menú';
    appendThemeParam(backBtn);
    leftDiv.appendChild(backBtn);
  }

  if (options.title) {
    // Game title — non-clickable label in the nav
    const titleSpan = document.createElement('span');
    titleSpan.className = 'sp-game-title';
    titleSpan.textContent = options.title;
    leftDiv.appendChild(titleSpan);
  } else {
    // Selector: show the SourcePlay logo link
    const logo = document.createElement('a');
    logo.href = getRootUrl();
    logo.className = 'sp-logo-link';
    logo.textContent = 'SourcePlay';
    appendThemeParam(logo);
    leftDiv.appendChild(logo);
  }

  header.appendChild(leftDiv);

  // Theme toggle button with Lucide Sun and Moon SVGs
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'sp-theme-toggle';
  toggleBtn.setAttribute('aria-label', 'Cambiar Tema');
  toggleBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-sun">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2"/>
      <path d="M12 20v2"/>
      <path d="m4.93 4.93 1.41 1.41"/>
      <path d="m17.66 17.66 1.41 1.41"/>
      <path d="M2 12h2"/>
      <path d="M20 12h2"/>
      <path d="m6.34 17.66-1.41 1.41"/>
      <path d="m19.07 4.93-1.41 1.41"/>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-moon">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  `;
  toggleBtn.addEventListener('click', () => {
    toggleTheme();
  });

  header.appendChild(toggleBtn);

  // Inject at the very beginning of the body
  if (document.body.firstChild) {
    document.body.insertBefore(header, document.body.firstChild);
  } else {
    document.body.appendChild(header);
  }
}
