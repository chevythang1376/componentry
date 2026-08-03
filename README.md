# Componentry

A component builder and editor for web design blocks that get pasted into a WYSIWYG
editor. Pick a pattern, edit it live, and export self-contained HTML + CSS + JavaScript.

**No build step, no dependencies, no server.** Open `index.html` in a browser.

---

## Running it

Double-click `index.html`. That's it — it works from `file://`.

> If you edit the source and a reload seems to show the old version, your browser has
> cached the `js/*.js` files. Hard-reload with **Ctrl+Shift+R**.

---

## The 25 components

| Category | Component | Notes |
|---|---|---|
| **Heroes & Banners** | Parallax Banner | `transform`-based, so it works on iOS where `background-attachment: fixed` doesn't |
| | Hero Slider | Multiple banners that rotate. Dots work with no JS; autoplay always ships with a pause control |
| | Video Hero | Muted looping background video, poster fallback, pause control |
| | Split Hero | Copy + image, reversible, optional tick list |
| | CTA Banner | Solid / gradient / image / tint backgrounds |
| **Content** | Card Grid | "Whole card clickable" via a pseudo-element, so text stays selectable |
| | Feature Grid | Icon + title + blurb, four icon treatments |
| | Stats Counter | Counts up on scroll via `IntersectionObserver` |
| | Timeline | Alternating or single-column, staggered reveal |
| | Pricing Table | Highlighted tier, monthly/annual switch, unavailable-feature syntax |
| **Interactive** | Accordion / FAQ | APG accordion pattern, optional `FAQPage` JSON-LD |
| | Tabs | APG tabs pattern, roving tabindex, arrow keys |
| | Carousel | Scroll-snap (real touch swipe) + buttons, dots, autoplay |
| | Testimonial Slider | Cross-fade, ratings, height-equalised so the page doesn't jump |
| | Interactive Diagram | Hotspots over an image with a docked detail panel, zoom-to-point and a filtering legend. Core needs no JS |
| **Media & Utility** | Before / After Slider | Built on a real `<input type="range">` |
| | Gallery + Lightbox | Masonry or uniform; lightbox is a native `<dialog>` |
| | Logo Marquee | Seamless loop, duplicate track hidden from screen readers |
| | Countdown Timer | Announces once a minute, not once a second |
| | Video Embed (lite) | Click-to-load facade — nothing loads from YouTube until you press play |
| **Modern Layout** | Bento Grid | Asymmetric tiles with mixed spans and per-tile tones. Zero JS |
| | Sticky Stacking Cards | Cards pin and stack on scroll, built on `position: sticky`. Zero JS |
| **Product Showcase** | Finish Switcher | Swatches crossfade the product shot. Real radio inputs + `:has()`, zero JS |
| | Pinned Product Scroller | Product pins centre-screen while copy scrolls past, swapping shots per step |
| | Spec Strip | Row of headline specs with hairline dividers |

---

## Why the output survives a page builder

Page builders drop your markup into a theme you don't control. Four things protect it:

**1. Everything is scoped to a generated class.**
Each instance gets a class like `cb-accordion-k3f9a`. Every selector in the exported
CSS is prefixed with it. Nothing targets a bare element or a global utility name, so
the component can't restyle the host page.

**2. Design tokens live on the component, not on `:root`.**
Custom properties are declared on the wrapper element. A host page that also defines
`--cb-brand` doesn't win, and your tokens don't leak into the rest of the site.

**3. A defensive reset hands back the properties themes usually steal.**
`box-sizing`, heading and paragraph margins, `line-height`, `color`, `font-family`,
`letter-spacing`, list bullets, image borders, link underlines and button chrome are
all re-declared inside the scope.

**4. The script is safe to run more than once.**
A `data-cb-ready` attribute stops double-initialisation, and if the same snippet is
pasted twice on one page the second copy's `id`s are automatically re-uniqued so its
`aria-controls` / `aria-labelledby` keep pointing at its own nodes.

**5. Light-on-dark text states its colour rather than inheriting it.**
Themes very commonly ship `h2 { color: #111 !important }` — Elementor, Divi and most
"fix my theme" snippets do. On a block with its own dark background, losing that
inheritance is catastrophic: a black title inside a black box. Every place where light
text sits on a dark surface therefore declares its colour defensively. Everything else
is left overridable on purpose; this is used only where failure would hide content.

### The one thing it can't defend against

A host rule using `!important` on a bare element selector, for text that is *not* on a
dark background — most commonly `a { color: red !important; }`. Only `!important` beats
`!important`, and applying it everywhere would stop you restyling your own components.
If a pasted block picks up the wrong link colour, add one rule to your theme:

```css
.cb-card-grid-k3f9a a { color: inherit !important; }
```

---

## Which editors actually work

Every component is exported, pushed through a **real editor engine**, read back, re-mounted
and functionally probed. Run `test/wysiwyg.html` to reproduce this — 8 insertion paths ×
25 components, 200 round-trips.

| Insertion path | Fully working | Keeps CSS | Keeps JS |
|---|---|---|---|
| **Code / embed block** (verbatim) | **25/25** | yes | yes |
| **TinyMCE**, permissive config | **25/25** | yes | yes |
| **DOMPurify**, style+script allowed | **25/25** | yes | yes |
| GrapesJS (page builder) | 14/25 | yes | no |
| DOMPurify, defaults | 14/25 | yes | no |
| TinyMCE, stock config | 4/25 | no | no |
| `wp_kses_post` (approximated) | 4/25 | no | no |
| Quill | 0/25 | no | no |

The pattern is consistent and worth internalising:

- **Paste into a code/embed block, never a rich-text area.** Rich-text editors are *supposed*
  to strip `<script>` and `<style>` — that is their job, not a bug. Every platform that
  matters offers a raw-HTML block; use it.
- **When only the script is stripped** (GrapesJS, DOMPurify at defaults), the 14 components
  that need no JavaScript still work perfectly and the rest render correctly but sit inert.
  Nothing looks broken, it just doesn't move. This is why the newest blocks — Bento Grid,
  Sticky Stacking Cards, the scroll reveal and the Interactive Diagram — are built
  in pure CSS: they are the ones that survive here.
- **Structure and ARIA are resilient.** Even where all styling is stripped, sanitisers keep
  the semantics — so a stripped component stays readable and screen-reader navigable.

## Accessibility

Motion is layered as enhancement: scroll-driven effects use `@supports` and only run
when the visitor has not asked for reduced motion, so content is never hidden waiting
for an animation that cannot play.

Interactive components follow the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/):

- **Accordion** — `<h3><button aria-expanded aria-controls>`, panel is a labelled
  `region`, collapsed panels are `inert`, Up/Down/Home/End move between headers.
- **Tabs** — `tablist` / `tab` / `tabpanel`, roving tabindex, Left/Right/Home/End.
- **Carousel** — `aria-roledescription="carousel"`, per-slide `group` labels,
  a rotation control, `aria-live` that flips to `polite` when rotation stops,
  and pause on hover and focus.
- **Video Hero** — a pause control, because WCAG 2.2.2 requires one for motion
  that runs over five seconds.
- **Hero Slider** — auto-rotation never ships without a visible pause control, for
  the same reason. Dots are real radios, hidden banners use `visibility: hidden` so
  their links stay out of the focus order, and any user interaction halts rotation.
- **Countdown** — announces remaining time once a minute; a per-second live region
  is unusable with a screen reader.
- Every component respects `prefers-reduced-motion`, and the marquee and parallax
  stop entirely rather than merely slowing down.

---

## Export formats

Choose a target platform and the format switches to what that platform actually needs.

| Format | Use for |
|---|---|
| **One block** | Anything with a raw-HTML field — markup, `<style>` and `<script>` together |
| **Split files** | Webflow, HubSpot — separate HTML / CSS / JS panes |
| **Full page** | Wix and other iframe-sandboxed embeds; also a standalone hand-off file |

Platform notes cover the real gotchas: Webflow's 50 kB embed cap, Squarespace not
running scripts in edit mode, the WordPress Visual tab stripping `<script>`, Wix
embeds being sandboxed iframes that can't self-size.

---

## Using the editor

- **Library** — click a component to append it to the canvas.
- **Layers** — drag to reorder, or use the arrows; duplicate and delete inline.
- **Canvas** — click any block to select it. Toggle mobile / tablet / desktop widths,
  and cycle the canvas between light, grid and dark to check contrast.
- **Properties** — every editable field for the selected block. Repeatable lists
  (cards, slides, plans) can be added, reordered, duplicated and removed.
- **Design tokens** — colour, type and shape shared by every block, with six presets.

Headline and body fields accept line breaks, plus `**bold**` and `*italic*`.

### Advanced controls (every component)

Applied centrally, so they behave identically on all 18 blocks:

| Control | Why it's there |
|---|---|
| **Anchor ID** | Gives the block an `id` so you can link to it with `#your-anchor` |
| **Extra CSS class** | Added to the wrapper so your theme can target this one block |
| **Heading level** | Shifts every heading together (H2→H3→H4) to keep the page outline valid when a block sits under an existing heading |
| **Content width** | Overrides the project token for one block |
| **Top / bottom padding** | Independent overrides; read `auto` until you change them |
| **Visibility** | Hide on mobile (≤640px) or desktop (>640px) |
| **Reveal on scroll** | Fade, fade-up or scale as the block enters the viewport |

**Reveal on scroll is pure CSS** — an `animation-timeline: view()` scroll timeline, no
JavaScript, so it still animates in editors that strip `<script>`. Scroll timelines sit
around 85% support, so it is layered strictly as an enhancement: the block renders
visible by default and only animates where timelines exist *and* the visitor has not
asked for reduced motion. Delete the `animation-timeline` line and nothing disappears —
`test/degrade.html` asserts exactly that.

Overrides are emitted with the root's full class list, so they win on specificity and
source order — no `!important`, and you can still restyle them from your theme.

### Behaviour controls worth knowing

- **Accordion → link to individual answers.** Each question gets a shareable `#hash`;
  arriving on that link opens and scrolls to it. Ideal for support docs.
- **Tabs → link to individual tabs**, plus **manual keyboard activation** (arrows move,
  Enter selects) — the APG recommendation when panels are expensive to load.
- **Carousel → wrap around at the ends**, so arrows never dead-end.
- **Parallax → parallax on mobile**, off by default because scroll-linked movement is
  janky and battery-hungry on phones.
- **Countdown → when it reaches zero**: show a message, hide the block, or hold at zero.

Toggles that are off cost nothing: the code for them isn't emitted at all, which keeps
exports under Webflow's 50 kB embed cap.

**Shortcuts:** `Ctrl+Z` undo · `Ctrl+Shift+Z` redo · `Ctrl+S` save · `Ctrl+E` export ·
`Delete` remove selected.

Work autosaves to `localStorage`. **Save file** / **Open** move projects between
browsers as `.componentry.json`.

---

## Project layout

```
index.html              Editor shell
css/app.css             Editor chrome (does not ship with exports)
js/core.js              Registry, scoping, escaping, tokens, defensive reset
js/inspector.js         Schema → property panel
js/export.js            Code assembly, minifier, preview document, platform notes
js/app.js               State, history, persistence, wiring
js/components/
  heroes.js             parallax-banner, video-hero, split-hero, cta-banner, hero-slider
  content.js            card-grid, feature-grid, stats-counter, timeline, pricing
  interactive.js        accordion, tabs, carousel, testimonials
  media.js              before-after, gallery, logo-marquee, countdown, video-embed
  modern.js             bento-grid, sticky-stack (both zero-JS)
  product.js            finish-switcher, pinned-product, spec-strip
  diagram.js            hotspot-diagram
test/
  gallery.html          Renders all 18 through the real export path; reports failures
  hostile-host.html     Pastes exports into a deliberately awful theme; 27 assertions
  wysiwyg.html          Drives TinyMCE, GrapesJS, Quill and DOMPurify for real;
                        144 round-trips, then functionally probes what survives
  degrade.html          Removes one CSS capability at a time (background-clip,
                        gradients, clip-path, backdrop-filter, images) and reports
                        any text that becomes unreadable
  probes.js             Per-component functional assertions, shared by the harnesses
```

Open the files in `test/` in a browser — each prints a pass/fail banner at the top.
`wysiwyg.html` loads the editor engines from a CDN, so it needs a network connection;
the other two are fully offline.

---

## Adding a component

Register a definition. Everything else — the library entry, the property panel, the
preview, and all three export formats — is generated from it.

```js
CB.register({
  id: 'my-block',
  name: 'My Block',
  category: 'Content',
  icon: '★',
  blurb: 'One line shown in the library list.',

  props: [
    { t: 'section', label: 'Content' },
    { k: 'title', t: 'text', label: 'Title', value: 'Hello' },
    { k: 'bg',    t: 'color', label: 'Background', value: '#ffffff' },
    { k: 'pad',   t: 'range', label: 'Padding', min: 0, max: 120, step: 8, unit: 'px', value: 48 }
  ],

  render: function (p, c) {
    return {
      html: `<section class="${c.cls} cb-mb">
               <div class="cb-wrap"><h2>${c.rich(p.title)}</h2></div>
             </section>`,
      css:  `${c.s}.cb-mb { background: ${p.bg}; padding-block: ${c.num(p.pad, 48)}px; }`,
      js:   c.wrap(c.cls, 'console.log("root is", root);')
    };
  }
});
```

Then add the file to the `<script>` list in `index.html`.

**Field types:** `text` · `textarea` · `number` · `range` · `color` · `select` ·
`toggle` · `url` · `image` · `datetime` · `list` · `section`.
Add `when: { otherKey: [value] }` to any field to show it conditionally.

**Rules for `render`:**

- Prefix *every* CSS selector with `c.s` (the scoped class). Nothing global.
- Escape user text — `c.esc` for plain, `c.rich` for line breaks and `**bold**`,
  `c.attr` for attributes, `c.url` for `href`/`src` (it blocks `javascript:`).
- Wrap behaviour in `c.wrap(c.cls, body)`. Inside, `root` is the component element;
  the double-init and id-uniquing guards are added for you.
- Use `var(--cb-brand)`, `var(--cb-radius)`, `var(--cb-max)` and friends so the
  component follows the project's design tokens.

---

## Browser support

Current Chrome, Edge, Firefox and Safari. Uses `:has()`, `inert`, `<dialog>`,
`aspect-ratio`, `color-mix()`, scroll-snap and `IntersectionObserver` — all baseline
since 2023. Components degrade rather than break on older engines: the carousel still
scrolls, the accordion still opens, the lightbox falls back to a non-modal panel.










