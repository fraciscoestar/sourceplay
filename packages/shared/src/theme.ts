export function initTheme(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    if (themeParam === 'dark' || themeParam === 'light') {
      localStorage.setItem('sourceplay-theme', themeParam);
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  const savedTheme = localStorage.getItem('sourceplay-theme');
  let isDark = false;
  if (savedTheme === 'dark') {
    isDark = true;
  } else if (savedTheme === 'light') {
    isDark = false;
  } else {
    // Auto-detect based on system preferences
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    document.documentElement.classList.add('dark-theme');
    document.documentElement.classList.remove('light-theme');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.add('light-theme');
    document.documentElement.classList.remove('dark-theme');
    document.documentElement.style.colorScheme = 'light';
  }

  // Listen to changes in system theme dynamically
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('sourceplay-theme')) {
      const dark = e.matches;
      if (dark) {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.style.colorScheme = 'light';
      }
    }
  });

  // Remove no-transition class after rendering has stabilized
  const removeTransitionsClass = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('sp-no-transition');
      });
    });
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', removeTransitionsClass);
  } else {
    removeTransitionsClass();
  }
}

export function toggleTheme(): void {
  const isDark = document.documentElement.classList.contains('dark-theme');
  if (isDark) {
    document.documentElement.classList.remove('dark-theme');
    document.documentElement.classList.add('light-theme');
    document.documentElement.style.colorScheme = 'light';
    localStorage.setItem('sourceplay-theme', 'light');
  } else {
    document.documentElement.classList.remove('light-theme');
    document.documentElement.classList.add('dark-theme');
    document.documentElement.style.colorScheme = 'dark';
    localStorage.setItem('sourceplay-theme', 'dark');
  }
}
