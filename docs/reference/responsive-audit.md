# Responsive Audit

The responsive status of every component, tracked over time. A component passes when, as its box narrows, it either **relayouts** (reflow, wrap, or switch mode) or **shows less** (hides lower-priority content) — and never overflows, clips, or crushes.

This is the manual counterpart to the headless `overflow` audit (see [audits](../explanations/audits.md)): the overflow audit asserts no page scrolls horizontally; this table records whether each component degrades *gracefully* on the way there. The underlying principle is `RESPONSIVE_COMPONENTS` in system-principles ("rank information by priority; lower-priority items hide before higher-priority items truncate") and the visual language's [responsive component](visual-language.md) guidance.

## How components respond

Responsiveness here is keyed to a component's **own box**, not the viewport. Three mechanisms carry it:

- **Container-intrinsic** — `@container` queries or a `ResizeObserver` measure the component's width and reflow or drop content. Used by the adaptive components.
- **Flow** — `flex-wrap`, `grid auto-fit`, `text-overflow: ellipsis`, or an overflow scroller absorb the shrink without measuring anything.
- **Viewport** — `@media` queries. Reserved for layout shells and page chrome, where the box *is* the viewport.

## Verdict legend

| Mark | Verdict | Meaning |
|---|---|---|
| `✓✓` | Adaptive | Actively shows less or switches layout as its box narrows (priority hiding, mode switch, container query). |
| `✓` | Fluid | Reflows safely (wrap / ellipsis / scroll / fill) without overflow, but does not drop content by priority. |
| `—` | Atomic | A compact control whose size is intentionally fixed; the test does not apply. |
| `⚠` | At risk | Overflows, clips, or crushes at narrow widths — or depends on responsive wiring the consumer must supply. |

## Status table

| Component | Status | How it adapts | Open issue |
|---|---|---|---|
| AdaptiveMetricsList | `✓✓` Adaptive | ResizeObserver hides columns by priority (narrow <360, medium <520) | — |
| AppShell | `✓✓` Adaptive | `installResponsiveRails`: a `ResizeObserver` collapses rails declared with `data-collapse-below` / `data-collapse-to` (`icon` or `hidden`), reusing the Sidebar's own states | Opt-in. A shell whose rails carry no `data-collapse-*` still keeps both rails fixed (a consumer must opt in). |
| BottomTabBar | `⚠` At risk | Tabs `flex:1` share the width | Labels are centered with no ellipsis/nowrap; they clip with many or long labels. |
| Breadcrumb | `⚠` At risk | `flex-wrap`; crumbs `nowrap` | Wraps to extra rows instead of collapsing the middle (the canonical breadcrumb "show less"). |
| Button | `—` Atomic | `inline-flex`, `min-width-md` floor, label may wrap | — |
| Checkbox | `—` Atomic | Fixed `xs` box | — |
| CheckboxNumber | `—` Atomic | `inline-flex` gap | — |
| CodeBlock | `⚠` At risk | Body `pre` scrolls horizontally (correct) | Header (tabs + toolbar) has no wrap; tabs and the copy button collide and overflow at narrow widths. |
| CollapsibleSection | `✓` Fluid | Title `flex:1`; content collapses to header | — |
| ColorThemeToggle | `✓` Fluid | `flex-wrap`: buttons wrap to extra rows when the container is narrower than the row | — |
| Container | `✓` Fluid | `width:100%` / centered `minmax(0, max)` grid | — |
| ExpandableCard | `✓` Fluid | Header `grid auto minmax(0,1fr) auto`; title ellipsizes | — |
| FieldRow | `✓` Fluid | `grid minmax(0,1fr) auto`; label ellipsizes; control `max-width` capped | — |
| FormLayout | `⚠` At risk | `grid` with a fixed `--dk-form-columns` (default 2) | No `auto-fit`; columns never collapse to one, so cells shrink to nothing. Should mirror TitleBlock's `auto-fit minmax`. |
| Icon | `—` Atomic | em/fixed SVG | — |
| IconButton | `—` Atomic | Fixed square sizes | — |
| LuminanceToggle | `✓` Fluid | `flex-wrap`: buttons wrap to extra rows when the container is narrower than the row | — |
| MenuItem | `✓` Fluid | Label ellipsizes, icon fixed, full-width row | — |
| MetricsCard | `✓` Fluid | `flex-wrap`, items wrap to rows | — |
| Modal | `⚠` At risk | `max-height:80vh` + content scroll; title ellipsizes | No `max-width` or responsive width; JS clamps position only, so it can exceed a narrow viewport. |
| NavRow | `✓✓` Adaptive | `@container (max-width)` drops trailing meta to its own full-width row | — |
| NavStack | `✓✓` Adaptive | expanded ↔ icon (labels become single-letter), drilldown, labels ellipsize | — |
| NumberInput | `—` Atomic | Fixed compact width (`xs`) | — |
| PageNav | `✓` Fluid | `space-between`; each link `max-width:50% min-width:0` | — |
| Range | `✓` Fluid | input `flex:1`; value `3ch` | `min-width: control-input-width-lg` floor can overflow a narrower host. |
| ReadingPositionNav | `✓` Fluid | absolute overlay, `max-width` content-track, items empty-collapse | — |
| ResponsiveTable | `✓✓` Adaptive | ResizeObserver: priority column-hide (<360/<600), card-stack fallback, h-scroll affordance, line-clamp, sidenote inline → bottom-sheet | — |
| ScrollList | `✓` Fluid | Vertical scroll (boundary-rail); long labels wrap | — |
| SearchInput | `✓` Fluid | `width:100%` fills container | `min-width: control-input-width-md` floor can overflow a sub-md container. |
| SegmentedToggle | `⚠` At risk | None — `inline-flex`, no wrap, `padding lg` | Content-sized with no shrink/wrap/truncate; overflows a narrow host. Safe only for 2–3 short options. |
| Select | `✓` Fluid | `width:100%` fills container | Same `min-width-md` floor as SearchInput. |
| SessionStatsFooter | `⚠` At risk | `flex-wrap` | Designed to sit in a fixed-height chrome rail; wrapped rows are clipped there (hides by clipping, not by priority). Wraps fine standalone. |
| Sidebar | `✓` Fluid | expanded → icon → hidden + overlay mode, width transitions | Relayouts fully when its state is driven; AppShell's `installResponsiveRails` now supplies that trigger. No self-trigger by design (a Sidebar does not know its container's budget). |
| StickyToc | `✓✓` Adaptive | `@media`: collapsible top-bar (narrow) ↔ fixed left rail (wide); current item ellipsizes | — |
| TabBar | `✓` Fluid | `flex-wrap`, tabs wrap to rows | — |
| TextInput | `✓` Fluid | `width:100%` fills container | Same `min-width-md` floor as SearchInput. |
| TitleBlock | `✓` Fluid | meta `grid auto-fit minmax(100px,1fr)` reflows column count | — |
| Toc | `✓` Fluid | Links wrap; level indent | — |
| Topbar | `✓` Fluid | Title slot `flex:1 min-width:0` ellipsis (the "give"); bounded controls | — |

## Open items

Worklist for the `⚠` rows, ordered by impact. Check off as each is resolved and flip the row's status above.

**P1 — center-crush and clipped chrome** (done)

- [x] **AppShell** — `installResponsiveRails(shell)` collapses rails by width via a `ResizeObserver`; the storybook wires its nav to `icon` below 900 and its inspector to `hidden` below 1100, so the center keeps usable width instead of crushing to zero.
- [x] **ColorThemeToggle** — `flex-wrap: wrap` so the button row reflows instead of overflowing.
- [x] **LuminanceToggle** — `flex-wrap: wrap` (same fix).

**P2 — overflow instead of adapt**

- [ ] **FormLayout** — switch the fixed column count to `auto-fit minmax(...)` so it collapses to one column.
- [ ] **SegmentedToggle** — wrap or scroll when the options exceed the host width.
- [ ] **CodeBlock** — let the header tabs/toolbar wrap or scroll independently of the body.
- [ ] **Modal** — cap width responsively (`max-width` against the viewport) so a wide modal cannot overflow a narrow screen.
- [ ] **SessionStatsFooter** — drop or ellipsize items by priority when hosted in a no-give rail, rather than wrapping into clipped rows.
- [ ] **BottomTabBar** — ellipsize or constrain labels so they do not clip when tabs are many or long.

**P3 — minor**

- [ ] **Input min-width floors** (TextInput, SearchInput, Select, Range) — the `min-width` floor can exceed a narrow container; allow the floor to relax below its set width.
- [ ] **Breadcrumb** — collapse the middle (ellipsis) instead of wrapping to extra rows.

## Reference patterns

The adaptive components are the templates the `⚠` rows should borrow from:

- **ResponsiveTable** and **AdaptiveMetricsList** — `ResizeObserver` + priority-ranked column hiding.
- **AppShell** (`installResponsiveRails`) — `ResizeObserver` collapses whole rails (`data-collapse-below` / `data-collapse-to`) so the center column never crushes.
- **NavStack** and **Sidebar** — discrete expanded/icon/hidden modes (the states `installResponsiveRails` drives).
- **NavRow** — `@container` query for a single reflow decision.
- **StickyToc** — `@media` mode switch for page-level chrome.
