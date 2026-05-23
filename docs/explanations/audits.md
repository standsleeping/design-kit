# The Audit Set

This page explains what the audit set is and why it exists. For how to run it, see the [CLI reference](../reference/cli.md).

## The premise: enforce, don't review

The design system is a large set of rules: square corners, square padding, no layout margins, semantic tokens only, thin borders, focus rings drawn inside clipped containers, stable scrollbar gutters, no page-level horizontal scroll, and more. Many of these are checkable mechanically. Anything checkable should be enforced by tooling rather than by remembering to look, because manual inspection does not scale and drifts the moment attention lapses. The audit set is that tooling: it turns the visual language's checkable subset into assertions that fail a build.

Each audit names the principle it enforces and, where exceptions are legitimate, recognizes an allowlist comment (for example `/* token-leak: ok */`) so a deliberate deviation is documented in place rather than silently tolerated.

## Two kinds of check

**Static audits** need no browser and are fast. Twelve are *lints*: text-scanning regex checks over CSS and HTML (raw-literal leaks, asymmetric padding, non-zero radius, layout margins, focus-ring placement, scroll-axis misuse, the page contract, and the rest). The thirteenth is the token-pair contrast check, a token-graph check over the generated `tokens.css` rather than a text lint. These run on every `design-kit build` and on demand via `design-kit audit`.

**Headless audits** measure things that only exist in a rendered page: horizontal overflow at several widths, and the responsive-table component's behavior across its modes. These run in headless Chromium, added with `design-kit audit --headless`. When the browser or the served site is unavailable they report `SKIP`, never a false failure, so a token-only environment still completes.

## One registry, two callers, no drift

The audits are defined once, in a data-driven registry. Both `design-kit build` and `design-kit audit` run that same registry, so the build gate and the on-demand command can never disagree about what "passing" means. The headless audits follow the same discipline: each is one spec, run both from the CLI and from the pytest suite, so CI and the command share a single source. Adding a new audit category is a single registry entry, not a change in several places.

Every audit, static or headless, normalizes to a uniform outcome: a status, the findings with their locations, and a remediation hint. That uniformity is what lets one command print one report and exit non-zero if anything failed.

## Retargetable at any project

An audit carries its inputs in a scope rather than hard-coding design-kit's own paths, so the same checks run against any consuming tree. `--scope DIR` points them at `DIR/components` and `DIR/pages`; per-input overrides (`--components-dir`, `--pages-dir`, `--tokens-css`) retarget a project whose files do not mirror that layout. A missing input reports `SKIP`, so a project gets a clean report over exactly the inputs it has. This is what makes the visual language portable: a new project enforces the identical rules on its own code (see [starting a new project](../guides/new-project.md)).

## Further reading

- [CLI reference](../reference/cli.md): `audit` flags and scope precedence.
- [Responsive audit](../reference/responsive-audit.md): the manual per-component status tracker that complements the headless `overflow` check.
- README "Build-time audits", "The audit command", "Headless audits": the full lint and rendered-audit tables.
- `AUTO_VERIFICATION`, `TEST_INTEGRATION` in system-principles: the enforce-don't-review premise.
