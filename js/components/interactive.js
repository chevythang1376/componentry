/* ============================================================================
   Interactive — accordion, tabs, carousel, testimonials
   All follow the WAI-ARIA Authoring Practices patterns.
   ========================================================================== */
(function () {
  'use strict';

  var CAT = 'Interactive';

  /* --------------------------------------------------------------------- */
  /* Accordion                                                              */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'accordion',
    name: 'Accordion / FAQ',
    category: CAT,
    icon: '☰',
    blurb: 'APG accordion pattern: heading > button, aria-expanded, aria-controls, arrow-key navigation. Optional FAQPage schema.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Frequently asked questions' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: '' },

      { t: 'section', label: 'Items' },
      {
        k: 'items', t: 'list', label: 'Questions',
        itemLabel: 'q',
        fields: [
          { k: 'q', t: 'text', label: 'Question', value: 'New question' },
          { k: 'a', t: 'textarea', label: 'Answer', value: 'Answer copy goes here.' }
        ],
        value: [
          { q: 'Will this work inside my page builder?', a: 'Yes. Every block ships as a single self-contained snippet — markup, scoped styles and behaviour — so it drops into any HTML embed field without touching the rest of your theme.' },
          { q: 'Do I need a build step or a framework?', a: 'No. The output is plain HTML, CSS and vanilla JavaScript with zero dependencies. Paste it and it runs.' },
          { q: 'What about accessibility?', a: 'Interactive blocks follow the WAI-ARIA Authoring Practices: correct roles, keyboard support, focus management and reduced-motion handling are built in.' },
          { q: 'Can I paste the same component twice on one page?', a: 'Yes. Styles are scoped to a generated class and the script guards against double-initialisation, so duplicates never collide.' }
        ]
      },

      { t: 'section', label: 'Behaviour' },
      { k: 'multi', t: 'toggle', label: 'Allow multiple open', value: false },
      { k: 'firstOpen', t: 'toggle', label: 'Open first item', value: true },
      { k: 'schema', t: 'toggle', label: 'Emit FAQPage structured data', value: false, help: 'Adds JSON-LD for rich results. Only use when the content really is a FAQ.' },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Variant', value: 'divided', options: [['divided', 'Divided lines'], ['cards', 'Separate cards'], ['boxed', 'Single bordered box']] },
      { k: 'marker', t: 'select', label: 'Marker', value: 'chevron', options: [['chevron', 'Chevron'], ['plus', 'Plus / minus'], ['none', 'None']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 72 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(function (i) { return i && (i.q || i.a); });
      var base = c.cls;

      var rows = items.map(function (it, i) {
        var open = p.firstOpen && i === 0;
        var bid = base + '-b' + i, pid = base + '-p' + i;
        return c.dedent(`
          <div class="cb-acc__item"${open ? ' data-open="1"' : ''}>
            <h3 class="cb-acc__h">
              <button type="button" class="cb-acc__btn" id="${bid}" aria-expanded="${open ? 'true' : 'false'}" aria-controls="${pid}">
                <span class="cb-acc__q">${c.esc(it.q)}</span>
                ${p.marker !== 'none' ? '<span class="cb-acc__marker" aria-hidden="true"></span>' : ''}
              </button>
            </h3>
            <div class="cb-acc__panel" id="${pid}" role="region" aria-labelledby="${bid}"${open ? '' : ' inert'}>
              <div class="cb-acc__panelIn"><div class="cb-acc__a">${c.rich(it.a)}</div></div>
            </div>
          </div>`);
      }).join('\n');

      var schema = '';
      if (p.schema && items.length) {
        var data = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map(function (it) {
            return {
              '@type': 'Question',
              name: String(it.q || ''),
              acceptedAnswer: { '@type': 'Answer', text: String(it.a || '') }
            };
          })
        };
        schema = '\n  <script type="application/ld+json">' +
          JSON.stringify(data, null, 2).replace(/</g, '\\u003c') + '<\/script>';
      }

      var html = c.dedent(`
        <section class="${c.cls} cb-acc">
          <div class="cb-wrap">
            ${(p.title || p.sub) ? `<header class="cb-acc__head">
              ${p.title ? '<h2 class="cb-acc__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-acc__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <div class="cb-acc__list">
        ${c.indent(rows, 6)}
            </div>
          </div>${schema}
        </section>`);

      var variantCss = {
        divided: `
          ${s} .cb-acc__item { border-bottom: 1px solid var(--cb-border); }
          ${s} .cb-acc__item:first-child { border-top: 1px solid var(--cb-border); }`,
        cards: `
          ${s} .cb-acc__list { display: flex; flex-direction: column; gap: 12px; }
          ${s} .cb-acc__item {
            border: 1px solid var(--cb-border); border-radius: var(--cb-radius);
            background: var(--cb-surface); transition: border-color .2s ease, box-shadow .2s ease;
          }
          ${s} .cb-acc__item[data-open] { border-color: var(--cb-brand); box-shadow: 0 10px 30px -18px var(--cb-brand); }`,
        boxed: `
          ${s} .cb-acc__list { border: 1px solid var(--cb-border); border-radius: var(--cb-radius); overflow: hidden; background: var(--cb-surface); }
          ${s} .cb-acc__item + .cb-acc__item { border-top: 1px solid var(--cb-border); }`
      }[p.variant] || '';

      var markerCss = p.marker === 'plus' ? `
        ${s} .cb-acc__marker::before, ${s} .cb-acc__marker::after {
          content: ""; position: absolute; inset: 50% 0 auto 0; height: 2px; margin-top: -1px;
          background: currentColor; border-radius: 2px; transition: transform .3s ease, opacity .3s ease;
        }
        ${s} .cb-acc__marker::after { transform: rotate(90deg); }
        ${s} .cb-acc__item[data-open] .cb-acc__marker::after { transform: rotate(0deg); opacity: 0; }`
        : p.marker === 'chevron' ? `
        ${s} .cb-acc__marker::before {
          content: ""; position: absolute; left: 4px; top: 5px;
          width: 9px; height: 9px; border: solid currentColor; border-width: 0 2px 2px 0;
          rotate: 45deg; transition: rotate .3s ease, top .3s ease;
        }
        ${s} .cb-acc__item[data-open] .cb-acc__marker::before { rotate: 225deg; top: 9px; }` : '';

      var css = `
        ${s}.cb-acc { background: ${p.bg}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-acc__head { margin-bottom: 32px; max-width: 640px; }
        ${s} .cb-acc__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
        ${s} .cb-acc__sub { color: var(--cb-muted); margin-top: 10px; }
        ${variantCss}
        ${s} .cb-acc__h { margin: 0; font-size: inherit; font-weight: inherit; }
        ${s} .cb-acc__btn {
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
          width: 100%; text-align: left; padding: 20px ${p.variant === 'divided' ? '4px' : '22px'};
          font-size: 1.05em; font-weight: 650; color: var(--cb-ink);
          transition: color .2s ease;
        }
        ${s} .cb-acc__btn:hover { color: var(--cb-brand); }
        ${s} .cb-acc__item[data-open] .cb-acc__btn { color: var(--cb-brand); }
        ${s} .cb-acc__q { flex: 1 1 auto; }
        ${s} .cb-acc__marker {
          position: relative; flex: 0 0 18px; width: 18px; height: 18px; color: currentColor;
        }
        ${markerCss}
        ${s} .cb-acc__panel {
          display: grid; grid-template-rows: 0fr;
          transition: grid-template-rows .32s cubic-bezier(.4,0,.2,1);
        }
        ${s} .cb-acc__item[data-open] .cb-acc__panel { grid-template-rows: 1fr; }
        ${s} .cb-acc__panelIn { overflow: hidden; }
        ${s} .cb-acc__a {
          padding: 0 ${p.variant === 'divided' ? '4px' : '22px'} 22px;
          color: var(--cb-muted); max-width: 68ch;
        }`;

      var js = c.wrap(c.cls, `
        var items = Array.prototype.slice.call(root.querySelectorAll(".cb-acc__item"));
        var buttons = items.map(function (i) { return i.querySelector(".cb-acc__btn"); });
        var multi = ${p.multi ? 'true' : 'false'};

        function setOpen(item, open) {
          var btn = item.querySelector(".cb-acc__btn");
          var panel = item.querySelector(".cb-acc__panel");
          if (open) { item.setAttribute("data-open", "1"); panel.removeAttribute("inert"); }
          else { item.removeAttribute("data-open"); panel.setAttribute("inert", ""); }
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        }

        items.forEach(function (item) {
          item.querySelector(".cb-acc__btn").addEventListener("click", function () {
            var open = item.hasAttribute("data-open");
            if (!multi && !open) items.forEach(function (o) { if (o !== item) setOpen(o, false); });
            setOpen(item, !open);
          });
        });

        /* APG: Up/Down move between headers, Home/End jump to the ends. */
        root.addEventListener("keydown", function (e) {
          var idx = buttons.indexOf(document.activeElement);
          if (idx === -1) return;
          var next = -1;
          if (e.key === "ArrowDown") next = (idx + 1) % buttons.length;
          else if (e.key === "ArrowUp") next = (idx - 1 + buttons.length) % buttons.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = buttons.length - 1;
          if (next > -1) { e.preventDefault(); buttons[next].focus(); }
        });`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Tabs                                                                   */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'tabs',
    name: 'Tabs',
    category: CAT,
    icon: '⊞',
    blurb: 'APG tabs pattern with roving tabindex and arrow-key navigation. Scrolls horizontally on mobile.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'How it works' },

      { t: 'section', label: 'Tabs' },
      {
        k: 'items', t: 'list', label: 'Tabs', itemLabel: 'label',
        fields: [
          { k: 'label', t: 'text', label: 'Tab label', value: 'New tab' },
          { k: 'heading', t: 'text', label: 'Panel heading', value: 'Panel heading' },
          { k: 'body', t: 'textarea', label: 'Panel copy', value: 'Panel copy goes here.' },
          { k: 'image', t: 'image', label: 'Panel image', value: '' },
          { k: 'linkText', t: 'text', label: 'Link label', value: '' },
          { k: 'linkUrl', t: 'url', label: 'Link URL', value: '#' }
        ],
        value: [
          { label: 'Pick', heading: 'Start from a real pattern', body: 'Choose from banners, carousels, accordions, pricing tables and more — every one built to the conventions people already expect.', image: CB.ph(900, 560, '', '#4f46e5', '#0891b2'), linkText: '', linkUrl: '#' },
          { label: 'Edit', heading: 'Change anything that matters', body: 'Copy, colours, spacing, imagery, timings and behaviour — all editable, with the preview updating as you type.', image: CB.ph(900, 560, '', '#7c3aed', '#db2777'), linkText: '', linkUrl: '#' },
          { label: 'Export', heading: 'Paste it and move on', body: 'Take a single self-contained snippet, or split HTML, CSS and JS into your builder’s separate fields.', image: CB.ph(900, 560, '', '#0891b2', '#22c55e'), linkText: '', linkUrl: '#' }
        ]
      },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Tab style', value: 'underline', options: [['underline', 'Underline'], ['pill', 'Pills'], ['segmented', 'Segmented control']] },
      { k: 'align', t: 'select', label: 'Tab alignment', value: 'left', options: [['left', 'Left'], ['center', 'Center'], ['stretch', 'Full width']] },
      { k: 'layout', t: 'select', label: 'Panel layout', value: 'split', options: [['split', 'Text + image'], ['text', 'Text only']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 72 }
    ],

    render: function (p, c) {
      var s = c.s, base = c.cls;
      var items = (p.items || []).filter(Boolean);

      var tabs = items.map(function (it, i) {
        return '<button type="button" role="tab" class="cb-tabs__tab" id="' + base + '-t' + i + '" ' +
          'aria-controls="' + base + '-pane' + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? '0' : '-1') + '">' +
          c.esc(it.label) + '</button>';
      }).join('\n');

      var panes = items.map(function (it, i) {
        var media = (p.layout === 'split' && it.image)
          ? '<div class="cb-tabs__media"><img src="' + c.url(it.image) + '" alt="" loading="lazy" decoding="async"></div>' : '';
        return c.dedent(`
          <div role="tabpanel" class="cb-tabs__pane" id="${base}-pane${i}" aria-labelledby="${base}-t${i}" tabindex="0"${i === 0 ? '' : ' hidden'}>
            <div class="cb-tabs__paneIn">
              <div class="cb-tabs__copy">
                ${it.heading ? '<h3 class="cb-tabs__h">' + c.esc(it.heading) + '</h3>' : ''}
                ${it.body ? '<p class="cb-tabs__body">' + c.rich(it.body) + '</p>' : ''}
                ${it.linkText ? '<a class="cb-tabs__link" href="' + c.url(it.linkUrl) + '">' + c.esc(it.linkText) + ' <span aria-hidden="true">&rarr;</span></a>' : ''}
              </div>
              ${media}
            </div>
          </div>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-tabs">
          <div class="cb-wrap">
            ${p.title ? '<h2 class="cb-tabs__title">' + c.rich(p.title) + '</h2>' : ''}
            <div class="cb-tabs__bar">
              <div class="cb-tabs__list" role="tablist" aria-label="${c.attr(p.title || 'Content tabs')}">
        ${c.indent(tabs, 8)}
              </div>
            </div>
        ${c.indent(panes, 4)}
          </div>
        </section>`);

      var variantCss = {
        underline: `
          ${s} .cb-tabs__list { gap: 4px; border-bottom: 1px solid var(--cb-border); }
          ${s} .cb-tabs__tab { padding: 14px 18px; border-bottom: 2px solid transparent; margin-bottom: -1px; }
          ${s} .cb-tabs__tab[aria-selected="true"] { color: var(--cb-brand); border-bottom-color: var(--cb-brand); }`,
        pill: `
          ${s} .cb-tabs__list { gap: 8px; }
          ${s} .cb-tabs__tab { padding: 11px 20px; border-radius: 999px; border: 1px solid var(--cb-border); }
          ${s} .cb-tabs__tab[aria-selected="true"] { background: var(--cb-brand); color: var(--cb-on-brand); border-color: var(--cb-brand); }`,
        segmented: `
          ${s} .cb-tabs__list { gap: 4px; background: var(--cb-subtle); padding: 5px; border-radius: 999px; }
          ${s} .cb-tabs__tab { padding: 10px 20px; border-radius: 999px; }
          ${s} .cb-tabs__tab[aria-selected="true"] { background: var(--cb-surface); color: var(--cb-brand); box-shadow: 0 2px 8px -2px rgba(15,23,42,.2); }`
      }[p.variant] || '';

      var css = `
        ${s}.cb-tabs { background: ${p.bg}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-tabs__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; margin-bottom: 28px; }
        ${s} .cb-tabs__bar { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; margin-bottom: 32px; }
        ${s} .cb-tabs__bar::-webkit-scrollbar { display: none; }
        ${s} .cb-tabs__list {
          display: ${p.align === 'stretch' ? 'grid' : 'inline-flex'};
          ${p.align === 'stretch' ? 'grid-auto-flow: column; grid-auto-columns: 1fr; width: 100%;' : ''}
          ${p.align === 'center' ? 'margin-inline: auto;' : ''}
          min-width: ${p.align === 'stretch' ? 'auto' : 'max-content'};
        }
        ${s} .cb-tabs__bar { ${p.align === 'center' ? 'text-align: center;' : ''} }
        ${s} .cb-tabs__tab {
          font-weight: 650; color: var(--cb-muted); white-space: nowrap;
          transition: color .2s ease, background-color .2s ease, border-color .2s ease;
        }
        ${s} .cb-tabs__tab:hover { color: var(--cb-ink); }
        ${variantCss}
        ${s} .cb-tabs__pane:focus-visible { outline: 3px solid var(--cb-brand); outline-offset: 6px; border-radius: 8px; }
        ${s} .cb-tabs__paneIn {
          display: grid; gap: clamp(24px, 4vw, 48px); align-items: center;
          grid-template-columns: ${p.layout === 'split' ? '1fr 1fr' : '1fr'};
          animation: cb-tabs-in-${c.cls} .35s ease both;
        }
        @keyframes cb-tabs-in-${c.cls} { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        ${s} .cb-tabs__copy { display: flex; flex-direction: column; gap: 14px; ${p.layout === 'text' ? 'max-width: 68ch;' : ''} }
        ${s} .cb-tabs__h { font-size: clamp(20px, 2.6vw, 28px); font-weight: 750; letter-spacing: -.01em; }
        ${s} .cb-tabs__body { color: var(--cb-muted); }
        ${s} .cb-tabs__link { color: var(--cb-brand); font-weight: 650; text-decoration: none; width: max-content; }
        ${s} .cb-tabs__link:hover { text-decoration: underline; }
        ${s} .cb-tabs__media img { width: 100%; border-radius: var(--cb-radius); aspect-ratio: 16/10; object-fit: cover; }
        @media (max-width: 800px) { ${s} .cb-tabs__paneIn { grid-template-columns: 1fr; } }`;

      var js = c.wrap(c.cls, `
        var tabs = Array.prototype.slice.call(root.querySelectorAll("[role=tab]"));
        var panes = Array.prototype.slice.call(root.querySelectorAll("[role=tabpanel]"));
        if (!tabs.length) return;

        function select(idx, focus) {
          tabs.forEach(function (t, i) {
            var on = i === idx;
            t.setAttribute("aria-selected", on ? "true" : "false");
            t.setAttribute("tabindex", on ? "0" : "-1");
            if (panes[i]) panes[i].hidden = !on;
          });
          if (focus) tabs[idx].focus();
          /* Keep the active tab visible in the horizontal scroller. */
          var bar = root.querySelector(".cb-tabs__bar");
          if (bar && bar.scrollWidth > bar.clientWidth) {
            var t = tabs[idx];
            bar.scrollTo({ left: t.offsetLeft - (bar.clientWidth - t.offsetWidth) / 2, behavior: "smooth" });
          }
        }

        tabs.forEach(function (t, i) {
          t.addEventListener("click", function () { select(i, false); });
        });

        root.querySelector("[role=tablist]").addEventListener("keydown", function (e) {
          var i = tabs.indexOf(document.activeElement);
          if (i === -1) return;
          var next = -1;
          if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
          else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = tabs.length - 1;
          if (next > -1) { e.preventDefault(); select(next, true); }
        });`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Carousel                                                               */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'carousel',
    name: 'Image / Video Carousel',
    category: CAT,
    icon: '◀▶',
    blurb: 'Scroll-snap carousel with real touch/trackpad swipe, APG roles, optional autoplay and a rotation control.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Recent work' },

      { t: 'section', label: 'Slides' },
      {
        k: 'items', t: 'list', label: 'Slides', itemLabel: 'caption',
        fields: [
          { k: 'image', t: 'image', label: 'Image', value: CB.ph(1200, 750, '', '#4f46e5', '#0891b2') },
          { k: 'alt', t: 'text', label: 'Alt text', value: '' },
          { k: 'caption', t: 'text', label: 'Caption', value: 'New slide' },
          { k: 'sub', t: 'text', label: 'Sub-caption', value: '' },
          { k: 'linkUrl', t: 'url', label: 'Link URL', value: '' }
        ],
        value: [
          { image: CB.ph(1200, 750, '', '#4f46e5', '#0891b2'), alt: '', caption: 'Northwind rebrand', sub: 'Identity · 2025', linkUrl: '' },
          { image: CB.ph(1200, 750, '', '#7c3aed', '#db2777'), alt: '', caption: 'Atlas dashboard', sub: 'Product design', linkUrl: '' },
          { image: CB.ph(1200, 750, '', '#0891b2', '#22c55e'), alt: '', caption: 'Field guide microsite', sub: 'Web · 2026', linkUrl: '' },
          { image: CB.ph(1200, 750, '', '#ea580c', '#f59e0b'), alt: '', caption: 'Harbour packaging', sub: 'Print', linkUrl: '' },
          { image: CB.ph(1200, 750, '', '#0f766e', '#84cc16'), alt: '', caption: 'Meridian campaign', sub: 'Art direction', linkUrl: '' }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'perView', t: 'range', label: 'Slides per view (desktop)', min: 1, max: 5, step: 1, value: 3 },
      { k: 'perViewTablet', t: 'range', label: 'Slides per view (tablet)', min: 1, max: 4, step: 1, value: 2 },
      { k: 'gap', t: 'range', label: 'Gap', min: 0, max: 48, step: 2, unit: 'px', value: 20 },
      { k: 'ratio', t: 'select', label: 'Slide ratio', value: '4/3', options: [['16/9', '16 : 9'], ['4/3', '4 : 3'], ['1/1', 'Square'], ['3/4', 'Portrait']] },
      { k: 'peek', t: 'toggle', label: 'Peek next slide', value: true },

      { t: 'section', label: 'Controls' },
      { k: 'arrows', t: 'toggle', label: 'Arrows', value: true },
      { k: 'dots', t: 'toggle', label: 'Dots', value: true },
      { k: 'autoplay', t: 'toggle', label: 'Autoplay', value: false },
      { k: 'interval', t: 'range', label: 'Autoplay interval', min: 2, max: 12, step: 1, unit: 's', value: 5, when: { autoplay: [true] } },
      { k: 'captions', t: 'toggle', label: 'Show captions', value: true },

      { t: 'section', label: 'Style' },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 72 }
    ],

    render: function (p, c) {
      var s = c.s, base = c.cls;
      var items = (p.items || []).filter(Boolean);
      var n = items.length;
      var per = c.clamp(c.num(p.perView, 3), 1, 5);
      var perT = c.clamp(c.num(p.perViewTablet, 2), 1, 4);
      var gap = c.num(p.gap, 20);
      var peek = p.peek ? 0.12 : 0;

      function slideWidth(k) {
        // width = (100% - gaps) / k, minus a sliver when peeking
        return 'calc((100% - ' + (k - 1) * gap + 'px) / ' + (k + peek) + ')';
      }

      var slides = items.map(function (it, i) {
        var inner =
          '<img src="' + c.url(it.image) + '" alt="' + c.attr(it.alt) + '" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async">' +
          (p.captions && (it.caption || it.sub)
            ? '<figcaption class="cb-car__cap">' +
              (it.caption ? '<span class="cb-car__capT">' + c.esc(it.caption) + '</span>' : '') +
              (it.sub ? '<span class="cb-car__capS">' + c.esc(it.sub) + '</span>' : '') +
              '</figcaption>' : '');
        var body = it.linkUrl
          ? '<a class="cb-car__link" href="' + c.url(it.linkUrl) + '">' + inner + '</a>'
          : inner;
        return c.dedent(`
          <li class="cb-car__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}">
            <figure class="cb-car__fig">${body}</figure>
          </li>`);
      }).join('\n');

      var dots = p.dots ? items.map(function (it, i) {
        return '<button type="button" class="cb-car__dot" aria-label="Go to slide ' + (i + 1) + '"' +
          (i === 0 ? ' aria-current="true"' : '') + '></button>';
      }).join('') : '';

      var html = c.dedent(`
        <section class="${c.cls} cb-car" aria-roledescription="carousel" aria-label="${c.attr(p.title || 'Carousel')}">
          <div class="cb-wrap">
            ${(p.title || p.arrows) ? `<header class="cb-car__head">
              ${p.title ? '<h2 class="cb-car__title">' + c.rich(p.title) + '</h2>' : '<span></span>'}
              <div class="cb-car__nav">
                ${p.autoplay ? '<button type="button" class="cb-car__ctl cb-car__play" aria-label="Pause slide rotation" data-playing="1"><span class="cb-car__playIcon" aria-hidden="true"></span></button>' : ''}
                ${p.arrows ? `<button type="button" class="cb-car__ctl cb-car__prev" aria-label="Previous slide"><span aria-hidden="true">&#8249;</span></button>
                <button type="button" class="cb-car__ctl cb-car__next" aria-label="Next slide"><span aria-hidden="true">&#8250;</span></button>` : ''}
              </div>
            </header>` : ''}
            <ul class="cb-car__track" id="${base}-track" aria-live="${p.autoplay ? 'off' : 'polite'}">
        ${c.indent(slides, 6)}
            </ul>
            ${p.dots ? '<div class="cb-car__dots" role="group" aria-label="Choose slide">' + dots + '</div>' : ''}
          </div>
        </section>`);

      var css = `
        ${s}.cb-car { background: ${p.bg}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-car__head { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
        ${s} .cb-car__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; }
        ${s} .cb-car__nav { display: flex; gap: 8px; flex-shrink: 0; }
        ${s} .cb-car__ctl {
          width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
          border: 1px solid var(--cb-border); color: var(--cb-ink); font-size: 22px; line-height: 1;
          background: var(--cb-surface); transition: all .2s ease;
        }
        ${s} .cb-car__ctl:hover:not([disabled]) { background: var(--cb-brand); color: var(--cb-on-brand); border-color: var(--cb-brand); }
        ${s} .cb-car__ctl[disabled] { opacity: .35; cursor: not-allowed; }
        ${s} .cb-car__playIcon {
          width: 11px; height: 13px; background: currentColor;
          clip-path: polygon(0 0, 35% 0, 35% 100%, 0 100%, 0 0, 65% 0, 100% 0, 100% 100%, 65% 100%, 65% 0);
        }
        ${s} .cb-car__play[data-playing="0"] .cb-car__playIcon { clip-path: polygon(0 0, 100% 50%, 0 100%); width: 12px; }

        ${s} .cb-car__track {
          display: flex; gap: ${gap}px;
          overflow-x: auto; overscroll-behavior-x: contain;
          scroll-snap-type: x mandatory; scroll-behavior: smooth;
          scrollbar-width: none; -ms-overflow-style: none;
          padding-bottom: 4px;
        }
        ${s} .cb-car__track::-webkit-scrollbar { display: none; }
        ${s} .cb-car__slide { flex: 0 0 ${slideWidth(per)}; scroll-snap-align: start; }
        ${s} .cb-car__fig { position: relative; overflow: hidden; border-radius: var(--cb-radius); background: var(--cb-subtle); }
        ${s} .cb-car__fig img {
          width: 100%; aspect-ratio: ${p.ratio}; object-fit: cover;
          transition: transform .5s cubic-bezier(.2,.7,.3,1);
        }
        ${s} .cb-car__fig:hover img { transform: scale(1.05); }
        ${s} .cb-car__link { display: block; text-decoration: none; }
        ${s} .cb-car__cap {
          position: absolute; inset: auto 0 0 0; display: flex; flex-direction: column; gap: 2px;
          padding: 44px 18px 16px; color: #fff;
          background: linear-gradient(to top, rgba(6,10,20,.86), rgba(6,10,20,0));
        }
        ${s} .cb-car__capT { font-weight: 700; }
        ${s} .cb-car__capS { font-size: .85em; opacity: .8; }
        ${s} .cb-car__dots { display: flex; justify-content: center; gap: 8px; margin-top: 22px; flex-wrap: wrap; }
        ${s} .cb-car__dot {
          width: 9px; height: 9px; border-radius: 50%; padding: 0;
          background: var(--cb-border); transition: all .25s ease;
        }
        ${s} .cb-car__dot[aria-current="true"] { background: var(--cb-brand); width: 26px; border-radius: 5px; }
        @media (max-width: 1024px) { ${s} .cb-car__slide { flex-basis: ${slideWidth(perT)}; } }
        @media (max-width: 640px) { ${s} .cb-car__slide { flex-basis: ${peek ? '86%' : '100%'}; } }`;

      var js = c.wrap(c.cls, `
        var track = root.querySelector(".cb-car__track");
        var slides = Array.prototype.slice.call(root.querySelectorAll(".cb-car__slide"));
        var dots = Array.prototype.slice.call(root.querySelectorAll(".cb-car__dot"));
        var prev = root.querySelector(".cb-car__prev");
        var next = root.querySelector(".cb-car__next");
        var play = root.querySelector(".cb-car__play");
        if (!track || !slides.length) return;

        var index = 0;
        var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function perView() {
          var w = slides[0].getBoundingClientRect().width;
          var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
          return Math.max(1, Math.round(track.clientWidth / (w + gap)));
        }
        function maxIndex() { return Math.max(0, slides.length - perView()); }

        /* Offsets are measured against slide 0 rather than the track, so this
           holds however the host page positions its ancestors. */
        function offsetOf(i) { return slides[i].offsetLeft - slides[0].offsetLeft; }

        function goTo(i, smooth) {
          i = Math.max(0, Math.min(i, maxIndex()));
          index = i;
          track.scrollTo({
            left: offsetOf(i),
            behavior: (smooth === false || reduced) ? "auto" : "smooth"
          });
          sync();
        }

        function readIndex() {
          var best = 0, dist = Infinity, origin = track.scrollLeft;
          slides.forEach(function (s, i) {
            var d = Math.abs(offsetOf(i) - origin);
            if (d < dist) { dist = d; best = i; }
          });
          return best;
        }

        function sync() {
          dots.forEach(function (d, i) {
            var on = i === index;
            if (on) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
            /* Dots past the last reachable position can't be selected — dim them. */
            d.disabled = i > maxIndex();
            d.style.display = i > maxIndex() ? "none" : "";
          });
          if (prev) prev.disabled = index <= 0 && !timer;
          if (next) next.disabled = index >= maxIndex() && !timer;
        }

        var settle;
        track.addEventListener("scroll", function () {
          clearTimeout(settle);
          settle = setTimeout(function () { index = readIndex(); sync(); }, 90);
        }, { passive: true });

        if (prev) prev.addEventListener("click", function () { stop(); goTo(index - 1); });
        if (next) next.addEventListener("click", function () { stop(); goTo(index + 1); });
        dots.forEach(function (d, i) { d.addEventListener("click", function () { stop(); goTo(i); }); });

        track.addEventListener("keydown", function (e) {
          if (e.key === "ArrowRight") { e.preventDefault(); stop(); goTo(index + 1); }
          else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); goTo(index - 1); }
          else if (e.key === "Home") { e.preventDefault(); stop(); goTo(0); }
          else if (e.key === "End") { e.preventDefault(); stop(); goTo(maxIndex()); }
        });

        /* ---- autoplay ---- */
        var timer = null;
        var wanted = ${p.autoplay ? 'true' : 'false'} && !reduced;

        function tick() { goTo(index >= maxIndex() ? 0 : index + 1); }
        function start() {
          if (!wanted || timer) return;
          timer = setInterval(tick, ${c.num(p.interval, 5) * 1000});
          if (play) { play.setAttribute("data-playing", "1"); play.setAttribute("aria-label", "Pause slide rotation"); }
          track.setAttribute("aria-live", "off");
          sync();
        }
        function stop() {
          if (!timer) return;
          clearInterval(timer); timer = null;
          if (play) { play.setAttribute("data-playing", "0"); play.setAttribute("aria-label", "Start slide rotation"); }
          track.setAttribute("aria-live", "polite");
          sync();
        }
        if (play) play.addEventListener("click", function () { if (timer) { stop(); } else { wanted = true; start(); } });

        /* APG: pause on hover and on keyboard focus, resume when both are gone.
           This is a suspend, not a stop — the play button stays in "playing". */
        function suspend() { if (timer) { clearInterval(timer); timer = null; } }
        function resume() {
          if (!wanted || timer) return;
          if (play && play.getAttribute("data-playing") !== "1") return;
          if (root.contains(document.activeElement)) return;
          timer = setInterval(tick, ${c.num(p.interval, 5) * 1000});
        }
        root.addEventListener("mouseenter", suspend);
        root.addEventListener("mouseleave", resume);
        root.addEventListener("focusin", suspend);
        root.addEventListener("focusout", function () { setTimeout(resume, 0); });

        window.addEventListener("resize", function () { sync(); }, { passive: true });
        sync();
        start();`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Testimonial Slider                                                     */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'testimonials',
    name: 'Testimonial Slider',
    category: CAT,
    icon: '❝',
    blurb: 'Cross-fading quotes with avatar, rating and a rotation control.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'What people say' },

      { t: 'section', label: 'Quotes' },
      {
        k: 'items', t: 'list', label: 'Testimonials', itemLabel: 'name',
        fields: [
          { k: 'quote', t: 'textarea', label: 'Quote', value: 'Quote text.' },
          { k: 'name', t: 'text', label: 'Name', value: 'Name' },
          { k: 'role', t: 'text', label: 'Role / company', value: '' },
          { k: 'avatar', t: 'image', label: 'Avatar', value: '' },
          { k: 'rating', t: 'range', label: 'Rating', min: 0, max: 5, step: 1, value: 5 }
        ],
        value: [
          { quote: 'We replaced three plugins with a single pasted snippet. It loads faster and finally matches the rest of the site.', name: 'Dana Whitfield', role: 'Head of Digital, Northwind', avatar: CB.ph(200, 200, 'DW', '#4f46e5', '#0891b2'), rating: 5 },
          { quote: 'The accordion actually works with a keyboard. That sounds like a low bar until you audit what most builders ship.', name: 'Marcus Lee', role: 'Accessibility lead', avatar: CB.ph(200, 200, 'ML', '#7c3aed', '#db2777'), rating: 5 },
          { quote: 'Being able to hand a marketer an editable block and get clean code back has saved us an entire review cycle.', name: 'Priya Raman', role: 'Front-end engineer', avatar: CB.ph(200, 200, 'PR', '#0891b2', '#22c55e'), rating: 4 }
        ]
      },

      { t: 'section', label: 'Behaviour' },
      { k: 'autoplay', t: 'toggle', label: 'Auto-rotate', value: true },
      { k: 'interval', t: 'range', label: 'Interval', min: 3, max: 15, step: 1, unit: 's', value: 7, when: { autoplay: [true] } },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Variant', value: 'centered', options: [['centered', 'Centred'], ['card', 'Card']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#f4f6fb' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 24, max: 160, step: 8, unit: 'px', value: 88 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);

      function stars(r) {
        r = c.clamp(c.num(r, 0), 0, 5);
        if (!r) return '';
        var out = '<div class="cb-tm__stars" role="img" aria-label="' + r + ' out of 5 stars">';
        for (var i = 0; i < 5; i++) {
          out += '<span class="cb-tm__star' + (i < r ? ' is-on' : '') + '" aria-hidden="true">&#9733;</span>';
        }
        return out + '</div>';
      }

      var slides = items.map(function (it, i) {
        return c.dedent(`
          <figure class="cb-tm__item"${i === 0 ? ' data-active="1"' : ''}${i === 0 ? '' : ' inert'}>
            ${stars(it.rating)}
            <blockquote class="cb-tm__quote">${c.rich(it.quote)}</blockquote>
            <figcaption class="cb-tm__by">
              ${it.avatar ? '<img class="cb-tm__avatar" src="' + c.url(it.avatar) + '" alt="" loading="lazy" decoding="async">' : ''}
              <span class="cb-tm__meta">
                <span class="cb-tm__name">${c.esc(it.name)}</span>
                ${it.role ? '<span class="cb-tm__role">' + c.esc(it.role) + '</span>' : ''}
              </span>
            </figcaption>
          </figure>`);
      }).join('\n');

      var dots = items.map(function (it, i) {
        return '<button type="button" class="cb-tm__dot" aria-label="Testimonial ' + (i + 1) + ' of ' + items.length + '"' +
          (i === 0 ? ' aria-current="true"' : '') + '></button>';
      }).join('');

      var html = c.dedent(`
        <section class="${c.cls} cb-tm" aria-roledescription="carousel" aria-label="${c.attr(p.title || 'Testimonials')}">
          <div class="cb-wrap">
            ${p.title ? '<h2 class="cb-tm__title">' + c.rich(p.title) + '</h2>' : ''}
            <div class="cb-tm__stage" aria-live="polite">
        ${c.indent(slides, 6)}
            </div>
            <div class="cb-tm__controls">
              <button type="button" class="cb-tm__arrow cb-tm__prev" aria-label="Previous testimonial"><span aria-hidden="true">&#8249;</span></button>
              <div class="cb-tm__dots">${dots}</div>
              <button type="button" class="cb-tm__arrow cb-tm__next" aria-label="Next testimonial"><span aria-hidden="true">&#8250;</span></button>
            </div>
          </div>
        </section>`);

      var card = p.variant === 'card';
      var css = `
        ${s}.cb-tm { background: ${p.bg}; padding-block: ${c.num(p.pad, 88)}px; }
        ${s} .cb-tm__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; text-align: center; margin-bottom: 36px; }
        ${s} .cb-tm__stage { position: relative; display: grid; }
        ${s} .cb-tm__item {
          grid-area: 1 / 1; display: flex; flex-direction: column; align-items: center; gap: 20px;
          text-align: center; max-width: 760px; margin-inline: auto;
          opacity: 0; visibility: hidden; transform: translateY(10px);
          transition: opacity .45s ease, transform .45s ease, visibility .45s;
          ${card ? 'background: var(--cb-surface); border: 1px solid var(--cb-border); border-radius: calc(var(--cb-radius) * 1.4); padding: clamp(28px, 5vw, 48px); box-shadow: 0 24px 60px -40px rgba(15,23,42,.5);' : ''}
        }
        ${s} .cb-tm__item[data-active] { opacity: 1; visibility: visible; transform: none; }
        ${s} .cb-tm__stars { display: flex; gap: 3px; font-size: 1.1em; }
        ${s} .cb-tm__star { color: var(--cb-border); }
        ${s} .cb-tm__star.is-on { color: #f59e0b; }
        ${s} .cb-tm__quote {
          font-size: clamp(18px, 2.6vw, 26px); line-height: 1.5; font-weight: 500;
          letter-spacing: -.01em; text-wrap: balance;
        }
        ${s} .cb-tm__quote::before { content: "\\201C"; }
        ${s} .cb-tm__quote::after { content: "\\201D"; }
        ${s} .cb-tm__by { display: flex; align-items: center; gap: 12px; }
        ${s} .cb-tm__avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
        ${s} .cb-tm__meta { display: flex; flex-direction: column; text-align: left; line-height: 1.35; }
        ${s} .cb-tm__name { font-weight: 700; }
        ${s} .cb-tm__role { font-size: .88em; color: var(--cb-muted); }
        ${s} .cb-tm__controls { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 32px; }
        ${s} .cb-tm__arrow {
          width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center;
          border: 1px solid var(--cb-border); background: var(--cb-surface); font-size: 21px; line-height: 1;
          transition: all .2s ease;
        }
        ${s} .cb-tm__arrow:hover { background: var(--cb-brand); color: var(--cb-on-brand); border-color: var(--cb-brand); }
        ${s} .cb-tm__dots { display: flex; gap: 8px; }
        ${s} .cb-tm__dot { width: 9px; height: 9px; border-radius: 50%; padding: 0; background: var(--cb-border); transition: all .25s ease; }
        ${s} .cb-tm__dot[aria-current="true"] { background: var(--cb-brand); width: 26px; border-radius: 5px; }`;

      var js = c.wrap(c.cls, `
        var items = Array.prototype.slice.call(root.querySelectorAll(".cb-tm__item"));
        var dots = Array.prototype.slice.call(root.querySelectorAll(".cb-tm__dot"));
        if (items.length < 1) return;
        var i = 0, timer = null;
        var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function show(n) {
          i = (n + items.length) % items.length;
          items.forEach(function (el, k) {
            var on = k === i;
            if (on) { el.setAttribute("data-active", "1"); el.removeAttribute("inert"); }
            else { el.removeAttribute("data-active"); el.setAttribute("inert", ""); }
          });
          dots.forEach(function (d, k) {
            if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
          });
        }
        function stop() { if (timer) { clearInterval(timer); timer = null; } }
        function start() {
          stop();
          if (!${p.autoplay ? 'true' : 'false'} || reduced || items.length < 2) return;
          timer = setInterval(function () { show(i + 1); }, ${c.num(p.interval, 7) * 1000});
        }

        root.querySelector(".cb-tm__prev").addEventListener("click", function () { stop(); show(i - 1); });
        root.querySelector(".cb-tm__next").addEventListener("click", function () { stop(); show(i + 1); });
        dots.forEach(function (d, k) { d.addEventListener("click", function () { stop(); show(k); }); });
        root.addEventListener("mouseenter", stop);
        root.addEventListener("focusin", stop);
        root.addEventListener("mouseleave", start);

        /* Equalise stage height so shorter quotes don't make the page jump. */
        function measure() {
          var stage = root.querySelector(".cb-tm__stage");
          stage.style.minHeight = "";
          var tallest = 0;
          items.forEach(function (el) { tallest = Math.max(tallest, el.scrollHeight); });
          stage.style.minHeight = tallest + "px";
        }
        window.addEventListener("resize", measure, { passive: true });
        if (document.readyState === "complete") measure();
        else window.addEventListener("load", measure);
        measure();

        show(0);
        start();`);

      return { html: html, css: css, js: js };
    }
  });
})();
