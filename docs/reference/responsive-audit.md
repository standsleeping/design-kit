# Responsive Audit

The responsive status of every component, tracked over time. A component passes when, as its box narrows, it either **relayouts** (reflow, wrap, or switch mode) or **shows less** (hides lower-priority content) — and never overflows, clips, or crushes.

This is the manual counterpart to the headless `overflow` audit (see [audits](../explanations/audits.md)): the overflow audit asserts no page scrolls horizontally; this table records whether each component degrades *gracefully* on the way there. The underlying principle is `RESPONSIVE_COMPONENTS` in system-principles ("rank information by priority; lower-priority items hide before higher-priority items truncate") and the visual language's [responsive component](visual-language.md) guidance.

Two automated headless checks back this table so its verdicts can't silently rot:

- **Fits its own box** (every component) — `pages/responsive-fit-tests.html` renders *every* component variant into a width-controlled box at narrow widths and asserts the box never overflows: the component fits, reflows, or scrolls internally, but never spills past its own box. This generalizes the storybook resize test into a guard, catching any component that relies on its host to constrain its width (the Topbar class of bug) rather than capping itself. The `component-fit` spec runs it (and `tests/test_responsive_fit.py`). Components whose width is intentionally design-bounded (a Sidebar's `--dk-sidebar-width`, collapsed by its host, not by self-shrinking) are listed in the page's `MIN_WIDTH` allowlist with their rationale.
- **Adapts on mount** (the JS-driven `✓✓` components) — `pages/responsive-adaptive-tests.html` mounts SessionStatsFooter, Breadcrumb, and AdaptiveMetricsList at controlled widths and asserts each actively adapts (priority-drop, middle-collapse, column-hide) *on mount*. The `adaptive-behavior` spec runs it (and `tests/test_adaptive_behavior.py`). This catches a self-wired ResizeObserver that fails to adapt after attach.

Both run under `design-kit audit --headless`. The fit check is the broad net; the adaptive check verifies the harder behaviors the fit check can't see (showing *less*, not just fitting).

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
| BottomTabBar | `✓` Fluid | Tabs `flex:1` share the width; labels ellipsize (`min-width:0` + dedicated label span) | — |
| Breadcrumb | `✓✓` Adaptive | `installBreadcrumbCollapse` (self-wired in `render`): a `ResizeObserver` collapses the middle crumbs to a single `…`, keeping first + last on one row | — |
| Button | `—` Atomic | `inline-flex`, `min-width-md` floor, label may wrap | — |
| Checkbox | `—` Atomic | Fixed `xs` box | — |
| CheckboxNumber | `—` Atomic | `inline-flex` gap | — |
| CodeBlock | `✓` Fluid | Body `pre` scrolls horizontally; header tabs strip scrolls independently (`min-width:0; overflow-x:auto`) while the toolbar/copy button stays fixed (`flex-shrink:0`) | — |
| CollapsibleSection | `✓` Fluid | Title `flex:1`; content collapses to header | — |
| ColorThemeToggle | `✓` Fluid | `flex-wrap`: buttons wrap to extra rows when the container is narrower than the row | — |
| Container | `✓` Fluid | `width:100%` / centered `minmax(0, max)` grid | — |
| ExpandableCard | `✓` Fluid | Header `grid auto minmax(0,1fr) auto`; title ellipsizes | — |
| FieldRow | `✓` Fluid | `grid minmax(0,1fr) minmax(0,auto)`; label ellipsizes; control has `min-width:0` so a floored control (e.g. Range) shrinks to its cell instead of overflowing | — |
| FormLayout | `✓` Fluid | `grid auto-fit minmax(100px,1fr)` reflows the column count, collapsing to one (mirrors TitleBlock's meta grid) | — |
| Icon | `—` Atomic | em/fixed SVG | — |
| IconButton | `—` Atomic | Fixed square sizes | — |
| LuminanceToggle | `✓` Fluid | `flex-wrap`: buttons wrap to extra rows when the container is narrower than the row | — |
| MenuItem | `✓` Fluid | Label ellipsizes, icon fixed, full-width row | — |
| MetricsCard | `✓` Fluid | `flex-wrap`, items wrap to rows | — |
| Modal | `✓` Fluid | `max-width: calc(100% - 2*spacing-2xl)` caps width to the frame; `max-height:80vh` + content scroll; title ellipsizes | — |
| NavRow | `✓✓` Adaptive | `@container (max-width)` drops trailing meta to its own full-width row | — |
| NavStack | `✓✓` Adaptive | expanded ↔ icon (labels become single-letter), drilldown, labels ellipsize | — |
| NumberInput | `—` Atomic | Fixed compact width (`xs`) | — |
| PageNav | `✓` Fluid | `space-between`; each link `max-width:50% min-width:0` | — |
| Range | `✓` Fluid | input `flex:1`; value `3ch`; min-width floors relaxed via `min(…, 100%)` | — |
| ReadingPositionNav | `✓` Fluid | absolute overlay, `max-width` content-track, items empty-collapse | — |
| ResponsiveTable | `✓✓` Adaptive | ResizeObserver: priority column-hide (<360/<600), card-stack fallback, h-scroll affordance, line-clamp, sidenote inline → bottom-sheet | — |
| ScrollList | `✓` Fluid | Vertical scroll (bar hidden per SCROLLBAR_HIDDEN_BY_DEFAULT); long labels wrap | — |
| SearchInput | `✓` Fluid | `width:100%` fills container; min-width floor relaxed via `min(…, 100%)` | — |
| SegmentedToggle | `✓` Fluid | Joined-segment row scrolls horizontally (`overflow-x:auto`, bar hidden per SCROLLBAR_HIDDEN_BY_DEFAULT); buttons never shrink | — |
| Select | `✓` Fluid | `width:100%` fills container; min-width floor relaxed via `min(…, 100%)` | — |
| SessionStatsFooter | `✓✓` Adaptive | `installResponsiveStats` (self-wired in `render`): a `ResizeObserver` drops items by `data-priority` on a single row (keeps on/off/scroll), hiding orphan separators too | — |
| Sidebar | `✓` Fluid | expanded → icon → hidden + overlay mode, width transitions | Relayouts fully when its state is driven; AppShell's `installResponsiveRails` now supplies that trigger. No self-trigger by design (a Sidebar does not know its container's budget). |
| StickyToc | `✓✓` Adaptive | `@media`: collapsible top-bar (narrow) ↔ fixed left rail (wide); current item ellipsizes | — |
| TabBar | `✓` Fluid | `flex-wrap`, tabs wrap to rows | — |
| TextInput | `✓` Fluid | `width:100%` fills container; min-width floor relaxed via `min(…, 100%)` | — |
| TitleBlock | `✓` Fluid | meta `grid auto-fit minmax(100px,1fr)` reflows column count | — |
| Toc | `✓` Fluid | Links wrap; level indent | — |
| Topbar | `✓` Fluid | `max-width:100%` caps the bar to its own box (ellipsizes in any content-sized context, not only when a host hands it a width); title `flex:1 1 auto` keeps an intrinsic basis and the subtitle (high `flex-shrink`) yields first, so the title stays legible longest (priority order) | — |

## Open items

Worklist for the `⚠` rows, ordered by impact. Check off as each is resolved and flip the row's status above.

**P1 — center-crush and clipped chrome** (done)

- [x] **AppShell** — `installResponsiveRails(shell)` collapses rails by width via a `ResizeObserver`; the storybook wires its nav to `icon` below 900 and its inspector to `hidden` below 1100, so the center keeps usable width instead of crushing to zero.
- [x] **ColorThemeToggle** — `flex-wrap: wrap` so the button row reflows instead of overflowing.
- [x] **LuminanceToggle** — `flex-wrap: wrap` (same fix).

**P2 — overflow instead of adapt** (done)

- [x] **FormLayout** — fixed column count switched to `auto-fit minmax(100px,1fr)`; columns collapse to one.
- [x] **SegmentedToggle** — the joined-segment row scrolls horizontally as a boundary scroller; buttons keep their size.
- [x] **CodeBlock** — the header tabs strip scrolls independently (`min-width:0; overflow-x:auto`) while the toolbar stays fixed.
- [x] **Modal** — `max-width: calc(100% - 2*spacing-2xl)` caps width to the frame, so a wide modal cannot overflow.
- [x] **SessionStatsFooter** — `installResponsiveStats` drops items by `data-priority` on a single row instead of wrapping into clipped rows.
- [x] **BottomTabBar** — labels ellipsize (`min-width:0` + a label span), so they no longer clip when tabs are many or long.

**P3 — minor** (done)

- [x] **Input min-width floors** (TextInput, SearchInput, Select, Range) — each `min-width` floor is now `min(<floor>, 100%)`, so it relaxes below a narrow container.
- [x] **Breadcrumb** — `installBreadcrumbCollapse` collapses the middle to a single `…`, keeping first + last, instead of wrapping.

## Reference patterns

The adaptive components are the templates a new component should borrow from:

- **ResponsiveTable** and **AdaptiveMetricsList** — `ResizeObserver` + priority-ranked column hiding.
- **SessionStatsFooter** (`installResponsiveStats`) and **Breadcrumb** (`installBreadcrumbCollapse`) — `ResizeObserver` priority-drop / middle-collapse, self-wired inside `render()` (which returns `{ node, cleanup }`) so the behavior is automatic for any consumer.
- **AppShell** (`installResponsiveRails`) — `ResizeObserver` collapses whole rails (`data-collapse-below` / `data-collapse-to`) so the center column never crushes.
- **NavStack** and **Sidebar** — discrete expanded/icon/hidden modes (the states `installResponsiveRails` drives).
- **NavRow** — `@container` query for a single reflow decision.
- **StickyToc** — `@media` mode switch for page-level chrome.

When self-wiring a `ResizeObserver` inside `render()`, observe the root and let the *observer itself* drive the initial adaptation: it delivers its first entry once the caller attaches and sizes the node, so no synchronous measurement (and no `requestAnimationFrame` kick) is needed. At `render()` time the node is still detached, so any synchronous read is `0` and a no-op anyway. (The observer is paused while the tab is hidden — expected; it fires when the tab becomes visible. Behavior tests must therefore run in a visible/headless context and wait via `setTimeout`, never `requestAnimationFrame`, which is throttled when hidden.)

## Known tradeoffs

- **Accessibility of priority-drop / collapse.** SessionStatsFooter and Breadcrumb hide dropped items with `display: none`, which removes them from the accessibility tree at narrow widths — screen-reader users get the reduced set too. This is consistent with the "show less" model (`RESPONSIVE_COMPONENTS` reduces content for everyone, not just sighted users), and keeping hidden items in the tree would defeat the natural-width measurement the enhancers rely on. Accepted, not a defect. Full labels that merely *ellipsize* (BottomTabBar, Modal title) stay in the tree.
- **Horizontal-scroller bar and vertical jitter.** Resolved by `SCROLLBAR_HIDDEN_BY_DEFAULT`: SegmentedToggle, CodeBlock's tab strip, and every other horizontal scroller paint no bar, so changing an item's weight near the overflow threshold cannot toggle bar height. The earlier `scrollbar-width: thin` jitter is no longer reachable.
