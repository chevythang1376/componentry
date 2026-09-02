# Componentry

A component builder and editor for web design blocks that get pasted into a WYSIWYG
editor. Pick a pattern, edit it live, and export self-contained HTML + CSS + JavaScript.

**No build step, no dependencies, no server.** Open `index.html` in a browser.

---

## Running it

Double-click `index.html`. That's it — it works from `file://`.

**If you're editing the source**, run `./bump.sh` before committing. Assets carry a
`?v=` version and there's no build step to update it, so without a bump a browser will
keep serving yesterday's `js/*.js` after a deploy and the page looks unchanged. Same day
twice? `./bump.sh b`.

### The half a version bump can't fix

Versioned asset URLs only work if the browser has the HTML that names them. GitHub Pages
sends `Cache-Control: max-age=600` on every file and offers no way to change it — no
`_headers`, no `.htaccess`, no setting — so for ten minutes after a deploy a returning
browser can still hold the previous `index.html`, go on requesting the previous `?v=`
URLs, and sit a whole build behind. It looks exactly like a deploy that failed. That
happened twice while this was being written, and both times the deploy was fine.

`bump.sh` now writes the build id to `version.txt` as well as onto the asset URLs, and
fails loudly if the two ever disagree. `js/freshness.js` fetches that file with
`cache: 'no-store'`, so it always comes from the network; if it disagrees with the id
baked into the page, the page is the stale one and it reloads through `?b=<id>` — a URL
the cache has no entry for. A plain `location.reload()` would not do, since it can be
answered from the very same cache entry.

Three things it deliberately won't do. It won't reload twice for the same build, so a
half-propagated deploy can't bounce anyone in a loop. It won't reload at all if the check
took more than five seconds, because by then someone may be mid-edit and the ten-minute
cache heals it anyway. And it does nothing on `file://`, where there is no server to ask
and no cache to fight.

One honest limit: this protects a visitor whose cached `index.html` already contains it,
so the deploy that introduces it is the last one that can go stale.

---

## The 27 components

| Category | Component | Notes |
|---|---|---|
| **Heroes & Banners** | Parallax Banner | `transform`-based, so it works on iOS where `background-attachment: fixed` doesn't |
| | Hero Slider | Multiple banners that rotate. Styleable arrows and dots, swipe on touch. Dots work with no JS; autoplay always ships with a pause control |
| | Video Hero | Muted looping background video, poster fallback, pause control |
| | Split Hero | Copy + image, reversible, optional tick list |
| | CTA Banner | Solid / gradient / image / tint backgrounds |
| **Content** | Card Grid | "Whole card clickable" via a pseudo-element, so text stays selectable |
| | Feature Grid | Icon + title + blurb, four icon treatments |
| | Stats Counter | Counts up on scroll via `IntersectionObserver` |
| | Timeline | Alternating or single-column, staggered reveal |
| | Pricing Table | Highlighted tier, monthly/annual switch, unavailable-feature syntax |
| | Webinar Library | Recorded and upcoming sessions, newest first. Sorted when the code is generated, not in the browser, so the order survives an editor that strips scripts |
| **Interactive** | Accordion / FAQ | APG accordion pattern, optional `FAQPage` JSON-LD |
| | Tabs | APG tabs pattern, roving tabindex, arrow keys |
| | Image / Video Carousel | Scroll-snap (real touch swipe) + buttons, dots, autoplay |
| | Testimonial Slider | Cross-fade, ratings, height-equalised so the page doesn't jump |
| | Interactive Diagram | Hotspots over an image with a docked detail panel, zoom-to-point and a filtering legend. Core needs no JS |
| **Media & Utility** | Before / After Slider | Built on a real `<input type="range">` |
| | Gallery + Lightbox | Masonry or uniform; lightbox is a native `<dialog>` |
| | Logo Marquee | Seamless loop, duplicate track hidden from screen readers |
| | Countdown Timer | Announces once a minute, not once a second |
| | Video Embed (lite) | Click-to-load facade — nothing loads from YouTube until you press play |
| **Modern Layout** | Bento Grid | Asymmetric tiles with mixed spans and per-tile tones. Zero JS |
| | Sticky Stacking Cards | Cards pin and stack on scroll, built on `position: sticky`. Zero JS |
| | Mosaic Grid | Flush checkerboard of colour tiles and photos. Type is sized against the tile rather than the viewport, and each tile picks readable ink for the colour you give it. Zero JS |
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

The same reasoning covers solid buttons. `a { color: #ff0000 !important }` is one of the
commonest theme rules there is, and a button paints its own background, so an overridden
label colour lands red-on-brand at about 1.2:1 — unreadable. Solid button labels are
defended the same way; outlined buttons are not, because they inherit from whatever
surface they sit on.

### If a block scrolls *over* your site header

Two different causes, with different symptoms.

**One heading floats over the header while everything around it behaves.** Themes very
commonly write `h2 { position: relative; z-index: 2 }` to hang a decorative underline off
a heading. That promotes only that heading into the header's paint layer. The reset now
returns `position` and `z-index` to their defaults for headings, text and the block
root, so this is fixed — re-export and re-paste to pick it up.

**The whole block slides over the header, with Reveal on scroll enabled.**

Cause is on the host side, and it is a one-line fix. Animating an element promotes it
into the same paint layer as positioned elements. If your fixed header has no `z-index`,
the two are ranked by document order — and the block, coming later in the page, wins.

```css
/* your theme */
.site-header { position: fixed; z-index: 10; }   /* any value ≥ 1 */
```

Measured: with a header at `z-index: auto`, an animated block overlapped it at 25 of 25
scroll positions. With `z-index: 1` or above, zero. Nothing can be done from inside the
component — a stacking context cannot lower itself beneath an ancestor's sibling — and
this affects *any* animated content on the page, not only these blocks. A fixed header
without a `z-index` is fragile regardless.

Two related things worth checking on a site with a fixed header:

- **Pinned Product Scroller** — set *Pin offset from top* to at least the header's height,
  or the pinned product sits underneath it.
- The same applies to **Sticky Stacking Cards** and the **Interactive Diagram**'s side panel.

### The one thing it can't defend against

A host rule using `!important` on a bare element selector, for text that is *not* on a
dark background — most commonly `a { color: red !important; }`. Only `!important` beats
`!important`, and applying it everywhere would stop you restyling your own components.

Solid buttons are the exception and *are* defended, because their label sits on the
button's own fill and an override there is unreadable rather than merely off-brand.
Inline links inside body copy are left inheriting on purpose. If a pasted block picks up
the wrong link colour, add one rule to your theme:

```css
.cb-card-grid-k3f9a a { color: inherit !important; }
```

---

## Which editors actually work

Every component is exported, pushed through a **real editor engine**, read back, re-mounted
and functionally probed. Run `test/wysiwyg.html` to reproduce this — 8 insertion paths ×
27 components, 200 round-trips.

Run it in a **desktop-width window**. Several blocks deliberately drop a behaviour below a
breakpoint — sticky pinning, multi-column spans — and the probes assert whichever branch
the current width selects. In a narrow window those blocks are asked only to release
cleanly, which is a lower bar, so the counts below come out flattering. The figures here
are measured at 1280px.

| Insertion path | Fully working | Keeps CSS | Keeps JS |
|---|---|---|---|
| **Code / embed block** (verbatim) | **27/27** | yes | yes |
| **TinyMCE**, permissive config | **27/27** | yes | yes |
| **DOMPurify**, style+script allowed | **27/27** | yes | yes |
| GrapesJS (page builder) | 15/27 | yes | no |
| DOMPurify, defaults | 16/27 | yes | no |
| `wp_kses_post` (approximated) | 5/27 | no | no |
| TinyMCE, stock config | 4/27 | no | no |
| Quill | 0/27 | no | no |

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

### Sharing the reset

Every block needs the same ~7 kB of defensive reset and design tokens. Stating it inside
each one meant a page of five blocks spent **half its CSS on the same rules repeated five
times** — and cleared Webflow's 50 kB cap on its own.

With more than one block, that base is now stated once for the page against a shared
`cb-scope` class that every component root already carries:

| Page | Reset per block | Reset shared | |
|---|---|---|---|
| 5 blocks | 55.8 kB CSS | **28.6 kB** | −49% |
| All 27 | 333.4 kB CSS | **113.5 kB** | −66% |

Both columns count the same thing: every byte of CSS the page needs. The shared column
includes the one copy of the reset, which an earlier version of this table left out — the
saving is real but it was being flattered.

That five-block page exports at 52.6 kB of HTML + CSS + JS, or **38.7 kB minified**, which
is what fits inside Webflow's 50 kB cap. Any single block is far under it; the largest,
Interactive Diagram, is about 20 kB.

The markup is **byte-identical either way** — switching modes never means re-pasting your
HTML — and a single block is unchanged, since it has nothing to share with. Rendering is
identical too: the shared rules are emitted ahead of the component rules, so source order
resolves ties exactly as before.

**Turn it off if you're pasting blocks into separate embeds.** Shared mode assumes the
whole export lands in one place. If each block goes into its own embed field, each one has
to stand on its own, and the toggle in the export dialog puts the reset back inside every
block.

### Getting back in

Exported code carries the settings that produced it, in an HTML comment browsers ignore.
Paste it back with **Paste code** — or open an exported `.html` file — and you have an
editable project again, even if the `.componentry.json` is long gone.

Round-tripping is exact: re-exporting a recovered project reproduces the original code
byte for byte, including design tokens, per-block settings and uploaded images.

Images are the reason this isn't simply the project JSON in a comment. They're data URIs
already sitting in the markup, and repeating them made the payload **30% of the export**,
nearly 60% of that being bytes just written. Any value already in the HTML is stored as a
hash of itself and resolved from the markup on the way back — keyed by content, so an
image used twice or blocks reordered can't mis-map. That brings the cost to **12%**.

Switch it off with **Re-editable** if you'd rather ship the smallest possible code. Split
files mode puts the comment on the HTML pane, since that's the part you'd paste back.

### Preflight

The export dialog checks the project **as you configured it**, not at component defaults,
and answers one question: if this were pasted right now, what would go wrong?

| Check | Catches |
|---|---|
| **Contrast** | Text under 3:1 against its own background, judged on the rendered block |
| **Alt text** | Images you have replaced but not described |
| **Empty blocks** | A list component with no items — exports as a dead band |
| **Heavy images** | Uploads over ~180 kB, which cost twice: export *and* browser storage |
| **Embed cap** | Total over the target platform's limit, with the way out |
| **Needs JavaScript** | Which blocks stop responding in a rich-text field |

Findings name the block they came from and say what to do. A clean project collapses to a
single line rather than making you read a report.

The alt check ignores placeholders. Every image field ships a generated placeholder, so
checking for a blank alt regardless meant six warnings about twenty-two images that did
not exist yet — 86% of everything preflight said on a fresh project. A warning that fires
before you have done anything is how the findings that matter get scrolled past. It now
waits until a real image is in and still has nothing describing it.

Filling those alts in as a default would have been worse: canned text ships into the
export looking like a description somebody wrote.


The contrast check deliberately **skips what it can't resolve**. Text over a photo, or
anything positioned out of normal flow, has no knowable backdrop — guessing white there is
how a checker invents failures nobody can act on. Ordinary flowed text inside a block with
its own background is exactly the black-title-in-a-black-box case, and that is still judged.

It earned its keep immediately: it found the Interactive Diagram's pin numbers drawn in
the category colour on a white disc, which put the shipped amber at **1.9:1**. Pins and
badges now take a readable ink worked out per category, so any colour you pick stays
legible — including the ones I'd never have thought to test.

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

Applied centrally, so they behave identically on all 27 blocks:

| Control | Why it's there |
|---|---|
| **Anchor ID** | Gives the block an `id` so you can link to it with `#your-anchor` |
| **Extra CSS class** | Added to the wrapper so your theme can target this one block |
| **Heading level** | Shifts every heading together (H2→H3→H4) to keep the page outline valid when a block sits under an existing heading |
| **Content width** | Overrides the project token for one block |
| **Top / bottom padding** | Independent overrides; read `auto` until you change them |
| **Heading size** | Multiplies the project heading size for this block only; `1×` leaves it alone |
| **Heading letter spacing** | Added on top of the project value |
| **Body size** | Same idea for the body copy in this block |
| **Corner radius** | Overrides the project radius for one block; everything proportional inside follows, circles and pills don't |
| **Visibility** | Hide on mobile (≤640px) or desktop (>640px) |
| **Reveal on scroll** | Fade, fade-up or scale as the block enters the viewport |

The three type controls only appear where they can do something. Logo Marquee
has a kicker and logos but no heading, so it is not offered heading size or
heading letter spacing; every other block is. A control that cannot change
anything is just noise, and Advanced repeats on all 27 blocks.


### Typography (Design tokens → Typography)

Every component's text is adjustable without opening the CSS. Eleven controls,
split by the role the text plays:

| | Size | Letter spacing | Line height | Weight |
|---|---|---|---|---|
| **Body** | ✓ | ✓ | ✓ | — |
| **Heading** | ✓ | ✓ | ✓ | ✓ |
| **Eyebrow** | ✓ | ✓ | — | ✓ |

"Eyebrow" is the small uppercase line above a heading — `PERFORMANCE`,
`NEW FOR 2026`.

**These adjust rather than replace.** Sizes multiply, spacing and line height
add. That matters because the library does not use one type scale: a hero
headline is deliberately set tighter (`-.025em`) than a card title (`-.01em`),
and a 60px hero is not a 26px section title. Flattening those to shared values
would redesign every block the first time you touched a slider. Instead,
"heading letter spacing +5" moves *both* by the same amount and keeps the
hero tighter than the card, which is what you meant.

At `1×` and `0` the output is byte-identical to having no controls at all —
verified by comparing computed styles element-for-element against the previous
release, at two viewport widths.

Sizes scale the entire responsive curve, not just its ceiling. A headline set
as `clamp(30px, 6vw, 56px)` becomes `calc(clamp(30px, 6vw, 56px) * 1.35)`, so
the slider keeps working on a wide screen where the `6vw` term is what's
actually in force. Scaling only the `56px` would have looked like a dead
control above about 930px.

Two of these you already had under other names. **Body size** is the old *Base
size*, renamed for symmetry; it now also reaches text that happens to be
clamped in px, like a hero subtitle, which it previously skipped.

Coverage is measured, not assumed. Each control is moved and the elements whose
computed style changes are counted, per component. Body size, letter spacing and
line height reach all 27 blocks; heading controls reach 24 (all but Logo
Marquee); eyebrow controls reach the 15 blocks that have an eyebrow. That check
found four eyebrows the first pass had missed — including two literally named
`__eyebrow` — twelve headings that were inheriting body line height instead of
heading line height, and a logo wordmark that was wrongly being tracked as a
heading. All fixed.

Any of heading size, heading letter spacing and body size can be overridden for
a single block under **Advanced** — those compose with the project values, so
`1×` and `0` there always mean "same as the rest of the page".

### Corners

One slider, **Shape → Corner radius**, and no per-component sliders anywhere. Twenty-six
of those would be exactly the clutter worth avoiding, and it would make a coherent look
harder rather than easier: matching a page would mean setting twenty-six values instead
of one.

It works because nothing rounded is written as a bare pixel value. Every rounded
container is either `var(--cb-radius)` or a deliberate multiple of it — a rounded-square
icon at `0.8×`, a Bento tile at `1.5×` — so one slider rescales a whole page while
keeping the relationships between elements. A 16px card with an 8px chip inside it, not
both at 16px, which looks wrong at either extreme. `test/radius.html` fails if a
container ever drifts onto a literal pixel value, because that is precisely how an
element silently opts out of the slider.

**Circles and pills are deliberately exempt.** An avatar, a dot, an icon button and a
badge are shapes rather than corners; squaring an avatar off because the cards are square
is not consistency. They stay `50%` and `999px` at every setting.

A single block can be overridden under **Advanced → Corner radius**, which reads `auto`
until you touch it. Everything proportional inside that block follows, so the block stays
internally consistent rather than becoming a mix of two scales.

Some blocks are flat by default and so have nothing for the slider to do — Accordion
ships as hairline rules, Feature Grid as bare items. Give them a surface (**Variant →
Cards**, **Card treatment → Outlined**) and they follow the token immediately. Bento Grid
used to be the real exception, with its own private 22px that the project slider could
not reach; its tile radius is now derived like everything else, and it can still be
pinned to an absolute value for one block if you want it.

### Using a webfont

**Inter is the default and needs no setup.** Picking it emits the Google Fonts `@import`
for you, over the weight range 400–800 so nothing the components ask for gets synthesised
into a fake bold. It's the one difference between **Inter** and **Inter if installed,
else Helvetica** in the font list: the second names the same family but imports nothing,
so it only resolves for visitors who already have Inter locally. Pick that one, or
**System UI**, if you'd rather exports made no external request at all.

Because it's an `@import`, an editor that strips them leaves the fallback stack —
Helvetica Neue, Helvetica, Arial — which is why the stack has real names in it rather
than ending at `sans-serif`.

For any **other** font, two settings, and both are required — importing a font does not
switch to it:

1. **Design tokens → Typography → Webfont @import URL** — paste the Google Fonts URL
2. **Font stack** — choose **The webfont imported below**

The family name is read out of the URL, so `…css2?family=Open+Sans:…` resolves to
`"Open Sans"` with the system stack behind it as a fallback. Choosing that option with
no URL set falls back to the system stack rather than breaking.

The `@import` is emitted as the first rule in the exported CSS, which is the only place
browsers honour it.
**Reveal on scroll is pure CSS** — an `animation-timeline: view()` scroll timeline, no
JavaScript, so it still animates in editors that strip `<script>`. Scroll timelines sit
around 85% support, so it is layered strictly as an enhancement: the block renders
visible by default and only animates where timelines exist *and* the visitor has not
asked for reduced motion. Delete the `animation-timeline` line and nothing disappears —
`test/degrade.html` asserts exactly that.

Overrides are emitted with the root's full class list, so they win on specificity and
source order — no `!important`, and you can still restyle them from your theme.

### Gradients degrade to a solid

Anywhere a gradient sits behind text, the solid colour is stated as `background-color`
and the gradient as `background-image`, never together in the `background` shorthand.
Some sanitisers drop gradient values they don't recognise, and as a shorthand that leaves
the surface with **no background at all** — white text on the page's own white, at 1:1.
Stated separately, the gradient can vanish and the surface is merely flat.

This affects the CTA banner's gradient style (its default), and the brand tone on Bento
Grid tiles and Sticky Stacking Cards. The gradients are fully opaque, so the solid
underneath is never visible while the gradient works.

### Button styling (Design tokens → Buttons)

Buttons come from one shared class, so these are set once and apply to every button in
every component:

| Control | Range |
|---|---|
| **Fully rounded (pill)** | Overrides the corner value below |
| **Button corners** | 0–32px |
| **Size** | Small / Medium / Large — scales padding and label size together |
| **Label weight** | 400–800 |
| **Uppercase labels** | With a separate letter-spacing control, since caps usually need it |
| **Outline thickness** | 1–4px, for secondary/outlined buttons |
| **Hover effect** | Lift / Darken / None |
| **Glow under primary buttons** | On/off |

Shape and typography flow everywhere. Colour intent set by a component is preserved — the
pricing table's tier button keeps its own fill and hairline border, and the CTA banner's
white-on-gradient button stays white, while both still pick up your corner radius and
letter-spacing.

Defaults reproduce the values that were previously hard-coded, so existing projects look
identical until you change something.

### Optional buttons

Blocks that used to have no call to action now carry a **Button** section: a label and a
link, and on some blocks an alignment choice.

**Leave the label empty and no button is rendered** — no empty element, no leftover
spacing. That's the whole toggle; there's no separate on/off switch to keep in sync.

Buttons come at two levels, and both are optional independently.

**One per section**, at the foot of the block:

| Block | Where it sits |
|---|---|
| Pinned Product Scroller | Below the last step |
| Spec Strip | Below the specs (a datasheet link fits well) |
| Finish Switcher | With the copy |
| Feature Grid · Stats Counter · Gallery | Below the grid |
| Timeline | After the last milestone |
| Testimonial Slider | Below the controls |
| Before / After Slider · Video Embed | Below the media |
| Accordion / FAQ | Below the questions |

**One per item**, inside each entry of the repeatable list — open any item in the
Steps / Milestones / Features list and the Button label sits with its other fields:

| Block | List | Button appears |
|---|---|---|
| Pinned Product Scroller | Steps | Under that step's copy |
| Timeline | Milestones | Inside that milestone's card |
| Feature Grid | Features | Under that feature |
| Stats Counter | Stats | Under that number |
| Spec Strip | Specs | Under that spec |
| Accordion / FAQ | Questions | At the end of that answer |
| Testimonial Slider | Testimonials | Under that quote |
| Gallery | Images | Under that image |
| Finish Switcher | Finishes | Swaps with the selected swatch |

Card Grid, Hero Slider, Pricing, Tabs, Carousel, Logo Marquee, Bento Grid, Sticky Stack
and the Interactive Diagram already had per-item links and are unchanged.

Two of these needed care:

- **Gallery.** With the lightbox on, the tile itself is a `<button>`, and an `<a>` can't
  legally nest inside one. So when any image is given a link the tile gains a wrapper and
  the link becomes its sibling. The wrapper only appears when it's needed, so galleries
  without links produce byte-identical markup and pixel-identical layout.
- **Finish Switcher.** The button swaps with the selected swatch, driven by the same
  `:has()` rule as the image crossfade — no JavaScript. Hidden buttons use `display: none`
  rather than transparency, so they stay out of the tab order; an invisible but focusable
  link is worse than no link.

All of them use the same shared class as every other button, so they pick up the Buttons
tokens above without any extra work.

**Alignment follows whatever the button sits in.** A button in a right-aligned timeline
card goes right; one in a centred quote goes centre; the timeline's own cards flip sides
on mobile and the buttons flip with them. Nothing to configure.

This is why the row is a plain block with an inline-level button rather than a flex row:
flex containers ignore `text-align`, so a flex row would have to be told its alignment at
every single placement, and would silently go wrong whenever the surrounding alignment
changed. Item containers that are flex columns get `align-self: stretch` on the row so
`text-align` still reaches it.

### Hero Slider controls (Control styling)

The arrows and dots are styled independently of the page's buttons, since they sit over
imagery rather than on the page background:

| Control | Options |
|---|---|
| **Control colour** | One colour drives arrows and dots |
| **Arrow style** | Frosted glass · Solid fill · Outline · No background |
| **Arrow shape** | Circle · Rounded square · Square |
| **Arrow size** | 28–68px |
| **Arrow weight** | Hairline · Thin · Regular · Bold |
| **Arrow position** | In the row with the dots, or pinned to the left and right edges |
| **Dot style** | Expanding bar · Dot · Ring |
| **Dot size** | 6–18px |

On a **solid fill** the glyph flips to whichever of black or white reads against your
colour, so a pale control colour doesn't produce an invisible chevron.

The chevron is **drawn, not typed**. A text character (`‹`) is whatever weight the
inherited font makes it — heavy, different in every font, and a host theme can swap the
font out from under it. A stroked path is the same clean shape everywhere, sits at 42% of
the button rather than 50%, and takes a real weight control. It reads `currentColor`, so
there is no span for a host's blanket text colour to hijack.

**The tap target stays at least 44px** however small the visible button is set, so a
28px arrow is still comfortable on a phone.

**Swipe on touch screens** is on by default. A horizontal drag changes banner; a vertical
one still scrolls the page, and a drag under 45px is ignored so a tap near the edge never
jumps a slide. Swiping counts as a deliberate choice, so it stops autoplay the same way
pressing an arrow does. The listeners are passive and only attach on touch-capable
devices; with the toggle off the code isn't emitted at all.

### Starting from a page

A first run opens on an empty canvas. It used to seed five blocks, which meant the first
thing anyone did was delete somebody else's page.

Four starters sit above the component list instead, each dropping a ready arrangement you
can edit down: **Landing page**, **Product page**, **Capability page**, **Support page**.
Search finds them by name too. Quicker than deciding which of 27 blocks belong together
before you've seen any of them.

### Contrast, while you choose

The Design tokens panel shows a live ratio and WCAG grade for the pairs the palette
actually puts together — body text on surface, muted text, button labels on the brand
fill. A colour picker will happily hand you an unreadable combination and say nothing;
twice that shipped here as a bug before this existed.

### Storage budget

Uploaded images are stored inline, so a few photos can walk a project toward the
browser's ~5 MB per-origin limit. Past it, autosave simply stops. A badge appears in the
top bar once you're over halfway and turns red near the edge — use **Save file** to keep
a copy, or point image fields at URLs instead of uploading.

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
js/freshness.js         Notices when the browser is holding a stale index.html
version.txt             Build id, written by bump.sh; what freshness.js compares against
js/components/
  heroes.js             parallax-banner, video-hero, split-hero, cta-banner, hero-slider
  content.js            card-grid, feature-grid, stats-counter, timeline, pricing
  interactive.js        accordion, tabs, carousel, testimonials
  media.js              before-after, gallery, logo-marquee, countdown, video-embed
  modern.js             bento-grid, sticky-stack (both zero-JS)
  product.js            finish-switcher, pinned-product, spec-strip
  diagram.js            hotspot-diagram
test/
  gallery.html          Renders all 27 through the real export path; reports failures
  hostile-host.html     Pastes exports into a deliberately awful theme; 165 assertions
  wysiwyg.html          Drives TinyMCE, GrapesJS, Quill and DOMPurify for real;
                        200 round-trips, then functionally probes what survives
  degrade.html          Removes one CSS capability at a time (background-clip,
                        gradients, clip-path, backdrop-filter, images, scroll
                        timelines) and reports text that becomes unreadable.
                        Shares preflight's backdrop resolver — 0 findings,
                        and it means it: 82% of text is judged, the rest
                        genuinely sits over imagery
  typography.html       Moves each type control and asserts the specific element
                        it is meant to reach, so the tokens cannot quietly go
                        inert, and that a control a component cannot use
                        is not offered at all; 31 assertions
  preflight.html        Asserts the findings are actionable: nothing fires on an
                        untouched project, everything fires once a real image
                        goes in undescribed; 14 assertions
  freshness.html        Asserts the build check corrects a genuinely stale page and,
                        just as importantly, leaves every other case alone; 14 assertions
  defaults.html         Pins what a brand new project ships as — Inter actually
                        imported rather than merely named, 1px button corners —
                        since a default that reverts is invisible until an
                        export is already out the door; 14 assertions
  radius.html           Asserts one slider reaches every rounded container and
                        that circles and pills are left alone, and fails if any
                        container drifts onto a bare pixel radius; 19 assertions
  probes.js             Per-component functional assertions, shared by the harnesses

Every test page loads the source with a timestamp. None of them carried a version
query and bump.sh only versions index.html, so a browser would happily report on the
copy it fetched ten minutes ago — which is how one intermittent carousel failure
survived two rounds of "fixes" that were never actually running.
```

Open the files in `test/` in a browser — each prints a pass/fail banner at the top.
`wysiwyg.html` loads the editor engines from a CDN, so it needs a network connection;
the others are fully offline.

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













