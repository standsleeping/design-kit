export const metadata = {
  name: 'CodeBlock',
  description: 'Code block with copy button and optional language tabs',
  category: 'content',
};

export const propTypes = {
  code: { type: 'string', default: '' },
  sources: { type: 'object', default: null },
  languages: { type: 'array', default: [] },
  activeLanguage: { type: 'string', default: '' },
};

export const variants = [
  {
    name: 'single',
    description: 'One snippet, no language tabs',
    props: {
      code: 'const greet = (name) => `Hello, ${name}!`;\ngreet(\'world\');',
    },
  },
  {
    name: 'multi-language',
    description: 'Two language tabs',
    props: {
      activeLanguage: 'python',
      sources: {
        python: "def greet(name):\n    return f'Hello, {name}!'\n\ngreet('world')",
        typescript: "const greet = (name: string) => `Hello, ${name}!`;\ngreet('world');",
      },
    },
  },
  {
    name: 'three-tabs',
    description: 'Three languages with explicit labels',
    props: {
      activeLanguage: 'sh',
      languages: [
        { id: 'sh', label: 'Shell' },
        { id: 'js', label: 'JavaScript' },
        { id: 'py', label: 'Python' },
      ],
      sources: {
        sh: 'curl -sS https://example.com/api | jq .',
        js: "fetch('https://example.com/api').then(r => r.json())",
        py: "import requests; requests.get('https://example.com/api').json()",
      },
    },
  },
];

function resolveLanguages(props) {
  if (props.languages && props.languages.length > 0) {
    return props.languages.map((l) => ({ id: l.id, label: l.label ?? l.id }));
  }
  if (props.sources && typeof props.sources === 'object') {
    return Object.keys(props.sources).map((id) => ({ id, label: id }));
  }
  return [];
}

function pickCode(activeLanguage, props) {
  if (props.sources && activeLanguage && props.sources[activeLanguage] != null) {
    return props.sources[activeLanguage];
  }
  return props.code ?? '';
}

export function render(props = {}) {
  const languages = resolveLanguages(props);
  let activeLanguage = props.activeLanguage ?? languages[0]?.id ?? '';

  const root = document.createElement('div');
  root.className = 'dk-code-block';

  const header = document.createElement('div');
  header.className = 'dk-code-block-header';

  let tabButtons = [];
  if (languages.length > 1) {
    const tabs = document.createElement('div');
    tabs.className = 'dk-code-block-tabs';
    tabs.setAttribute('role', 'tablist');
    languages.forEach((lang, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dk-code-block-tab${lang.id === activeLanguage ? ' dk-code-block-tab-active' : ''}`;
      btn.dataset.lang = lang.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(lang.id === activeLanguage));
      btn.textContent = lang.label;
      btn.addEventListener('click', () => {
        if (lang.id === activeLanguage) return;
        activeLanguage = lang.id;
        for (const b of tabButtons) {
          const isActive = b.dataset.lang === activeLanguage;
          b.classList.toggle('dk-code-block-tab-active', isActive);
          b.setAttribute('aria-selected', String(isActive));
        }
        codeEl.textContent = pickCode(activeLanguage, props);
        root.dispatchEvent(new CustomEvent('code-block:language-change', {
          bubbles: true,
          detail: { language: activeLanguage },
        }));
      });
      tabButtons.push(btn);
      tabs.append(btn);
      if (i < languages.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'dk-code-block-separator';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '\u00B7';
        tabs.append(sep);
      }
    });
    header.append(tabs);
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'dk-code-block-toolbar';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'dk-code-block-copy';
  copyBtn.setAttribute('aria-label', 'Copy code');
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    const text = codeEl.textContent ?? '';
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('dk-code-block-copy-copied');
      setTimeout(() => {
        copyBtn.textContent = original;
        copyBtn.classList.remove('dk-code-block-copy-copied');
      }, 1500);
    });
  });
  toolbar.append(copyBtn);

  header.append(toolbar);
  root.append(header);

  const pre = document.createElement('pre');
  pre.className = 'dk-code-block-pre';
  const codeEl = document.createElement('code');
  codeEl.className = 'dk-code-block-code';
  codeEl.textContent = pickCode(activeLanguage, props);
  pre.append(codeEl);
  root.append(pre);

  return root;
}
