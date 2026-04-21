const STORAGE_KEY = 'dk-luminance';
const LUMINANCES = ['light', 'dark', 'auto'];

export const metadata = {
  name: 'LuminanceToggle',
  description: 'Three-state luminance toggle: light, dark, auto',
  category: 'controls',
};

export const propTypes = {
  value: { type: 'enum', default: 'auto', options: LUMINANCES },
};

export const variants = [
  { name: 'auto', description: 'Following system preference', props: { value: 'auto' } },
  { name: 'light', description: 'Light mode active', props: { value: 'light' } },
  { name: 'dark', description: 'Dark mode active', props: { value: 'dark' } },
];

function applyLuminance(value) {
  if (value === 'auto') {
    document.documentElement.removeAttribute('data-luminance');
  } else {
    document.documentElement.setAttribute('data-luminance', value);
  }
}

export function render(props = {}) {
  let value = props.value ?? propTypes.value.default;

  const root = document.createElement('div');
  root.className = 'dk-luminance-toggle';
  root.setAttribute('role', 'radiogroup');
  root.setAttribute('aria-label', 'Luminance mode');

  const buttons = LUMINANCES.map((luminance) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dk-luminance-toggle-btn${luminance === value ? ' dk-luminance-toggle-btn-active' : ''}`;
    btn.dataset.luminance = luminance;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(luminance === value));
    btn.setAttribute('aria-label', luminance === 'auto' ? 'System luminance' : `${luminance.charAt(0).toUpperCase()}${luminance.slice(1)} mode`);
    btn.textContent = luminance === 'auto' ? 'AUTO' : luminance.toUpperCase();
    btn.addEventListener('click', () => {
      if (luminance === value) return;
      value = luminance;
      try { localStorage.setItem(STORAGE_KEY, value); } catch {}
      applyLuminance(value);
      for (const b of buttons) {
        const isActive = b.dataset.luminance === value;
        b.classList.toggle('dk-luminance-toggle-btn-active', isActive);
        b.setAttribute('aria-checked', String(isActive));
      }
      root.dispatchEvent(new CustomEvent('luminance-toggle:change', {
        bubbles: true,
        detail: { value },
      }));
    });
    return btn;
  });

  for (const btn of buttons) root.append(btn);
  return root;
}
