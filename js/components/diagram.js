/* ============================================================================
   Interactive Diagram (hotspot map)

   Where this differs from the usual hotspot library:

   1. No floating popovers. Detail sits in a docked panel — beside the diagram
      on desktop, below it on mobile. Flip/shift logic only moves the problem
      around: on a 390px screen a popover covers the thing you are reading.
   2. The core is CSS-only. Selection, detail, zoom-to-point and legend
      filtering are radios plus :has(), so the block still works in editors
      that strip <script>, where every hotspot library dies completely.
   3. The legend filters rather than just labelling.
   4. A stepper means you never have to hit a 20px target on a phone.
   5. One set of detail panels — no duplicate text list shadowing the diagram.
   ========================================================================== */
(function () {
  'use strict';

  CB.register({
    id: 'hotspot-diagram',
    name: 'Interactive Diagram',
    category: 'Interactive',
    icon: '⌖',
    blurb: 'Numbered hotspots over an image, with a docked detail panel, zoom-to-point, and a filtering legend. Core works with no JavaScript.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Inside a modern data center' },
      { k: 'sub', t: 'textarea', label: 'Intro copy', value: 'Select a point on the diagram to see the systems and products involved.' },

      { t: 'section', label: 'Diagram' },
      { k: 'image', t: 'image', label: 'Diagram image', value: CB.ph(1600, 1000, '', '#e4ddd5', '#c9c6c1') },
      {
        k: 'alt', t: 'textarea', label: 'Image description',
        value: 'Cutaway diagram of a data center showing power distribution from utility supply through transformers, switchgear and UPS to the server halls.',
        help: 'Describe the diagram as a whole. The hotspot panels below act as its long description.'
      },
      { k: 'ratio', t: 'select', label: 'Aspect ratio', value: '16/10', options: [['16/10', '16 : 10'], ['16/9', '16 : 9'], ['4/3', '4 : 3'], ['3/2', '3 : 2'], ['auto', 'Natural']] },

      { t: 'section', label: 'Categories' },
      {
        k: 'cats', t: 'list', label: 'Categories', itemLabel: 'name',
        fields: [
          { k: 'key', t: 'text', label: 'Key', value: 'cat', help: 'Short id — type this into a hotspot’s Category field.' },
          { k: 'name', t: 'text', label: 'Legend label', value: 'Category' },
          { k: 'color', t: 'color', label: 'Colour', value: '#96694c' }
        ],
        value: [
          { key: 'hv', name: 'High Voltage Power', color: '#7c3aed' },
          { key: 'mv', name: 'Medium Voltage Power', color: '#96694c' },
          { key: 'lv', name: 'Low Voltage Power', color: '#ea580c' },
          { key: 'crit', name: 'Critical Load', color: '#0f9d58' },
          { key: 'data', name: 'Structured Cabling', color: '#eab308' }
        ]
      },

      { t: 'section', label: 'Hotspots' },
      {
        k: 'items', t: 'list', label: 'Hotspots', itemLabel: 'title',
        fields: [
          { k: 'x', t: 'range', label: 'Horizontal position', min: 0, max: 100, step: 0.5, unit: '%', value: 50 },
          { k: 'y', t: 'range', label: 'Vertical position', min: 0, max: 100, step: 0.5, unit: '%', value: 50 },
          { k: 'cat', t: 'text', label: 'Category key', value: 'mv' },
          { k: 'title', t: 'text', label: 'Title', value: 'Hotspot' },
          { k: 'text', t: 'textarea', label: 'Description', value: '' },
          { k: 'meta', t: 'text', label: 'Meta line', value: '', help: 'Small line above the title — a product list, for example.' },
          { k: 'linkText', t: 'text', label: 'Link label', value: '' },
          { k: 'linkUrl', t: 'url', label: 'Link URL', value: '#' }
        ],
        value: [
          { x: 21, y: 24, cat: 'hv', title: 'Utility Power', text: 'Overhead transmission brings high voltage supply onto the site before it is stepped down.', meta: 'ACSR · ACSS · C7', linkText: 'View products', linkUrl: '#' },
          { x: 11, y: 33, cat: 'hv', title: 'HV/MV Transformer', text: 'Steps transmission voltage down to a medium voltage suitable for site distribution.', meta: 'Medium voltage cable', linkText: '', linkUrl: '#' },
          { x: 14, y: 58, cat: 'mv', title: 'MV Switchgear', text: 'Protects and isolates the medium voltage feeders serving each block of the facility.', meta: '', linkText: '', linkUrl: '#' },
          { x: 26, y: 70, cat: 'lv', title: 'Automatic Transfer Switch', text: 'Moves the load to generator supply within seconds of a utility interruption.', meta: '', linkText: '', linkUrl: '#' },
          { x: 21, y: 82, cat: 'lv', title: 'Generator', text: 'Standby generation carries the full critical load until utility supply is restored.', meta: 'Diesel locomotive cable', linkText: '', linkUrl: '#' },
          { x: 48, y: 72, cat: 'crit', title: 'UPS and Batteries', text: 'Bridges the gap between utility loss and generator start, with no break to the critical load.', meta: '', linkText: '', linkUrl: '#' },
          { x: 62, y: 46, cat: 'crit', title: 'Power Distribution Unit', text: 'Final distribution into the data hall, feeding each rack from the critical bus.', meta: '', linkText: '', linkUrl: '#' },
          { x: 55, y: 33, cat: 'data', title: 'Racks and Servers', text: 'Structured cabling ties the compute back to the network core and out of the building.', meta: 'Cat 6A · OM4 fibre', linkText: 'View products', linkUrl: '#' }
        ]
      },

      { t: 'section', label: 'Behaviour' },
      { k: 'detail', t: 'select', label: 'Detail placement', value: 'side', options: [['side', 'Beside the diagram'], ['below', 'Below the diagram']] },
      { k: 'zoom', t: 'range', label: 'Zoom on select', min: 1, max: 3, step: 0.1, unit: '×', value: 1.8, help: '1× turns zooming off. Zooming centres the chosen point so fine detail is legible on a phone.' },
      { k: 'stepper', t: 'toggle', label: 'Previous / next stepper', value: true, help: 'Appears only if scripts run — it saves hitting small targets on touch.' },
      { k: 'legend', t: 'toggle', label: 'Show legend', value: true },
      { k: 'filter', t: 'toggle', label: 'Legend filters the hotspots', value: true },
      { k: 'deepLink', t: 'toggle', label: 'Link to individual hotspots', value: false },

      { t: 'section', label: 'Style' },
      { k: 'pin', t: 'select', label: 'Pin style', value: 'number', options: [['number', 'Numbered'], ['dot', 'Plain dot']] },
      { k: 'pinSize', t: 'range', label: 'Pin size', min: 18, max: 44, step: 2, unit: 'px', value: 28 },
      { k: 'pulse', t: 'toggle', label: 'Pulse unselected pins', value: true },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 160, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var cats = (p.cats || []).filter(Boolean);
      var group = 'cb-hs-' + c.cls;
      var zoom = c.num(p.zoom, 1.8);

      function catColor(key) {
        for (var i = 0; i < cats.length; i++) if (cats[i].key === key) return cats[i].color;
        return 'var(--cb-brand)';
      }

      /* One node per hotspot: the radio, the visible pin, and its accessible
         name. No parallel text list to keep in sync. */
      var pins = items.map(function (it, i) {
        return c.dedent(`
          <label class="cb-hs__pin" data-i="${i}" data-cat="${c.attr(it.cat)}"
                 style="--cb-x: ${c.clamp(c.num(it.x, 50), 0, 100)}%; --cb-y: ${c.clamp(c.num(it.y, 50), 0, 100)}%; --cb-pc: ${c.attr(catColor(it.cat))}">
            <input class="cb-hs__radio" type="radio" name="${c.attr(group)}" data-i="${i}"${i === 0 ? ' checked' : ''}>
            <span class="cb-hs__dot" aria-hidden="true">${p.pin === 'number' ? (i + 1) : ''}</span>
            <span class="cb-sr">${i + 1}. ${c.esc(it.title)}</span>
          </label>`);
      }).join('\n');

      var panels = items.map(function (it, i) {
        return c.dedent(`
          <article class="cb-hs__detail" data-i="${i}">
            <span class="cb-hs__badge" style="--cb-pc: ${c.attr(catColor(it.cat))}">${i + 1}</span>
            ${it.meta ? '<p class="cb-hs__meta">' + c.esc(it.meta) + '</p>' : ''}
            <h3 class="cb-hs__dTitle">${c.esc(it.title)}</h3>
            ${it.text ? '<p class="cb-hs__dText">' + c.rich(it.text) + '</p>' : ''}
            ${it.linkText ? '<a class="cb-hs__dLink" href="' + c.url(it.linkUrl) + '">' + c.esc(it.linkText) + ' <span aria-hidden="true">&rarr;</span></a>' : ''}
          </article>`);
      }).join('\n');

      var legend = (p.legend && cats.length) ? c.dedent(`
        <fieldset class="cb-hs__legend">
          <legend class="cb-sr">${p.filter ? 'Filter the diagram by system' : 'Diagram key'}</legend>
${cats.map(function (cat) {
  return '          <label class="cb-hs__cat">' +
    (p.filter ? '<input class="cb-hs__catBox" type="checkbox" data-cat="' + c.attr(cat.key) + '" checked>' : '') +
    '<span class="cb-hs__swatch" style="--cb-pc: ' + c.attr(cat.color) + '"></span>' +
    '<span class="cb-hs__catName">' + c.esc(cat.name) + '</span></label>';
}).join('\n')}
        </fieldset>`) : '';

      var html = c.dedent(`
        <section class="${c.cls} cb-hs">
          <div class="cb-wrap">
            ${(p.title || p.sub) ? `<header class="cb-hs__head">
              ${p.title ? '<h2 class="cb-hs__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-hs__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            ${legend}
            <div class="cb-hs__layout">
              <div class="cb-hs__figure">
                <div class="cb-hs__viewport">
                  <div class="cb-hs__frame">
                    <img class="cb-hs__img" src="${c.url(p.image)}" alt="${c.attr(p.alt)}" loading="lazy" decoding="async">
                    <fieldset class="cb-hs__pins">
                      <legend class="cb-sr">Choose a point on the diagram</legend>
${c.indent(pins, 22)}
                    </fieldset>
                  </div>
                </div>
                ${p.stepper ? `<div class="cb-hs__stepper" hidden>
                  <button type="button" class="cb-hs__step cb-hs__prev" aria-label="Previous hotspot"><span aria-hidden="true">&#8249;</span></button>
                  <span class="cb-hs__count"></span>
                  <button type="button" class="cb-hs__step cb-hs__next" aria-label="Next hotspot"><span aria-hidden="true">&#8250;</span></button>
                </div>` : ''}
              </div>
              <div class="cb-hs__panel" aria-live="polite">
${c.indent(panels, 16)}
              </div>
            </div>
          </div>
        </section>`);

      /* Selection rules: which panel shows, which pin reads as active, and
         where the frame zooms to. All from the checked radio. */
      var sel = items.map(function (it, i) {
        var x = c.clamp(c.num(it.x, 50), 0, 100), y = c.clamp(c.num(it.y, 50), 0, 100);
        return c.dedent(`
          ${s}:has(.cb-hs__radio[data-i="${i}"]:checked) .cb-hs__detail[data-i="${i}"] { display: flex; }
          ${s}:has(.cb-hs__radio[data-i="${i}"]:checked) .cb-hs__pin[data-i="${i}"] { z-index: 3; }
          ${s}:has(.cb-hs__radio[data-i="${i}"]:checked) .cb-hs__pin[data-i="${i}"] .cb-hs__dot {
            background: var(--cb-pc); color: #fff; scale: calc(1.18 / var(--cb-z));
          }` + (zoom > 1 ? `
          ${s}:has(.cb-hs__radio[data-i="${i}"]:checked) .cb-hs__frame {
            --cb-z: ${zoom}; transform-origin: ${x}% ${y}%;
          }` : ''));
      }).join('\n');

      var filterRules = (p.legend && p.filter) ? cats.map(function (cat) {
        return `${s}:has(.cb-hs__catBox[data-cat="${c.attr(cat.key)}"]:not(:checked)) .cb-hs__pin[data-cat="${c.attr(cat.key)}"] { opacity: .16; pointer-events: none; }`;
      }).join('\n        ') : '';

      var css = `
        ${s}.cb-hs { background: ${p.bg}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-hs__head { max-width: 640px; margin-bottom: 24px; }
        ${s} .cb-hs__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
        ${s} .cb-hs__sub { color: var(--cb-muted); margin-top: 10px; }

        ${s} .cb-hs__legend {
          display: flex; flex-wrap: wrap; gap: 8px 18px;
          border: 0; padding: 0; margin: 0 0 20px; min-inline-size: 0;
        }
        ${s} .cb-hs__cat {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: .86em; font-weight: 600; ${p.filter ? 'cursor: pointer;' : ''}
          padding: 5px 2px; ${p.filter ? 'transition: opacity .2s ease;' : ''}
        }
        ${p.filter ? `${s} .cb-hs__cat:has(.cb-hs__catBox:not(:checked)) { opacity: .4; }` : ''}
        ${s} .cb-hs__catBox { position: absolute; opacity: 0; width: 1px; height: 1px; }
        ${s} .cb-hs__swatch {
          width: 22px; height: 5px; border-radius: 3px; background: var(--cb-pc); flex: 0 0 auto;
        }
        ${s} .cb-hs__catBox:focus-visible ~ .cb-hs__catName { outline: 2px solid var(--cb-brand); outline-offset: 3px; }

        ${s} .cb-hs__layout {
          display: grid; gap: clamp(16px, 2.5vw, 28px); align-items: start;
          grid-template-columns: ${p.detail === 'side' ? 'minmax(0, 1.6fr) minmax(0, 1fr)' : 'minmax(0, 1fr)'};
        }
        ${s} .cb-hs__viewport {
          position: relative; overflow: hidden;
          border-radius: var(--cb-radius); background: var(--cb-subtle);
          ${p.ratio !== 'auto' ? 'aspect-ratio: ' + p.ratio + ';' : ''}
        }
        ${s} .cb-hs__frame {
          --cb-z: 1;
          position: relative; width: 100%; height: 100%;
          transform: scale(var(--cb-z));
          transition: transform .55s cubic-bezier(.3,.7,.3,1);
        }
        ${s} .cb-hs__img { width: 100%; height: 100%; object-fit: contain; }
        ${s} .cb-hs__pins { border: 0; padding: 0; margin: 0; min-inline-size: 0; }

        ${s} .cb-hs__pin {
          position: absolute; left: var(--cb-x); top: var(--cb-y);
          translate: -50% -50%; z-index: 2;
          display: grid; place-items: center; cursor: pointer;
        }
        /* Keeps a 44px touch target however small the pin is drawn. */
        ${s} .cb-hs__pin::after {
          content: ""; position: absolute; left: 50%; top: 50%;
          width: max(44px, ${c.num(p.pinSize, 28)}px); height: max(44px, ${c.num(p.pinSize, 28)}px);
          translate: -50% -50%; border-radius: 50%;
        }
        ${s} .cb-hs__radio { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; }
        ${s} .cb-hs__dot {
          display: grid; place-items: center;
          width: ${c.num(p.pinSize, 28)}px; height: ${c.num(p.pinSize, 28)}px;
          border-radius: 50%; background: #fff; color: var(--cb-pc);
          border: 2px solid var(--cb-pc);
          font-size: ${Math.round(c.num(p.pinSize, 28) * 0.44)}px; font-weight: 800; line-height: 1;
          font-variant-numeric: tabular-nums;
          box-shadow: 0 2px 10px rgba(20,18,16,.35);
          scale: calc(1 / var(--cb-z));
          transition: background .25s ease, color .25s ease, scale .35s ease;
        }
        ${s} .cb-hs__pin:hover .cb-hs__dot { background: var(--cb-pc); color: #fff; }
        ${s} .cb-hs__radio:focus-visible ~ .cb-hs__dot {
          outline: 3px solid var(--cb-brand); outline-offset: 3px;
        }
        ${p.pulse ? `
        ${s} .cb-hs__pin .cb-hs__dot::before {
          content: ""; position: absolute; inset: -2px; border-radius: 50%;
          border: 2px solid var(--cb-pc);
          animation: cb-hs-pulse-${c.cls} 2.4s ease-out infinite;
        }
        ${s}:has(.cb-hs__radio:checked) .cb-hs__pin:has(.cb-hs__radio:checked) .cb-hs__dot::before { display: none; }
        @keyframes cb-hs-pulse-${c.cls} {
          0% { opacity: .8; transform: scale(1); }
          70%, 100% { opacity: 0; transform: scale(2.1); }
        }` : ''}

        ${sel}
        ${filterRules}

        ${s} .cb-hs__stepper {
          display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 14px;
        }
        ${s} .cb-hs__step {
          width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
          border: 1px solid var(--cb-border); background: var(--cb-surface);
          font-size: 21px; line-height: 1; transition: all .2s ease;
        }
        ${s} .cb-hs__step:hover { background: var(--cb-brand); color: var(--cb-on-brand); border-color: var(--cb-brand); }
        ${s} .cb-hs__count { font-size: .88em; font-weight: 650; color: var(--cb-muted); font-variant-numeric: tabular-nums; min-width: 6ch; text-align: center; }

        ${s} .cb-hs__panel {
          ${p.detail === 'side' ? 'position: sticky; top: 24px;' : ''}
          background: var(--cb-subtle); border: 1px solid var(--cb-border);
          border-radius: var(--cb-radius); padding: clamp(20px, 3vw, 28px);
          min-height: 200px;
        }
        ${s} .cb-hs__detail { display: none; flex-direction: column; gap: 10px; }
        ${s} .cb-hs__badge {
          display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%;
          background: var(--cb-pc); color: #fff; font-size: .82em; font-weight: 800;
          font-variant-numeric: tabular-nums; margin-bottom: 2px;
        }
        ${s} .cb-hs__meta {
          font-size: .76em; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--cb-muted);
        }
        ${s} .cb-hs__dTitle { font-size: clamp(19px, 2.2vw, 24px); font-weight: 760; letter-spacing: -.015em; line-height: 1.2; }
        ${s} .cb-hs__dText { color: var(--cb-muted); }
        ${s} .cb-hs__dLink { color: var(--cb-brand); font-weight: 650; text-decoration: none; width: max-content; margin-top: 4px; }
        ${s} .cb-hs__dLink:hover { text-decoration: underline; }

        /* Nothing checked — which a duplicated radio group would cause — still
           shows the first hotspot rather than an empty panel. */
        ${s}:not(:has(.cb-hs__radio:checked)) .cb-hs__detail[data-i="0"] { display: flex; }

        @media (max-width: 860px) {
          /* Detail always drops below the diagram. A floating popover at this
             width covers the diagram it is describing. */
          ${s} .cb-hs__layout { grid-template-columns: minmax(0, 1fr); }
          ${s} .cb-hs__panel { position: static; }
        }
        @media (prefers-reduced-motion: reduce) {
          ${s} .cb-hs__frame { transition: none; }
        }
        @supports not selector(:has(*)) {
          ${s} .cb-hs__detail[data-i="0"] { display: flex; }
        }`;

      var js = c.wrap(c.cls, `
        var radios = Array.prototype.slice.call(root.querySelectorAll(".cb-hs__radio"));
        if (!radios.length) return;

        /* Radio groups are document-wide, so a duplicated paste would fight
           over the selection. Everything else here is enhancement. */
        if (copy > 0) {
          radios.forEach(function (r) { r.name = r.name + "-" + copy; });
          Array.prototype.forEach.call(root.querySelectorAll(".cb-hs__catBox"), function (b) {
            if (b.name) b.name = b.name + "-" + copy;
          });
        }

        function current() {
          for (var i = 0; i < radios.length; i++) if (radios[i].checked) return i;
          return 0;
        }
        function select(i, focus) {
          i = (i + radios.length) % radios.length;
          radios[i].checked = true;
          radios[i].dispatchEvent(new Event("change", { bubbles: true }));
          if (focus) radios[i].focus();
          sync();
        }

        var stepper = root.querySelector(".cb-hs__stepper");
        var count = root.querySelector(".cb-hs__count");
        function sync() {
          if (count) count.textContent = (current() + 1) + " / " + radios.length;
        }

        /* The stepper is markup-hidden until scripts run, so it never appears
           as a dead control where JavaScript has been stripped. */
        if (stepper) {
          stepper.hidden = false;
          root.querySelector(".cb-hs__prev").addEventListener("click", function () { select(current() - 1, true); });
          root.querySelector(".cb-hs__next").addEventListener("click", function () { select(current() + 1, true); });
        }
        radios.forEach(function (r) { r.addEventListener("change", sync); });
        sync();
${p.deepLink ? `
        function slug(i) {
          var t = radios[i].parentNode.textContent || "";
          return t.toLowerCase().trim().replace(/^\\d+\\.\\s*/, "")
                  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
        }
        radios.forEach(function (r, i) {
          r.addEventListener("change", function () {
            if (r.checked && history.replaceState) history.replaceState(null, "", "#" + slug(i));
          });
        });
        function fromHash() {
          var want = (location.hash || "").replace(/^#/, "");
          if (!want) return;
          for (var i = 0; i < radios.length; i++) {
            if (slug(i) === want) { select(i, false); root.scrollIntoView({ block: "start" }); return; }
          }
        }
        fromHash();
        window.addEventListener("hashchange", fromHash);` : ''}`);

      return { html: html, css: css, js: js };
    }
  });
})();
