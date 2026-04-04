"""Generate a dedicated component explorer page."""


def generate_components_preview_html() -> str:
    """Return a complete HTML page for component-focused previewing."""
    return """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Design Kit Components</title>
  <link rel="stylesheet" href="tokens.css">
  <!-- Recursive variable font (canonical URL in token_css.py:GOOGLE_FONTS_LINK) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      background: var(--color-bg);
    }
    .viewer {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 260px minmax(420px, 1fr) 340px;
    }
    .panel {
      min-width: 0;
      border-right: 1px solid var(--color-border);
      background: var(--color-bg);
    }
    .panel:last-child {
      border-right: none;
      border-left: 1px solid var(--color-border);
    }
    .panel-header {
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--color-border);
    }
    .panel-body {
      padding: var(--spacing-lg) var(--spacing-xl);
      overflow: auto;
      max-height: calc(100vh - 45px);
    }
    .section-title {
      margin: 0 0 var(--spacing-sm) 0;
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
    }
    .viewer-name {
      margin: 0 0 var(--spacing-xs) 0;
      font-family: var(--typography-mono);
      font-size: var(--font-size-base);
      color: var(--color-text);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
    }
    .viewer-desc {
      margin: 0 0 var(--spacing-lg) 0;
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }
    #component-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .component-item {
      width: 100%;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-muted);
      text-align: left;
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      padding: var(--spacing-sm) var(--spacing-md);
      cursor: pointer;
    }
    .component-item:hover {
      background: var(--color-hover-bg);
      color: var(--color-text);
    }
    .component-item.active {
      border-color: var(--color-link);
      background: var(--color-focus-ring-light);
      color: var(--color-link);
    }
    .controls {
      display: grid;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-code-bg);
    }
    .control-row {
      display: grid;
      grid-template-columns: 64px 1fr 72px;
      align-items: center;
      gap: var(--spacing-sm);
    }
    .control-row label {
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: var(--font-letter-spacing-wide);
    }
    .control-row input[type="number"] {
      width: 72px;
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg);
      padding: var(--spacing-xs) var(--spacing-sm);
    }
    #preview-frame {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-lg);
      min-width: 120px;
      min-height: 80px;
      max-width: 100%;
      max-height: 72vh;
      overflow: auto;
      resize: both;
      background: var(--color-bg);
    }
    #variants-grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    .variant-btn {
      border: 1px dashed var(--color-border);
      background: var(--color-code-bg);
      color: var(--color-text);
      border-radius: var(--radius-sm);
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      cursor: pointer;
    }
    .variant-btn:hover {
      border-color: var(--color-link);
    }
    .prop-row {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: var(--spacing-sm);
      align-items: center;
      margin-bottom: var(--spacing-sm);
    }
    .prop-name {
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .prop-input {
      width: 100%;
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg);
      padding: var(--spacing-xs) var(--spacing-sm);
    }
    .meta-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--spacing-xs) var(--spacing-sm);
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
    }
    .meta-k { color: var(--color-text-muted); }
    .meta-v { color: var(--color-text); }
    .event-log {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-code-bg);
      max-height: 240px;
      overflow: auto;
      font-family: var(--typography-mono);
      font-size: var(--font-size-xs);
    }
    .event-log-empty {
      color: var(--color-text-muted);
      padding: var(--spacing-sm) var(--spacing-md);
    }
    .event-log-row {
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text);
      line-height: var(--font-line-height-base);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .event-log-row:last-child {
      border-bottom: none;
    }
    .event-log-event {
      color: var(--color-link);
      margin-right: var(--spacing-sm);
    }
    .event-log-target {
      color: var(--color-text-muted);
      margin-right: var(--spacing-sm);
    }
    @media (max-width: 1100px) {
      .viewer {
        grid-template-columns: 220px 1fr;
      }
      .panel:last-child {
        grid-column: 1 / -1;
        border-left: none;
        border-top: 1px solid var(--color-border);
      }
    }
  </style>
</head>
<body>
  <div class="viewer">
    <aside class="panel">
      <div class="panel-header">Components</div>
      <div class="panel-body">
        <div id="component-list"></div>
      </div>
    </aside>
    <main class="panel">
      <div class="panel-header">Live Preview</div>
      <div class="panel-body">
        <h1 id="viewer-name" class="viewer-name">Component Explorer</h1>
        <p id="viewer-desc" class="viewer-desc">Select a component from the left panel.</p>
        <div class="controls">
          <div class="control-row">
            <label for="width-range">Width</label>
            <input id="width-range" type="range" min="120" max="900" value="360">
            <input id="width-number" type="number" min="120" max="900" value="360">
          </div>
          <div class="control-row">
            <label for="height-range">Height</label>
            <input id="height-range" type="range" min="80" max="640" value="220">
            <input id="height-number" type="number" min="80" max="640" value="220">
          </div>
          <div class="control-divider" style="border-top: 1px solid var(--color-border); margin: var(--spacing-sm) 0;"></div>
          <div class="control-row">
            <label for="mono-range">MONO</label>
            <input id="mono-range" type="range" min="0" max="1" step="1" value="1">
            <input id="mono-number" type="number" min="0" max="1" step="1" value="1">
          </div>
          <div class="control-row">
            <label for="casl-range">CASL</label>
            <input id="casl-range" type="range" min="0" max="1" step="0.1" value="0">
            <input id="casl-number" type="number" min="0" max="1" step="0.1" value="0">
          </div>
          <div class="control-row">
            <label for="slnt-range">slnt</label>
            <input id="slnt-range" type="range" min="-15" max="0" step="1" value="0">
            <input id="slnt-number" type="number" min="-15" max="0" step="1" value="0">
          </div>
          <div class="control-row">
            <label for="crsv-range">CRSV</label>
            <input id="crsv-range" type="range" min="0" max="1" step="0.5" value="0.5">
            <input id="crsv-number" type="number" min="0" max="1" step="0.5" value="0.5">
          </div>
        </div>
        <div id="preview-frame"></div>
        <h2 class="section-title" style="margin-top: var(--spacing-xl);">Common Configurations</h2>
        <div id="variants-grid"></div>
      </div>
    </main>
    <aside class="panel">
      <div class="panel-header">Inspector</div>
      <div class="panel-body">
        <h2 class="section-title">Props</h2>
        <div id="props-editor"></div>
        <h2 class="section-title" style="margin-top: var(--spacing-xl);">Metadata</h2>
        <div id="meta-grid" class="meta-grid"></div>
        <h2 class="section-title" style="margin-top: var(--spacing-xl);">Event Log</h2>
        <div id="event-log" class="event-log">
          <div class="event-log-empty">Interact with the preview to inspect events.</div>
        </div>
      </div>
    </aside>
  </div>
  <script type="module" src="components/component-preview.js"></script>
</body>
</html>
"""
