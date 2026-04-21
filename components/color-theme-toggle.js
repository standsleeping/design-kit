const STORAGE_KEY = 'dk-color-theme';
const COLOR_THEMES = ['mono-purple', 'monochrome', 'solarized'];
const DEFAULT_THEME = 'mono-purple';

export const metadata = {
  name: 'ColorThemeToggle',
  description: 'Segmented toggle for color theme: mono-purple, monochrome, solarized',
  category: 'controls',
};

export const propTypes = {
  value: { type: 'enum', default: DEFAULT_THEME, options: COLOR_THEMES },
};

export const variants = [
  { name: 'mono-purple', description: 'Gray-dominant with purple accent (default)', props: { value: 'mono-purple' } },
  { name: 'monochrome', description: 'Pure greyscale, no hue', props: { value: 'monochrome' } },
  { name: 'solarized', description: 'Ethan Schoonover\'s solarized palette', props: { value: 'solarized' } },
];

function applyColorTheme(value) {
  if (value === DEFAULT_THEME) {
    document.documentElement.removeAttribute('data-color-theme');
  } else {
    document.documentElement.setAttribute('data-color-theme', value);
  }
}

export function render(props = {}) {
  let value = props.value ?? propTypes.value.default;

  const root = document.createElement('div');
  root.className = 'dk-color-theme-toggle';
  root.setAttribute('role', 'radiogroup');
  root.setAttribute('aria-label', 'Color theme');

  const buttons = COLOR_THEMES.map((theme) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dk-color-theme-toggle-btn${theme === value ? ' dk-color-theme-toggle-btn-active' : ''}`;
    btn.dataset.colorTheme = theme;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(theme === value));
    const label = theme.replace(/-/g, ' ').toUpperCase();
    btn.setAttribute('aria-label', `${label} color theme`);
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (theme === value) return;
      value = theme;
      try { localStorage.setItem(STORAGE_KEY, value); } catch {}
      applyColorTheme(value);
      for (const b of buttons) {
        const isActive = b.dataset.colorTheme === value;
        b.classList.toggle('dk-color-theme-toggle-btn-active', isActive);
        b.setAttribute('aria-checked', String(isActive));
      }
      root.dispatchEvent(new CustomEvent('color-theme-toggle:change', {
        bubbles: true,
        detail: { value },
      }));
    });
    return btn;
  });

  for (const btn of buttons) root.append(btn);
  return root;
}
