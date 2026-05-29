# CLI Reference

The `design-kit` command generates the token artifacts, runs the audit set, and vendors tokens into consuming projects. It is installed as a project script (`uv sync`), so run it with `uv run design-kit <command>` from the design-kit repo, or `design-kit <command>` inside the activated environment.

Three commands: `build`, `audit`, `export-tokens`.

| Global flag | Default | Role |
|---|---|---|
| `--log-level` | `INFO` | One of `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` |

---

## `build`

Generate the token CSS, manifest, landing page, static pages, and components into an output directory, running the static audit set before it exits.

```bash
design-kit build [--output-dir dist] [--tokens-path tokens/design-tokens.json]
```

| Flag | Default | Role |
|---|---|---|
| `--output-dir` | `dist` | Where the generated artifacts are written |
| `--tokens-path` | `tokens/design-tokens.json` | Source token JSON |

Writes into the output directory:

| Artifact | What it is |
|---|---|
| `tokens.css` | Layered CSS (reset, tokens, defaults, utilities, components, pages, overrides) with a version header |
| `tokens.manifest.json` | `{name, version, generated_at, artifacts}`, written *after* the contrast audit passes, so it only stamps validated tokens |
| `index.html` | The landing page (foundations + navigation) |
| `*.html`, `components/` | The static pages and component modules; built component CSS is wrapped in the `components` layer, and page-local `<style>` blocks are wrapped in the `pages` layer |

`build` runs the thirteen static audits (token-pair contrast, token leak, focus ring, padding, radius, margin, and the rest) and fails with a locator report on any violation. The audit set is defined once in the audit registry that `audit` also runs, so the two cannot drift. See the README's "Build-time audits" for the full audit table.

---

## `audit`

Run the static audit set on demand and print one unified report. Exits non-zero if any audit fails, so it works as a CI gate without a full build.

```bash
design-kit audit                 # static audits of the design-kit repo, text report
design-kit audit --json          # machine-readable report (audits[] + summary)
design-kit audit --scope ../app  # audit a consumer that mirrors DIR/components + DIR/pages
design-kit audit --headless      # also run the rendered-page audits in Chromium
```

| Flag | Default | Role |
|---|---|---|
| `--scope DIR` | — | Audit a consumer tree: derives `DIR/components`, `DIR/pages`, `DIR/dist/tokens.css` |
| `--components-dir DIR` | — | Override just the component-CSS directory (globbed `*.css`, one level) |
| `--pages-dir DIR` | — | Override just the pages directory (globbed `*.html`, one level) |
| `--tokens-css PATH` | — | Override just the built `tokens.css` the contrast audit reads |
| `--json` | off | Emit the report as JSON instead of text |
| `--headless` | off | Also run the rendered-page audits in headless Chromium |

**Scope precedence**, resolved once: an explicit per-input override (`--components-dir` / `--pages-dir` / `--tokens-css`) wins; otherwise `--scope DIR` derives the three inputs; otherwise design-kit's own `components/`, `pages/`, `dist/tokens.css`. A missing input reports `SKIP`, not a false pass. The overrides exist because real consumers rarely mirror DK's layout (one may keep a single flat CSS file; another may nest its component CSS under a static directory).

`--headless` adds the rendered-page audits (horizontal overflow, ResponsiveTable behavior) against the built site: `DIR` under `--scope`, otherwise `dist/`. They report `SKIP` (never failure) when the site, Playwright, or Chromium is absent, so a token-only run still completes. The static override flags do not retarget the served site.

```bash
# Lint a consumer's component CSS where it actually lives, against its vendored tokens:
design-kit audit \
  --components-dir ../my-app/src/static/shared/components \
  --tokens-css ../my-app/path/to/vendored/tokens.css
```

---

## `export-tokens`

Copy the built `tokens.css` and `tokens.manifest.json` into a consuming project's vendor directory, creating it if needed. This is the token-distribution mechanism: a consumer vendors the tokens rather than copy-pasting, and re-runs this to update.

```bash
design-kit export-tokens --to PATH [--source-dir dist]
```

| Flag | Default | Role |
|---|---|---|
| `--to PATH` | *(required)* | Target directory for `tokens.css` and `tokens.manifest.json` |
| `--source-dir` | `dist` | Source directory holding the built tokens |

`design-kit build` must have run first; if the source files are missing, the command fails with an error pointing at `build`. The manifest carries an integrity record:

```json
{
  "name": "design-kit-tokens",
  "version": "0.1.0",
  "generated_at": "2026-05-21T19:54:09+00:00",
  "artifacts": { "tokens.css": { "sha256": "…", "bytes": 19845 } }
}
```

```bash
cd ~/Developer/design-kit
design-kit build
design-kit export-tokens --to ~/some-consumer/vendor/dk
```

---

## See also

- [Getting started](../guides/getting-started.md): uses `build` + `export-tokens` to vendor the tokens.
- README "Build-time audits", "The audit command", "Headless audits": the full lint and rendered-audit tables.
