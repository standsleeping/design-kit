const STORAGE_KEY = 'dk-theme';
const THEMES = ['light', 'dark', 'auto'];

export const metadata = {
  name: 'ThemeToggle',
  description: 'Three-state theme toggle: light, dark, auto',
  category: 'controls',
};

export const propTypes = {
  value: { type: 'enum', default: 'auto', options: THEMES },
};

export const variants = [
  { name: 'auto', description: 'Following system preference', props: { value: 'auto' } },
  { name: 'light', description: 'Light mode active', props: { value: 'light' } },
  { name: 'dark', description: 'Dark mode active', props: { value: 'dark' } },
];

function applyTheme(value) {
  if (value === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', value);
  }
}

export function render(props = {}) {
  let value = props.value ?? propTypes.value.default;

  const root = document.createElement('div');
  root.className = 'dk-theme-toggle';
  root.setAttribute('role', 'radiogroup');
  root.setAttribute('aria-label', 'Color theme');

  const buttons = THEMES.map((theme) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dk-theme-toggle-btn${theme === value ? ' dk-theme-toggle-btn-active' : ''}`;
    btn.dataset.theme = theme;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(theme === value));
    btn.setAttribute('aria-label', theme === 'auto' ? 'System theme' : `${theme.charAt(0).toUpperCase()}${theme.slice(1)} theme`);
    btn.textContent = theme === 'auto' ? 'AUTO' : theme.toUpperCase();
    btn.addEventListener('click', () => {
      if (theme === value) return;
      value = theme;
      try { localStorage.setItem(STORAGE_KEY, value); } catch {}
      applyTheme(value);
      for (const b of buttons) {
        const isActive = b.dataset.theme === value;
        b.classList.toggle('dk-theme-toggle-btn-active', isActive);
        b.setAttribute('aria-checked', String(isActive));
      }
      root.dispatchEvent(new CustomEvent('theme-toggle:change', {
        bubbles: true,
        detail: { value },
      }));
    });
    return btn;
  });

  for (const btn of buttons) root.append(btn);
  return root;
}
