# design-kit

Design tokens, web components, and CSS generation.

## Design Taxonomy

The inspiration behind the choices we made.

---

### 01 Systems Modernism

Rational, institutional graphic design built from grids, hierarchy, asymmetry, and neutral sans-serifs. This is the root language behind work that feels official, technical, and designed as a system rather than as illustration.

<details>
<summary>Visual examples</summary>

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Musica_Viva._M%C3%BCller-Brockmann.jpg/400px-Musica_Viva._M%C3%BCller-Brockmann.jpg" alt="Josef Muller-Brockmann, Musica Viva concert poster, 1959" width="380">

Josef Muller-Brockmann, Musica Viva poster (1959). Geometric arcs on a strict grid; sans-serif type placed by mathematical proportion. The quintessential Swiss Style artifact. [MoMA collection](https://www.moma.org/collection/works/7233)

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Athletics_pictogram_black_%281972_Summer_Olympics_style%29.svg/400px-Athletics_pictogram_black_%281972_Summer_Olympics_style%29.svg.png" alt="1972 Munich Olympics athletics pictogram by Otl Aicher" width="380">

Otl Aicher, Munich 1972 Olympics pictogram. All 21 sport symbols share a single geometric vocabulary; visual unity emerges from the grid rules, not from individual drawing decisions. [View full set](https://www.theolympicdesign.com/olympic-games/pictograms/munich-1972/)

<img src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" alt="IBM 8-bar striped logo by Paul Rand, 1967" width="240">

Paul Rand, IBM 8-bar logo (1967). The striped wordmark in City Medium; black stripes drawn thicker than white to appear optically equal. The [graphic standards manual](https://standardsmanual.com/products/ibm-graphic-design-guide) governed every application from signage to stationery.

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/1959_-_Kunsthalle_Basel_-_4_Bildhauer.jpg/400px-1959_-_Kunsthalle_Basel_-_4_Bildhauer.jpg" alt="Armin Hofmann, Kunsthalle Basel exhibition poster, 1959" width="380">

Armin Hofmann, Kunsthalle Basel poster (1959). Akzidenz-Grotesk type, geometric abstraction, restrained palette. Basel and Zurich were the two poles of Swiss Style; Hofmann taught at the Basel School of Design for 40 years.

</details>

<details>
<summary>Further reading</summary>

- **Poster** [MoMA: Muller-Brockmann, Musica Viva (1958)](https://www.moma.org/collection/works/7233)
- **Article** [SOCKS: Musica Viva posters for the Zurich Tonhalle](https://socks-studio.com/2016/11/30/joseph-muller-brockmann-musica-viva-posters-for-the-zurich-tonhalle/)
- **Manual** [Standards Manual: NYCTA Graphics Standards Manual](https://standardsmanual.com/products/nyctacompactedition)
- **Grid** [MS Studio: Gerstner's layout grid for Capital](https://ms-studio.net/notes/karl-gerstners-layout-grid/)
- **Pictograms** [Olympic Design: Munich 1972 pictogram system](https://www.theolympicdesign.com/olympic-games/pictograms/munich-1972/)

</details>

**What it looks like:** Grid structure / disciplined margins / numbered sections / restrained color / modular panels / diagram captions / clean sans typography / heavy use of rules and spacing instead of ornament

> "Use institutional systems graphics: Swiss grid logic, asymmetric hierarchy, neutral sans typography, modular panels, official-document tone, and minimal ornament."

---

### 02 Aerospace Standards-Manual Modernism

The governmental and corporate identity version of systems modernism. Think NASA graphics standards, procedural branding, technical spec pages, and official institutional graphics.

<details>
<summary>Visual examples</summary>

<img src="https://upload.wikimedia.org/wikipedia/commons/a/a3/NASA_Worm_logo.svg" alt="NASA worm logotype designed by Danne and Blackburn, 1975" width="300">

Danne & Blackburn, NASA "worm" logotype (1975). Continuous-stroke letterforms; no serifs, no crossbar on the A. The [220-page standards manual](https://standardsmanual.com/products/nasa-graphics-standards-manual) controlled every application from vehicle markings to stationery.

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/400px-NASA_logo.svg.png" alt="NASA meatball insignia" width="300">

The NASA insignia ("meatball"), which the worm logotype was designed to complement. The [original 1976 manual (PDF)](https://www.nasa.gov/wp-content/uploads/2015/01/nasa_graphics_manual_nhb_1430-2_jan_1976.pdf) is hosted on nasa.gov.

</details>

<details>
<summary>Further reading</summary>

- **Manual** [Standards Manual: NASA Graphics Standards Manual reissue](https://standardsmanual.com/products/nasa-graphics-standards-manual)
- **PDF** [NASA.gov: Original NHB 1430.2 manual (Jan 1976)](https://www.nasa.gov/wp-content/uploads/2015/01/nasa_graphics_manual_nhb_1430-2_jan_1976.pdf)
- **IBM** [Paul Rand: IBM corporate identity work](https://www.paulrand.design/work/IBM.html)
- **IBM Manual** [Standards Manual: IBM Graphic Design Guide (1969-1987)](https://standardsmanual.com/products/ibm-graphic-design-guide)
- **Article** [It's Nice That: Paul Rand's IBM Graphic Standards Manual](https://www.itsnicethat.com/features/paul-rand-ibm-graphic-standards-manual-empire-editions-publication-graphic-design-180418)

</details>

**What it looks like:** Red/black/white palettes / logotype control pages / vehicle and signage specifications / technical diagrams / title blocks / procedural captions / spec-page layouts / a tone of institutional authority

> "Reference 1970s aerospace standards-manual modernism: NASA-style spec pages, procedural hierarchy, sparse signal color, diagrammatic callouts, and government-agency visual discipline."

---

### 03 Machine-Legibility Typography

Typography designed for machines to read as well as humans. This includes OCR lineages, fixed-width logic, and document systems built around legibility, scanning, and differentiation.

<details>
<summary>Visual examples</summary>

<img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/OCR-A_font.svg" alt="OCR-A typeface specimen" width="380">

OCR-A (American Type Founders, 1968). Designed to meet U.S. Bureau of Standards criteria for optical character recognition. Uniform stroke widths; exaggerated distinctions between similar glyphs (O vs. 0, 1 vs. l).

<img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/OCR-B_font.svg" alt="OCR-B typeface specimen" width="380">

OCR-B (Adrian Frutiger for Monotype, 1968). Accepted as world standard in 1973. More humanist than OCR-A but still monospaced and machine-optimized. Used today in UPC/EAN barcodes and [machine-readable passports](https://en.wikipedia.org/wiki/Machine-readable_passport).

<img src="https://upload.wikimedia.org/wikipedia/commons/0/0d/MICR.svg" alt="MICR E-13B font character set" width="380">

MICR E-13B (Stanford Research Institute / General Electric, 1956). Magnetic ink character recognition font for bank checks. 10 numerals plus 4 special symbols (Transit, On-us, Amount, Dash: the "TOAD" characters).

<img src="https://upload.wikimedia.org/wikipedia/commons/5/58/MICR_char.svg" alt="MICR E-13B individual characters" width="380">

MICR E-13B detail. Each character produces a unique magnetic waveform when scanned. The exaggerated geometry is not aesthetic; it is a signal-processing requirement. [OCR-A usage archive at Fonts In Use](https://fontsinuse.com/typefaces/4325/ocr-a).

</details>

<details>
<summary>Further reading</summary>

- **History** [Tedium: The history of OCR fonts](https://tedium.co/2017/03/22/ocr-typography-optical-character-recognition-history/)
- **OCR-A** [Wikipedia: OCR-A](https://en.wikipedia.org/wiki/OCR-A)
- **OCR-B** [Prepressure: The OCRA and OCRB fonts](https://www.prepressure.com/fonts/interesting/ocra-and-ocrb)
- **MICR** [Wikipedia: Magnetic Ink Character Recognition](https://en.wikipedia.org/wiki/Magnetic_ink_character_recognition)
- **In Use** [Fonts In Use: OCR-A usage archive](https://fontsinuse.com/typefaces/4325/ocr-a)

</details>

**What it looks like:** Fixed-width rhythm / exaggerated character distinction / tabular spacing / label fields / form logic / scanability / blunt geometric construction / document aesthetics that feel computational rather than decorative

> "Push toward machine-legibility typography: OCR-A/OCR-B cues, monospaced rhythm, tabular spacing, machine-readable labels, and technical-form composition."

---

### 04 Display-Constrained Experimental Modernism

Typography shaped by the logic of electronic display constraints. This is the lineage of modular, segmented, rectilinear letterforms that feel engineered rather than drawn.

<details>
<summary>Visual examples</summary>

<img src="https://upload.wikimedia.org/wikipedia/commons/a/ab/7-segment_abcdefg.svg" alt="Seven-segment display diagram showing segment labeling" width="380">

The seven-segment display: the physical constraint that defines this lineage. Only horizontal and vertical strokes (plus diagonals at 45 degrees in some variants). Every letterform must be composed from these seven elements.

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/7_segment_display_labeled.svg/330px-7_segment_display_labeled.svg.png" alt="Seven-segment display with labeled segments" width="300">

Seven-segment display with labeled segments. LED segments are simple rectangles because they must be physically moulded to shape. This physical limitation became a typographic aesthetic.

</details>

#### Key Work: Wim Crouwel's New Alphabet (1967)

Crouwel designed a typeface suited for cathode-ray screens: because of their low resolution, CRT screens could not display the curves of traditional typefaces without altering them. The result used only horizontal, vertical, and 45-degree strokes. There was no differentiation between uppercase and lowercase except a bar above the letter to indicate a capital. Crouwel himself called it "over-the-top and never meant to be really used." MoMA acquired it in 2011 as one of its first 23 digital typefaces.

<details>
<summary>Further reading</summary>

- **MoMA** [MoMA: Wim Crouwel, New Alphabet (1967)](https://www.moma.org/collection/works/139322)
- **Specimen** [Production Type: The specimen of New Alphabet](https://productiontype.com/article/the-specimen-of-new-alphabet-wim-crouwel-1967)
- **Essay** [Eye Magazine: Electrifying the alphabet](https://eyemagazine.com/feature/article/electrifying-the-alphabet)
- **Foundry** [The Foundry Types: New Alphabet (digital revival)](https://www.thefoundrytypes.com/fonts/new-alphabet/)
- **7-Segment** [Wikipedia: Seven-segment display](https://en.wikipedia.org/wiki/Seven-segment_display)

</details>

**What it looks like:** Segmented strokes / right angles / octagonal curves / modular letter construction / CRT-like rationalization / typography that feels built by a grid rather than by hand

> "Use CRT-constrained experimental type: segmented geometry, modular stroke logic, rectilinear counters, and an engineered rather than calligraphic alphabet."

---

### The Lineage

> Bauhaus typographic reduction
> &darr;
> Swiss information systems
> &darr;
> IBM/NASA institutional standards
> &darr;
> OCR & display-constrained type

The threshold between the second and third steps is the pivot point of the entire taxonomy. In lineages 1 and 2, designers impose rational systems on visual material: the human decides the grid, the palette, the hierarchy. In lineages 3 and 4, a machine constraint imposes the system on the designer: the scanner demands OCR-A's exaggerated geometry; the CRT's pixel grid forces Crouwel's right angles. The design tradition is continuous, but the locus of control shifts from designer to device.

### Typefaces by Lineage

| Lineage | Primary typefaces |
|---|---|
| Systems modernism | Helvetica, Akzidenz-Grotesk, Univers, Futura |
| Aerospace standards-manual | Helvetica (NASA), City Medium (IBM), Futura |
| Machine-legibility | OCR-A, OCR-B, MICR E-13B, Courier, IBM Plex Mono |
| Display-constrained | New Alphabet (Crouwel), DSEG / seven-segment, Chicago (bitmap) |

### Vocabulary

**Style labels:** systems modernism, aerospace standards-manual modernism, machine-legibility typography, CRT-constrained typography, institutional information design

**Formal descriptors:** grid-based, modular, procedural, diagrammatic, tabular, monospaced, segmented, standards-driven, annotation-heavy, machine-readable, low-ornament

**Artifact nouns:** standards manual, engineering report, operations binder, title block, legend, callout label, revision table, instrumentation panel, data plate

### Design Directions

**Institutional / Official**

> "Design this like a 1970s technical standards manual: Swiss grid discipline, institutional typography, numbered modules, diagram captions, restrained signal colors, and official aerospace-report authority."

**Computational / Typographic**

> "Use machine-legibility cues rather than generic sci-fi: OCR-influenced forms, fixed-width rhythm, tabular spacing, high character differentiation, and technical-form layout."

---

## What's here

| Path | Description |
|---|---|
| `tokens/design-tokens.json` | Primitive and semantic design tokens (color, spacing, typography) |
| `components/*.js` | `sp-*` web components (shell, sidebar, tabs, buttons, inputs, modals, forms, navigation) |
| `pages/` | Static HTML pages (taxonomy) copied to `dist/` by the build pipeline |
| `src/design_kit/token_css.py` | Generates layered CSS (reset, tokens, defaults, utilities) from the token JSON |
| `src/design_kit/preview.py` | Generates the preview page |
| `src/design_kit/components_preview.py` | Generates the component explorer page (live preview, props, variants, size controls) |
| `src/design_kit/build.py` | Build pipeline: tokens, CSS, preview pages, static pages, and components into `dist/` |
| `docs/reference/visual-language.md` | Visual language principles and token application guide |
| `docs/explanations/` | Design system architecture and rationale |

## Setup

```bash
uv sync
```

## Build and preview

Generate `dist/` with CSS, HTML previews, and components:

```bash
uv run design-kit build
```

Serve locally and open in a browser:

```bash
python3 -m http.server 8787 -d dist
# open http://localhost:8787/preview.html
# open http://localhost:8787/components.html
```

The preview pages use the kit's own tokens, CSS, and web components to showcase itself:
- `preview.html` for the full design language + patterns overview
- `components.html` for component-focused exploration and stress testing

## Checks

```bash
uv run ruff format --check src
uv run ruff check src
uv run mypy src
uv run pytest
```
