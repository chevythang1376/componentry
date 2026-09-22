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
        k: 'items', t: 'list', label: 'Questions', paste: true,
        itemLabel: 'q',
        fields: [
          { k: 'q', t: 'text', label: 'Question', value: 'New question' },
          { k: 'a', t: 'textarea', label: 'Answer', value: 'Answer copy goes here.' }
        ].concat(CB.ctaFields({ help: 'Shows at the end of this answer. Leave empty for no button.' })),
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
      {
        k: 'deepLink', t: 'toggle', label: 'Link to individual answers', value: false,
        help: 'Each question gets a shareable #hash. Arriving on that link opens and scrolls to it.'
      },
      {
        k: 'closeOthers', t: 'toggle', label: 'Scroll opened item into view', value: false,
        help: 'Useful for long answers that would otherwise open below the fold.'
      },
      { k: 'schema', t: 'toggle', label: 'Emit FAQPage structured data', value: false, help: 'Adds JSON-LD for rich results. Only use when the content really is a FAQ.' },

      { t: 'section', label: 'Button' },
      { k: 'btnText', t: 'text', label: 'Button label', value: '',
        help: 'Sits below the questions — “Still stuck? Talk to us” fits well here. Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Variant', value: 'divided', options: [['divided', 'Divided lines'], ['cards', 'Separate cards'], ['boxed', 'Single bordered box']] },
      { k: 'marker', t: 'select', label: 'Marker', value: 'chevron', options: [['chevron', 'Chevron'], ['plus', 'Plus / minus'], ['none', 'None']] },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 80 }
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
              <div class="cb-acc__panelIn">
                <div class="cb-acc__a">${c.rich(it.a)}</div>
                ${c.actions([{ text: it.btnText, url: it.btnUrl }], { tight: true })}
              </div>
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
            ${c.actions([{ text: p.btnText, url: p.btnUrl }])}
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
          ${s} .cb-acc__item[data-open] { border-color: var(--cb-brand-ink, var(--cb-brand)); box-shadow: 0 10px 30px -18px var(--cb-brand); }`,
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
        ${s}.cb-acc { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-acc__head { margin-bottom: 32px; max-width: 640px; }
        ${s} .cb-acc__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); }
        ${s} .cb-acc__sub { color: var(--cb-muted); margin-top: 10px; }
        ${variantCss}
        ${s} .cb-acc__h { margin: 0; font-size: inherit; font-weight: inherit; }
        ${s} .cb-acc__btn {
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
          width: 100%; text-align: left; padding: 20px ${p.variant === 'divided' ? '4px' : '22px'};
          font-size: 1.12em; font-weight: 700; color: var(--cb-ink);
          transition: color .2s ease;
        }
        ${s} .cb-acc__btn:hover { color: var(--cb-brand-ink, var(--cb-brand)); }
        ${s} .cb-acc__item[data-open] .cb-acc__btn { color: var(--cb-brand-ink, var(--cb-brand)); }
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

        ${p.deepLink ? `
        function slug(item) {
          var q = item.querySelector(".cb-acc__q");
          return (q ? q.textContent : "").toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
        }
        items.forEach(function (item) { item.setAttribute("data-slug", slug(item)); });` : ''}

        items.forEach(function (item) {
          item.querySelector(".cb-acc__btn").addEventListener("click", function () {
            var open = item.hasAttribute("data-open");
            if (!multi && !open) items.forEach(function (o) { if (o !== item) setOpen(o, false); });
            setOpen(item, !open);
            if (open) return;
${p.deepLink ? `
            if (history.replaceState) {
              history.replaceState(null, "", "#" + item.getAttribute("data-slug"));
            }` : ''}
${p.closeOthers ? `
            var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            setTimeout(function () {
              item.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
            }, 340);` : ''}
          });
        });
${p.deepLink ? `
        /* Open the item named by the URL hash, on load and on later changes. */
        function openFromHash() {
          var want = (location.hash || "").replace(/^#/, "");
          if (!want) return;
          var match = items.filter(function (i) { return i.getAttribute("data-slug") === want; })[0];
          if (!match) return;
          if (!multi) items.forEach(function (o) { if (o !== match) setOpen(o, false); });
          setOpen(match, true);
          match.scrollIntoView({ block: "start" });
        }
        openFromHash();
        window.addEventListener("hashchange", openFromHash);` : ''}

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
          { label: 'Pick', heading: 'Start from a real pattern', body: 'Choose from banners, carousels, accordions, pricing tables and more — every one built to the conventions people already expect.', image: CB.ph(900, 560, '', '#96694c', '#2b241f'), linkText: '', linkUrl: '#' },
          { label: 'Edit', heading: 'Change anything that matters', body: 'Copy, colours, spacing, imagery, timings and behaviour — all editable, with the preview updating as you type.', image: CB.ph(900, 560, '', '#6f4c37', '#141210'), linkText: '', linkUrl: '#' },
          { label: 'Export', heading: 'Paste it and move on', body: 'Take a single self-contained snippet, or split HTML, CSS and JS into your builder’s separate fields.', image: CB.ph(900, 560, '', '#2b241f', '#4a443e'), linkText: '', linkUrl: '#' }
        ]
      },

      { t: 'section', label: 'Behaviour' },
      {
        k: 'deepLink', t: 'toggle', label: 'Link to individual tabs', value: false,
        help: 'Selecting a tab updates the URL hash, and arriving on that link opens it.'
      },
      {
        k: 'activation', t: 'select', label: 'Keyboard activation', value: 'auto',
        options: [['auto', 'Automatic — arrow keys switch panels'], ['manual', 'Manual — arrows move, Enter selects']],
        help: 'Manual is the APG recommendation when panel content is expensive to load.'
      },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Tab style', value: 'underline', options: [['underline', 'Underline'], ['pill', 'Pills'], ['segmented', 'Segmented control']] },
      { k: 'align', t: 'select', label: 'Tab alignment', value: 'left', options: [['left', 'Left'], ['center', 'Center'], ['stretch', 'Full width']] },
      { k: 'layout', t: 'select', label: 'Panel layout', value: 'split', options: [['split', 'Text + image'], ['text', 'Text only']] },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 80 }
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
          ${s} .cb-tabs__tab[aria-selected="true"] { color: var(--cb-brand-ink, var(--cb-brand)); border-bottom-color: var(--cb-brand-ink, var(--cb-brand)); }`,
        pill: `
          ${s} .cb-tabs__list { gap: 8px; }
          ${s} .cb-tabs__tab { padding: 11px 20px; border-radius: 999px; border: 1px solid var(--cb-border); }
          ${s} .cb-tabs__tab[aria-selected="true"] { background: var(--cb-brand); color: var(--cb-on-brand); border-color: var(--cb-brand-ink, var(--cb-brand)); }`,
        segmented: `
          ${s} .cb-tabs__list { gap: 4px; background: var(--cb-subtle); padding: 5px; border-radius: 999px; }
          ${s} .cb-tabs__tab { padding: 10px 20px; border-radius: 999px; }
          ${s} .cb-tabs__tab[aria-selected="true"] { background: var(--cb-surface); color: var(--cb-brand-ink, var(--cb-brand)); box-shadow: 0 2px 8px -2px rgba(20,18,16,.2); }`
      }[p.variant] || '';

      var css = `
        ${s}.cb-tabs { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-tabs__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); margin-bottom: 28px; }
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
        ${s} .cb-tabs__h { font-size: calc(clamp(20px, 2.6vw, 28px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 700); line-height: calc(1.2 + var(--cb-h-leading, 0)); letter-spacing: calc(-.015em + var(--cb-h-track, 0em)); }
        ${s} .cb-tabs__body { color: var(--cb-muted); }
        ${s} .cb-tabs__link { color: var(--cb-brand-ink, var(--cb-brand)); font-weight: 650; text-decoration: none; width: max-content; }
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

        var manual = ${p.activation === 'manual' ? 'true' : 'false'};
${p.deepLink ? `
        function slug(i) {
          return (tabs[i].textContent || "tab").toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
        }` : ''}

        tabs.forEach(function (t, i) {
          t.addEventListener("click", function () {
            select(i, false);
${p.deepLink ? '            if (history.replaceState) history.replaceState(null, "", "#" + slug(i));' : ''}
          });
        });

        root.querySelector("[role=tablist]").addEventListener("keydown", function (e) {
          var i = tabs.indexOf(document.activeElement);
          if (i === -1) return;
          var next = -1;
          if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
          else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = tabs.length - 1;
          else if (manual && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault(); select(i, true); return;
          }
          if (next === -1) return;
          e.preventDefault();
          /* Manual activation moves focus without switching panels (APG). */
          if (manual) { tabs[next].focus(); } else { select(next, true); }
        });

${p.deepLink ? `
        function selectFromHash() {
          var want = (location.hash || "").replace(/^#/, "");
          if (!want) return;
          for (var i = 0; i < tabs.length; i++) {
            if (slug(i) === want) { select(i, false); root.scrollIntoView({ block: "start" }); return; }
          }
        }
        selectFromHash();
        window.addEventListener("hashchange", selectFromHash);` : ''}`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Carousel                                                               */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'carousel',
    name: 'Carousel',
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
          { k: 'image', t: 'image', label: 'Image', value: CB.ph(1200, 750, '', '#96694c', '#2b241f') },
          { k: 'alt', t: 'text', label: 'Alt text', value: '' },
          { k: 'caption', t: 'text', label: 'Caption', value: 'New slide' },
          { k: 'sub', t: 'text', label: 'Sub-caption', value: '' },
          { k: 'badge', t: 'text', label: 'Flag', value: '',
            help: 'A short marker over the image — "New", "In stock". Card layout only.' },
          { k: 'spec', t: 'text', label: 'Spec or price line', value: '',
            help: 'Sits under the caption in tabular figures. Card layout only.' },
          { k: 'btnText', t: 'text', label: 'Button label', value: '',
            help: 'Card layout only. Leave empty and the whole card stays the link.' },
          { k: 'linkUrl', t: 'url', label: 'Link URL', value: '' }
        ],
        value: [
          { image: CB.ph(1200, 750, '', '#96694c', '#2b241f'), alt: '', caption: 'Northwind rebrand', sub: 'Identity · 2025', linkUrl: '' },
          { image: CB.ph(1200, 750, '', '#6f4c37', '#141210'), alt: '', caption: 'Atlas dashboard', sub: 'Product design', linkUrl: '' },
          { image: CB.ph(1200, 750, '', '#2b241f', '#4a443e'), alt: '', caption: 'Field guide microsite', sub: 'Web · 2026', linkUrl: '' },
          { image: CB.ph(1200, 750, '', '#c08d63', '#d9c3ad'), alt: '', caption: 'Harbour packaging', sub: 'Print', linkUrl: '' },
          { image: CB.ph(1200, 750, '', '#3a332d', '#96694c'), alt: '', caption: 'Meridian campaign', sub: 'Art direction', linkUrl: '' }
        ]
      },

      { t: 'section', label: 'Layout' },
      {
        k: 'slideStyle', t: 'select', label: 'Slides are', value: 'media',
        options: [['media', 'Images, captioned over the picture'], ['card', 'Product cards']],
        help: 'Cards give each slide its own surface, with the flag, spec line and button ' +
              'underneath rather than laid over the image — which is what makes a row of ' +
              'products scannable rather than decorative.'
      },
      { k: 'perView', t: 'range', label: 'Slides per view (desktop)', min: 1, max: 5, step: 1, value: 3 },
      { k: 'perViewTablet', t: 'range', label: 'Slides per view (tablet)', min: 1, max: 4, step: 1, value: 2 },
      { k: 'gap', t: 'range', label: 'Gap', min: 0, max: 48, step: 2, unit: 'px', value: 20 },
      { k: 'ratio', t: 'select', label: 'Slide ratio', value: '4/3', options: [['16/9', '16 : 9'], ['4/3', '4 : 3'], ['1/1', 'Square'], ['3/4', 'Portrait']] },
      { k: 'peek', t: 'toggle', label: 'Peek next slide', value: true },

      { t: 'section', label: 'Controls' },
      { k: 'arrows', t: 'toggle', label: 'Arrows', value: true },
      { k: 'dots', t: 'toggle', label: 'Dots', value: true },
      {
        k: 'loop', t: 'toggle', label: 'Wrap around at the ends', value: false,
        help: 'Next from the last slide returns to the first. Arrows never disable.'
      },
      { k: 'autoplay', t: 'toggle', label: 'Autoplay', value: false },
      { k: 'interval', t: 'range', label: 'Autoplay interval', min: 2, max: 12, step: 1, unit: 's', value: 5, when: { autoplay: [true] } },
      { k: 'captions', t: 'toggle', label: 'Show captions', value: true },

      { t: 'section', label: 'Style' },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 80 }
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

      /* Two shapes out of one mechanism. A media slide lays its caption over the
         picture, which reads well for photography and badly for anything meant
         to be compared — a row of products wants each one on its own surface
         with its facts underneath, in the same place every time.

         The scrolling, snapping and keyboard handling are shared, because that
         is the part with all the accessibility in it and two copies would be
         two things to keep right. */
      var card = p.slideStyle === 'card';

      var slides = items.map(function (it, i) {
        var img = '<img src="' + c.url(it.image) + '" alt="' + c.attr(it.alt) +
                  '" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async">';
        var body;

        if (card) {
          var media = '<div class="cb-car__shot">' + img +
                      (it.badge ? '<span class="cb-car__badge">' + c.esc(it.badge) + '</span>' : '') +
                      '</div>';
          var facts =
            '<div class="cb-car__body">' +
              (it.caption ? '<span class="cb-car__name">' + c.esc(it.caption) + '</span>' : '') +
              (it.sub ? '<span class="cb-car__sub">' + c.esc(it.sub) + '</span>' : '') +
              (it.spec ? '<span class="cb-car__spec">' + c.esc(it.spec) + '</span>' : '') +
            '</div>';
          /* A card with a button gets one obvious target rather than a link
             inside a link, which is invalid and unusable from a keyboard.
             Without a button the whole card is the link, as it always was. */
          body = it.btnText
            ? media + facts + c.actions([{ text: it.btnText, url: it.linkUrl || '#' }], { tight: true })
            : (it.linkUrl
                ? '<a class="cb-car__link" href="' + c.url(it.linkUrl) + '">' + media + facts + '</a>'
                : media + facts);
        } else {
          var inner = img +
            (p.captions && (it.caption || it.sub)
              ? '<figcaption class="cb-car__cap">' +
                (it.caption ? '<span class="cb-car__capT">' + c.esc(it.caption) + '</span>' : '') +
                (it.sub ? '<span class="cb-car__capS">' + c.esc(it.sub) + '</span>' : '') +
                '</figcaption>' : '');
          body = it.linkUrl
            ? '<a class="cb-car__link" href="' + c.url(it.linkUrl) + '">' + inner + '</a>'
            : inner;
        }

        return c.dedent(`
          <li class="cb-car__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}">
            <figure class="cb-car__fig${card ? ' is-card' : ''}">${body}</figure>
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
        ${s}.cb-car { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-car__head { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
        ${s} .cb-car__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); }
        ${s} .cb-car__nav { display: flex; gap: 8px; flex-shrink: 0; }
        ${s} .cb-car__ctl {
          width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
          border: 1px solid var(--cb-border); color: var(--cb-ink); font-size: 22px; line-height: 1;
          background: var(--cb-surface); transition: all .2s ease;
        }
        ${s} .cb-car__ctl:hover:not([disabled]) { background: var(--cb-brand); color: var(--cb-on-brand); border-color: var(--cb-brand-ink, var(--cb-brand)); }
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
          padding: 44px 18px 16px; color: var(--cb-on-dark, #fff);
          background: linear-gradient(to top, rgba(12,10,8,.86), rgba(12,10,8,0));
        }
        ${s} .cb-car__capT { font-weight: 700; }
        ${s} .cb-car__capS { font-size: .85em; opacity: .8; }
        ${c.pin([s + ' .cb-car__cap', s + ' .cb-car__capT', s + ' .cb-car__capS'], 'var(--cb-on-dark, #fff)')}
${card ? `
        /* Product card. Its own surface, facts underneath rather than over the
           picture, and every card the same height so a row of them reads as a
           row rather than as a ragged edge. */
        ${s} .cb-car__fig.is-card {
          background: var(--cb-surface); border: 1px solid var(--cb-border);
          display: flex; flex-direction: column; height: 100%;
        }
        ${s} .cb-car__slide { display: flex; }
        ${s} .cb-car__fig.is-card > .cb-car__link { display: flex; flex-direction: column; height: 100%; }
        ${s} .cb-car__shot { position: relative; overflow: hidden; background: var(--cb-subtle); }
        ${s} .cb-car__shot img { width: 100%; aspect-ratio: ${p.ratio}; object-fit: cover; }
        ${s} .cb-car__badge {
          position: absolute; top: 10px; left: 10px;
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: 700;
          letter-spacing: .09em; text-transform: uppercase;
          color: var(--cb-on-brand); background: var(--cb-brand);
          padding: 4px 8px; border-radius: calc(var(--cb-radius) * .28);
        }
        ${s} .cb-car__body {
          display: flex; flex-direction: column; gap: 4px;
          padding: 16px 18px 4px; flex: 1 1 auto;
        }
        ${s} .cb-car__name {
          font-size: 1.12em; font-weight: var(--cb-h-weight, 700);
          line-height: calc(1.3 + var(--cb-h-leading, 0));
          letter-spacing: calc(-.01em + var(--cb-h-track, 0em));
        }
        ${s} .cb-car__sub { font-size: .92em; color: var(--cb-muted); }
        /* Tabular figures so a column of gauges or prices lines up as you scroll. */
        ${s} .cb-car__spec {
          font-size: .85em; color: var(--cb-ink); font-variant-numeric: tabular-nums;
          margin-top: 2px;
        }
        ${s} .cb-car__fig.is-card .cb-actions { padding: 0 18px 16px; margin-top: 8px; }
        ${s} .cb-car__fig.is-card:hover img { transform: none; }
        ${s} .cb-car__fig.is-card:hover { border-color: var(--cb-brand); }` : ''}
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

        var loop = ${p.loop ? 'true' : 'false'};

        function goTo(i, smooth) {
          var max = maxIndex();
          // Wrap instead of clamp, so "next" from the end returns to the start.
          if (loop && max > 0) { i = i < 0 ? max : i > max ? 0 : i; }
          i = Math.max(0, Math.min(i, max));
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
          if (prev) prev.disabled = !loop && index <= 0 && !timer;
          if (next) next.disabled = !loop && index >= maxIndex() && !timer;
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

        /* Recompute when the track resizes *or is first revealed*. A carousel
           dropped inside a tab panel or collapsed accordion initialises at zero
           width, which leaves perView() wrong and the arrows wrongly disabled.
           A window resize listener never fires for that case. */
        if (typeof ResizeObserver === "function") {
          var lastW = -1;
          new ResizeObserver(function () {
            var w = track.clientWidth;
            if (!w || Math.abs(w - lastW) < 2) return;
            var first = lastW < 0;
            lastW = w;
            if (first) { sync(); return; }
            goTo(Math.min(index, maxIndex()), false);
          }).observe(track);
        } else {
          window.addEventListener("resize", function () { sync(); }, { passive: true });
        }

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
        ].concat(CB.ctaFields({ help: 'Leave empty for no button on this quote.' })),
        value: [
          { quote: 'We replaced three plugins with a single pasted snippet. It loads faster and finally matches the rest of the site.', name: 'Dana Whitfield', role: 'Head of Digital, Northwind', avatar: CB.ph(200, 200, 'DW', '#96694c', '#2b241f'), rating: 5 },
          { quote: 'The accordion actually works with a keyboard. That sounds like a low bar until you audit what most builders ship.', name: 'Marcus Lee', role: 'Accessibility lead', avatar: CB.ph(200, 200, 'ML', '#6f4c37', '#141210'), rating: 5 },
          { quote: 'Being able to hand a marketer an editable block and get clean code back has saved us an entire review cycle.', name: 'Priya Raman', role: 'Front-end engineer', avatar: CB.ph(200, 200, 'PR', '#2b241f', '#4a443e'), rating: 4 }
        ]
      },

      { t: 'section', label: 'Behaviour' },
      { k: 'autoplay', t: 'toggle', label: 'Auto-rotate', value: true },
      { k: 'interval', t: 'range', label: 'Interval', min: 3, max: 15, step: 1, unit: 's', value: 7, when: { autoplay: [true] } },

      { t: 'section', label: 'Button' },
      { k: 'btnText', t: 'text', label: 'Button label', value: '',
        help: 'Sits below the controls. Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Variant', value: 'centered', options: [['centered', 'Centred'], ['card', 'Card']] },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'band',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#f7f4f1', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 24, max: 160, step: 8, unit: 'px', value: 80 }
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
            ${c.actions([{ text: it.btnText, url: it.btnUrl }], { tight: true })}
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
            ${c.actions([{ text: p.btnText, url: p.btnUrl }], { align: 'center' })}
          </div>
        </section>`);

      var card = p.variant === 'card';
      var css = `
        ${s}.cb-tm { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 88)}px; }
        ${s} .cb-tm__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); text-align: center; margin-bottom: 36px; }
        ${s} .cb-tm__stage { position: relative; display: grid; }
        ${s} .cb-tm__item {
          grid-area: 1 / 1; display: flex; flex-direction: column; align-items: center; gap: 20px;
          text-align: center; max-width: 760px; margin-inline: auto;
          opacity: 0; visibility: hidden; transform: translateY(10px);
          transition: opacity .45s ease, transform .45s ease, visibility .45s;
          ${card ? 'background: var(--cb-surface); border: 1px solid var(--cb-border); border-radius: calc(var(--cb-radius) * 1.4); padding: clamp(28px, 5vw, 48px); box-shadow: 0 24px 60px -40px rgba(20,18,16,.5);' : ''}
        }
        ${s} .cb-tm__item[data-active] { opacity: 1; visibility: visible; transform: none; }
        ${s} .cb-tm__stars { display: flex; gap: 3px; font-size: 1.1em; }
        ${s} .cb-tm__star { color: var(--cb-border); }
        /* Follows the brand rather than a fixed amber, so filled vs empty stays
           legible whatever palette is applied. */
        ${s} .cb-tm__star.is-on { color: var(--cb-brand-ink, var(--cb-brand)); }
        ${s} .cb-tm__quote {
          font-size: calc(clamp(20px, 2.6vw, 28px) * var(--cb-body-scale, 1)); line-height: calc(1.5 + var(--cb-body-leading, 0)); font-weight: 500;
          letter-spacing: calc(-.01em + var(--cb-body-track, 0em)); text-wrap: balance;
        }
        ${s} .cb-tm__quote::before { content: "\\201C"; }
        ${s} .cb-tm__quote::after { content: "\\201D"; }
        ${s} .cb-tm__by { display: flex; align-items: center; gap: 12px; }
        ${s} .cb-tm__avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
        ${s} .cb-tm__meta { display: flex; flex-direction: column; text-align: left; line-height: 1.35; }
        ${s} .cb-tm__name { font-weight: 700; }
        ${s} .cb-tm__role { font-size: .85em; color: var(--cb-muted); }
        ${s} .cb-tm__controls { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 32px; }
        ${s} .cb-tm__arrow {
          width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center;
          border: 1px solid var(--cb-border); background: var(--cb-surface); font-size: 21px; line-height: 1;
          transition: all .2s ease;
        }
        ${s} .cb-tm__arrow:hover { background: var(--cb-brand); color: var(--cb-on-brand); border-color: var(--cb-brand-ink, var(--cb-brand)); }
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
        /* Same reveal problem as the carousel: measured at zero width inside a
           hidden tab, the stage would lock to the wrong height. */
        if (typeof ResizeObserver === "function") {
          /* Width-gated: measure() writes minHeight on a descendant, so reacting
             to height here would feed back into the observer forever. */
          var lastW = -1;
          new ResizeObserver(function () {
            var w = root.clientWidth;
            if (!w || w === lastW) return;
            lastW = w;
            measure();
          }).observe(root);
        } else {
          window.addEventListener("resize", measure, { passive: true });
        }
        if (document.readyState !== "complete") window.addEventListener("load", measure);
        measure();

        show(0);
        start();`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Jump Links                                                             */
  /*                                                                        */
  /* A row of in-page links for long product and capability pages. Every   */
  /* block already has an Anchor ID under Advanced, so this is the other    */
  /* half of a feature that was sitting there unused.                       */
  /*                                                                        */
  /* The root is a div with role="navigation" rather than a nav element,    */
  /* deliberately: themes style bare nav elements for their own site menu — */
  /* fixed position, flex rows, uppercase links — and a pasted block has no */
  /* business inheriting that. The landmark is the same to a screen reader.*/
  /*                                                                        */
  /* Staying at the top is done by script, not position: sticky. Sticky     */
  /* only works inside the element's parent, and a CMS usually wraps each   */
  /* HTML block in a container that ends right after it — so a sticky row   */
  /* would stick for exactly its own height and then scroll away. Without   */
  /* the script it is an ordinary row of links, which still works.          */
  /* --------------------------------------------------------------------- */

  function anchorId(v) {
    return String(v == null ? '' : v).trim().replace(/^#+/, '').replace(/\s+/g, '-');
  }

  CB.register({
    id: 'jump-links',
    name: 'Jump Links',
    category: CAT,
    icon: '⇣',
    blurb: 'A row of links to sections further down a long page, that can stay at the top while you scroll and highlight where you are.',
    props: [
      { t: 'section', label: 'Links' },
      { k: 'heading', t: 'text', label: 'Label', value: 'On this page', help: 'Shown at the start of the row, and used as the name screen readers announce. Leave empty to show none.' },
      {
        k: 'items', t: 'list', label: 'Links', itemLabel: 'text',
        fields: [
          { k: 'text', t: 'text', label: 'Link text', value: 'Section' },
          { k: 'target', t: 'text', label: 'Goes to (Anchor ID)', value: '',
            help: 'The Anchor ID set under Advanced on the block this jumps to, without the #.' }
        ],
        value: [
          { text: 'Overview', target: 'overview' },
          { text: 'Specifications', target: 'specifications' },
          { text: 'Installation', target: 'installation' },
          { text: 'Resources', target: 'resources' },
          { text: 'FAQ', target: 'faq' }
        ]
      },

      { t: 'section', label: 'Behavior' },
      {
        k: 'stick', t: 'toggle', label: 'Stay at the top while scrolling', value: true,
        help: 'Needs JavaScript. Where scripts are stripped it is an ordinary row of links, which still works.'
      },
      {
        k: 'offset', t: 'range', label: 'Room for a fixed site header', min: 0, max: 160, step: 4, unit: 'px', value: 0,
        help: 'If your site header stays on screen, set this to its height so the row sits under it rather than behind it.'
      },
      { k: 'spy', t: 'toggle', label: 'Highlight the section in view', value: true },

      { t: 'section', label: 'Style' },
      { k: 'style', t: 'select', label: 'Link style', value: 'underline', options: [['underline', 'Underlined tabs'], ['pills', 'Pills']] },
      { k: 'align', t: 'select', label: 'Alignment', value: 'left', options: [['left', 'Left'], ['center', 'Center']] },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(function (it) { return it && it.text; });
      var pills = p.style === 'pills';
      var offset = Math.max(0, Math.round(c.num(p.offset, 0)));

      var links = items.map(function (it) {
        var id = anchorId(it.target);
        return '<li><a class="cb-jl__a" href="#' + c.attr(id) + '">' + c.esc(it.text) + '</a></li>';
      }).join('');

      var html = c.dedent(`
        <div class="${c.cls} cb-jl" role="navigation" aria-label="${c.attr(p.heading || 'On this page')}">
          <div class="cb-jl__bar">
            <div class="cb-wrap cb-jl__inner">
              ${p.heading ? '<span class="cb-jl__label" aria-hidden="true">' + c.esc(p.heading) + '</span>' : ''}
              <ul class="cb-jl__list">${links}</ul>
            </div>
          </div>
        </div>`);

      var css = `
        ${s}.cb-jl { background: ${c.bg(p)}; border-bottom: 1px solid var(--cb-border); }
        ${s} .cb-jl__bar { background: ${c.bg(p)}; }
        ${s} .cb-jl__inner {
          display: flex; align-items: center; gap: 22px; min-height: 58px;
          ${p.align === 'center' ? 'justify-content: center;' : ''}
        }
        ${s} .cb-jl__label {
          flex: none; font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase; color: var(--cb-muted);
        }
        /* On a phone the row scrolls sideways rather than wrapping into a
           second line that pushes the page down. */
        ${s} .cb-jl__list {
          display: flex; gap: ${pills ? '8px' : '26px'}; overflow-x: auto; scrollbar-width: none;
          padding-block: ${pills ? '10px' : '0'};
        }
        ${s} .cb-jl__list::-webkit-scrollbar { display: none; }
        ${s} .cb-jl__a {
          display: block; white-space: nowrap; font-size: .92em; font-weight: 600; color: var(--cb-muted);
          text-decoration: none; transition: color .2s ease, background-color .2s ease, border-color .2s ease;
          ${pills
            ? 'padding: 7px 14px; border-radius: 999px; border: 1px solid var(--cb-border);'
            : 'padding-block: 18px 16px; border-bottom: 2px solid transparent;'}
        }
        ${s} .cb-jl__a:hover { color: var(--cb-ink); }
        ${s} .cb-jl__a[aria-current] {
          color: var(--cb-ink);
          ${pills ? 'border-color: var(--cb-ink); background: var(--cb-subtle);' : 'border-bottom-color: var(--cb-brand);'}
        }
        ${s} .cb-jl__a:focus-visible { outline: 2px solid var(--cb-brand); outline-offset: 2px; }
        ${s} .cb-jl__bar.is-fixed {
          position: fixed; left: 0; right: 0; top: ${offset}px; z-index: 30;
          border-bottom: 1px solid var(--cb-border); box-shadow: 0 8px 20px -16px rgba(20,18,16,.45);
        }
        @media (max-width: 640px) { ${s} .cb-jl__label { display: none; } }`;

      var body = '';
      if (p.stick || p.spy) {
        body = `
        var bar = root.querySelector(".cb-jl__bar");
        var list = root.querySelector(".cb-jl__list");
        if (!bar || !list) return;
        var OFFSET = ${offset};
        var links = Array.prototype.slice.call(root.querySelectorAll(".cb-jl__a"));

        /* Moving the page: a click scrolls to the section, allowing for the
           row itself and any fixed header, and hands focus to the section so a
           keyboard user lands where they asked to go. */
        list.addEventListener("click", function (ev) {
          var a = ev.target.closest ? ev.target.closest("a") : null;
          if (!a) return;
          var id = (a.getAttribute("href") || "").slice(1);
          var target = id && document.getElementById(id);
          if (!target) return;
          ev.preventDefault();
          var y = target.getBoundingClientRect().top + window.pageYOffset - OFFSET - bar.offsetHeight - 8;
          var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          try { window.scrollTo({ top: y, behavior: still ? "auto" : "smooth" }); } catch (e) { window.scrollTo(0, y); }
          if (window.history && history.replaceState) history.replaceState(null, "", "#" + id);
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          try { target.focus({ preventScroll: true }); } catch (e) {}
        });`;
        if (p.stick) body += `

        /* Held open at its own height while the bar is fixed, so the page
           under it does not jump up by that much when it detaches. */
        var queued = false;
        function place() {
          queued = false;
          var fix = root.getBoundingClientRect().top < OFFSET;
          if (fix === bar.classList.contains("is-fixed")) return;
          root.style.minHeight = fix ? bar.offsetHeight + "px" : "";
          bar.classList.toggle("is-fixed", fix);
        }
        function onScroll() { if (queued) return; queued = true; window.requestAnimationFrame(place); }
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        place();`;
        if (p.spy) body += `

        /* Which section is in view. The targets live elsewhere on the page;
           this only reads them, and only marks its own links. */
        if ("IntersectionObserver" in window) {
          var byId = {};
          links.forEach(function (a) {
            var id = (a.getAttribute("href") || "").slice(1);
            var el = id && document.getElementById(id);
            if (el) byId[id] = { a: a, el: el };
          });
          var watch = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
              if (!en.isIntersecting) return;
              links.forEach(function (a) { a.removeAttribute("aria-current"); });
              var hit = byId[en.target.id];
              if (hit) hit.a.setAttribute("aria-current", "location");
            });
          }, { rootMargin: "-35% 0px -60% 0px" });
          Object.keys(byId).forEach(function (k) { watch.observe(byId[k].el); });
        }`;
      }

      return { html: html, css: css, js: body ? c.wrap(c.cls, body) : '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Video Library                                                          */
  /*                                                                        */
  /* One player and a list of videos beside it. Nothing loads from YouTube  */
  /* or Vimeo until somebody presses play, like Video Embed. Every video is */
  /* also a real link to its watch page, so where scripts are stripped the  */
  /* list still works — it just opens the video on the host's own site.     */
  /* --------------------------------------------------------------------- */

  function videoRef(provider, raw) {
    raw = String(raw == null ? '' : raw).trim();
    var id = raw, m;
    if (provider === 'vimeo') {
      m = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (m) id = m[1];
    } else {
      m = raw.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
      if (m) id = m[1];
    }
    id = id.replace(/[^A-Za-z0-9_-]/g, '');
    return {
      id: id,
      embed: provider === 'vimeo'
        ? 'https://player.vimeo.com/video/' + id + '?autoplay=1'
        : 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0',
      watch: provider === 'vimeo' ? 'https://vimeo.com/' + id : 'https://www.youtube.com/watch?v=' + id,
      thumb: provider === 'vimeo' ? '' : 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'
    };
  }

  CB.register({
    id: 'video-library',
    name: 'Video Library',
    category: CAT,
    icon: '▶',
    blurb: 'Training and product videos: one player and a list beside it. Nothing loads from YouTube or Vimeo until someone presses play.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'Training' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Installation videos' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: 'Short walkthroughs from the people who train contractors.' },

      { t: 'section', label: 'Videos' },
      { k: 'provider', t: 'select', label: 'Videos are on', value: 'youtube', options: [['youtube', 'YouTube'], ['vimeo', 'Vimeo']] },
      {
        k: 'items', t: 'list', label: 'Videos', itemLabel: 'title',
        fields: [
          { k: 'title', t: 'text', label: 'Title', value: 'Video title' },
          { k: 'videoId', t: 'text', label: 'Video ID or URL', value: 'aqz-KE-bpKQ', help: 'Paste the full watch or share address and the ID is worked out from it.' },
          { k: 'duration', t: 'text', label: 'Length', value: '', help: 'Shown on the thumbnail, like “4:32”.' },
          { k: 'poster', t: 'image', label: 'Thumbnail', value: '', help: 'Optional for YouTube, which supplies one. Needed for Vimeo.' },
          { k: 'text', t: 'textarea', label: 'Description', value: '' }
        ],
        value: [
          { title: 'Pulling cable through conduit', videoId: 'aqz-KE-bpKQ', duration: '6:12', poster: '', text: 'Setting up the reel, lubricating, and keeping the pull inside the cable’s limits.' },
          { title: 'Stripping and terminating', videoId: 'aqz-KE-bpKQ', duration: '4:48', poster: '', text: 'Clean strips without nicking the conductor, and torque that holds.' },
          { title: 'Reading a spec sheet', videoId: 'aqz-KE-bpKQ', duration: '3:20', poster: '', text: 'What each rating means and where to find it.' },
          { title: 'Choosing a pulling lubricant', videoId: 'aqz-KE-bpKQ', duration: '2:55', poster: '', text: 'Matching the lubricant to the jacket and the run.' }
        ]
      },

      { t: 'section', label: 'Style' },
      { k: 'listSide', t: 'select', label: 'List sits', value: 'right', options: [['right', 'Beside the player'], ['below', 'Under the player']] },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var provider = p.provider === 'vimeo' ? 'vimeo' : 'youtube';
      var items = (p.items || []).filter(function (it) { return it && it.videoId; }).map(function (it) {
        var ref = videoRef(provider, it.videoId);
        return { it: it, ref: ref, poster: it.poster || ref.thumb || CB.ph(640, 360, '', '#1c1a18', '#96694c') };
      });
      var first = items[0];
      var below = p.listSide === 'below';

      var stage = first ? c.dedent(`
        <div class="cb-vl__stage">
          <div class="cb-vl__frame" data-src="${c.attr(first.ref.embed)}" data-label="${c.attr(first.it.title)}">
            <img class="cb-vl__poster" src="${c.url(first.poster)}" alt="" loading="lazy" decoding="async">
            <a class="cb-vl__play" href="${c.url(first.ref.watch)}">
              <span class="cb-vl__tri" aria-hidden="true"></span>
              <span class="cb-sr">Play: <span class="cb-vl__playName">${c.esc(first.it.title)}</span></span>
            </a>
          </div>
          <h3 class="cb-vl__now">${c.esc(first.it.title)}</h3>
          <p class="cb-vl__nowText"${first.it.text ? '' : ' hidden'}>${c.esc(first.it.text || '')}</p>
        </div>`) : '';

      var list = items.map(function (v, i) {
        return c.dedent(`
          <li>
            <a class="cb-vl__item" href="${c.url(v.ref.watch)}"${i === 0 ? ' aria-current="true"' : ''}
               data-src="${c.attr(v.ref.embed)}" data-poster="${c.url(v.poster)}"
               data-title="${c.attr(v.it.title)}" data-text="${c.attr(v.it.text || '')}">
              <span class="cb-vl__thumb">
                <img src="${c.url(v.poster)}" alt="" loading="lazy" decoding="async">
                ${v.it.duration ? '<span class="cb-vl__dur">' + c.esc(v.it.duration) + '</span>' : ''}
              </span>
              <span class="cb-vl__t">${c.esc(v.it.title)}</span>
            </a>
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-vl">
          <div class="cb-wrap">
            ${(p.eyebrow || p.title || p.sub) ? `<header class="cb-vl__head">
              ${p.eyebrow ? '<p class="cb-vl__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-vl__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-vl__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <div class="cb-vl__layout${below ? ' cb-vl__layout--below' : ''}">
        ${c.indent(stage, 6)}
              <ol class="cb-vl__list" aria-label="Videos">
        ${c.indent(list, 8)}
              </ol>
            </div>
          </div>
        </section>`);

      var css = `
        ${s}.cb-vl { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-vl__head { max-width: 660px; margin-bottom: 30px; }
        ${s} .cb-vl__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand-ink, var(--cb-brand)); margin-bottom: 12px;
        }
        ${s} .cb-vl__title {
          font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800);
          line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em));
        }
        ${s} .cb-vl__sub { margin-top: 10px; color: var(--cb-muted); }

        ${s} .cb-vl__layout { display: grid; gap: 28px; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); align-items: start; }
        ${s} .cb-vl__layout--below { grid-template-columns: 1fr; }
        ${s} .cb-vl__frame {
          position: relative; overflow: hidden; aspect-ratio: 16 / 9; background: #000;
          border-radius: var(--cb-radius);
        }
        ${s} .cb-vl__poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        ${s} .cb-vl__frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        ${s} .cb-vl__play {
          position: absolute; top: 50%; left: 50%; translate: -50% -50%;
          display: grid; place-items: center; width: 76px; height: 76px; border-radius: 50%;
          background: var(--cb-brand); box-shadow: 0 12px 30px -12px rgba(0,0,0,.7);
          transition: scale .2s ease;
        }
        ${s} .cb-vl__play:hover { scale: 1.07; }
        ${s} .cb-vl__play:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
        ${s} .cb-vl__tri {
          width: 0; height: 0; margin-left: 5px; border-style: solid;
          border-width: 11px 0 11px 18px; border-color: transparent transparent transparent currentColor;
        }
        ${s} .cb-vl__now {
          margin-top: 16px; font-size: 1.12em; font-weight: var(--cb-h-weight, 700);
          line-height: calc(1.3 + var(--cb-h-leading, 0)); letter-spacing: calc(-.01em + var(--cb-h-track, 0em));
        }
        ${s} .cb-vl__nowText { margin-top: 6px; font-size: .92em; color: var(--cb-muted); }
        ${s} .cb-vl__nowText[hidden] { display: none; }

        ${s} .cb-vl__list { display: grid; gap: 6px; }
        ${s} .cb-vl__layout--below .cb-vl__list { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        ${s} .cb-vl__item {
          display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 12px; align-items: center;
          padding: 8px; border-radius: calc(var(--cb-radius) * .6); color: var(--cb-ink); text-decoration: none;
          border: 1px solid transparent; transition: background-color .2s ease, border-color .2s ease;
        }
        ${s} .cb-vl__layout--below .cb-vl__item { grid-template-columns: 1fr; }
        ${s} .cb-vl__item:hover { background: var(--cb-subtle); }
        ${s} .cb-vl__item[aria-current] { background: var(--cb-subtle); border-color: var(--cb-border); }
        ${s} .cb-vl__item:focus-visible { outline: 2px solid var(--cb-brand); outline-offset: 2px; }
        ${s} .cb-vl__thumb {
          position: relative; display: block; overflow: hidden; aspect-ratio: 16 / 9;
          border-radius: calc(var(--cb-radius) * .5); background: var(--cb-subtle);
        }
        ${s} .cb-vl__thumb img { width: 100%; height: 100%; object-fit: cover; }
        ${s} .cb-vl__dur {
          position: absolute; right: 6px; bottom: 6px; padding: 1px 6px; border-radius: calc(var(--cb-radius) * .3);
          background: rgba(0,0,0,.78); font-size: .75em; font-weight: 700; font-variant-numeric: tabular-nums;
        }
        ${s} .cb-vl__t { font-size: .92em; font-weight: 600; line-height: 1.35; }
        ${c.pin([s + ' .cb-vl__play', s + ' .cb-vl__dur'], 'var(--cb-on-dark, #fff)')}

        @media (max-width: 860px) { ${s} .cb-vl__layout { grid-template-columns: 1fr; } }`;

      var js = c.wrap(c.cls, `
        var frame = root.querySelector(".cb-vl__frame");
        var play = root.querySelector(".cb-vl__play");
        var now = root.querySelector(".cb-vl__now");
        var nowText = root.querySelector(".cb-vl__nowText");
        var items = Array.prototype.slice.call(root.querySelectorAll(".cb-vl__item"));
        if (!frame) return;
        var poster = frame.innerHTML;

        function load() {
          var iframe = document.createElement("iframe");
          iframe.src = frame.getAttribute("data-src");
          iframe.title = frame.getAttribute("data-label") || "Video player";
          iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
          iframe.setAttribute("allowfullscreen", "");
          iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
          frame.innerHTML = "";
          frame.appendChild(iframe);
          iframe.focus();
        }
        function bindPlay() {
          var p = frame.querySelector(".cb-vl__play");
          if (p) p.addEventListener("click", function (ev) { ev.preventDefault(); load(); });
        }
        bindPlay();

        /* Choosing a video swaps what the player will load, and only starts it
           straight away if a video was already playing — otherwise it would be
           autoplaying something nobody asked to hear yet. */
        items.forEach(function (item) {
          item.addEventListener("click", function (ev) {
            ev.preventDefault();
            var playing = !!frame.querySelector("iframe");
            frame.setAttribute("data-src", item.getAttribute("data-src"));
            frame.setAttribute("data-label", item.getAttribute("data-title"));
            items.forEach(function (i) { i.removeAttribute("aria-current"); });
            item.setAttribute("aria-current", "true");
            if (now) now.textContent = item.getAttribute("data-title");
            if (nowText) {
              nowText.textContent = item.getAttribute("data-text");
              nowText.hidden = !item.getAttribute("data-text");
            }
            if (playing) { load(); return; }
            frame.innerHTML = poster;
            var img = frame.querySelector(".cb-vl__poster");
            if (img) img.src = item.getAttribute("data-poster");
            var a = frame.querySelector(".cb-vl__play");
            if (a) a.href = item.href;
            var name = frame.querySelector(".cb-vl__playName");
            if (name) name.textContent = item.getAttribute("data-title");
            bindPlay();
          });
        });`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Voltage Drop Calculator                                                */
  /*                                                                        */
  /* The K-factor estimate every electrician knows: drop = 2 x K x I x L /  */
  /* CM, with the square root of 3 in place of 2 for three-phase. The       */
  /* conductor areas are the circular-mil figures from NEC Chapter 9,       */
  /* Table 8, and K is the usual 12.9 for copper and 21.2 for aluminum.    */
  /*                                                                        */
  /* It reports voltage drop and nothing else, on purpose. It does not      */
  /* suggest a wire size, because the smallest size that meets a drop        */
  /* target can be too small for the current — 14 AWG clears 3% on a short */
  /* 20 A run and is still not allowed to carry it. Sizing for ampacity is  */
  /* a code calculation with correction factors, and it is left to the      */
  /* people whose tables those are. Preflight asks for an engineering check */
  /* before any page with this on it ships.                                 */
  /*                                                                        */
  /* The table and the formula live in one place and are used twice: here, */
  /* to write the correct figures for the starting values into the markup, */
  /* and in the script, for whatever somebody types next. Two copies of the */
  /* same arithmetic are two chances for them to disagree.                  */
  /* --------------------------------------------------------------------- */

  var VD_SIZES = [
    ['14', '14 AWG', 4110], ['12', '12 AWG', 6530], ['10', '10 AWG', 10380], ['8', '8 AWG', 16510],
    ['6', '6 AWG', 26240], ['4', '4 AWG', 41740], ['3', '3 AWG', 52620], ['2', '2 AWG', 66360],
    ['1', '1 AWG', 83690], ['1/0', '1/0 AWG', 105600], ['2/0', '2/0 AWG', 133100], ['3/0', '3/0 AWG', 167800],
    ['4/0', '4/0 AWG', 211600], ['250', '250 kcmil', 250000], ['300', '300 kcmil', 300000],
    ['350', '350 kcmil', 350000], ['400', '400 kcmil', 400000], ['500', '500 kcmil', 500000],
    ['600', '600 kcmil', 600000], ['750', '750 kcmil', 750000]
  ];
  var VD_K = { cu: 12.9, al: 21.2 };

  function vdCalc(system, material, size, volts, amps, feet) {
    var cm = 0;
    VD_SIZES.forEach(function (r) { if (r[0] === String(size)) cm = r[2]; });
    var k = VD_K[material] || VD_K.cu;
    var mult = String(system) === '3' ? Math.sqrt(3) : 2;
    if (!cm || !(volts > 0) || !(amps >= 0) || !(feet >= 0)) return null;
    var vd = mult * k * amps * feet / cm;
    return { vd: vd, pct: vd / volts * 100, load: volts - vd };
  }

  CB.register({
    id: 'calculator',
    name: 'Voltage Drop Calculator',
    category: CAT,
    icon: '⚡',
    blurb: 'A voltage drop estimate for one run of copper or aluminum conductor. Needs JavaScript to recalculate; preflight asks for an engineering check before it ships.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'Tools' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Voltage drop calculator' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: 'An estimate for a single run of copper or aluminum conductor.' },

      { t: 'section', label: 'Starting values' },
      { k: 'system', t: 'select', label: 'System', value: '1', options: [['1', 'Single-phase'], ['3', 'Three-phase']] },
      { k: 'material', t: 'select', label: 'Conductor', value: 'cu', options: [['cu', 'Copper'], ['al', 'Aluminum']] },
      { k: 'size', t: 'select', label: 'Size', value: '12', options: VD_SIZES.map(function (r) { return [r[0], r[1]]; }) },
      { k: 'volts', t: 'number', label: 'Voltage', value: 120 },
      { k: 'amps', t: 'number', label: 'Current (amps)', value: 20 },
      { k: 'feet', t: 'number', label: 'One-way length (feet)', value: 100 },
      {
        k: 'target', t: 'range', label: 'Flag drops above', min: 1, max: 10, step: 0.5, unit: '%', value: 3,
        help: 'NEC informational notes suggest 3% for a branch circuit and 5% for feeder and branch together.'
      },

      { t: 'section', label: 'Style' },
      { k: 'showFormula', t: 'toggle', label: 'Show the formula', value: true },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var target = c.clamp(c.num(p.target, 3), 0.5, 20);
      var volts = c.num(p.volts, 120), amps = c.num(p.amps, 20), feet = c.num(p.feet, 100);
      var r = vdCalc(p.system, p.material, p.size, volts, amps, feet);

      function verdict(res) {
        if (!res) return 'Enter a voltage, current and length to see the drop.';
        return res.pct <= target
          ? 'Within the ' + target + '% you set.'
          : 'Above the ' + target + '% you set.';
      }
      function opt(list, val) {
        return list.map(function (o) {
          return '<option value="' + c.attr(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + c.esc(o[1]) + '</option>';
        }).join('');
      }

      var html = c.dedent(`
        <section class="${c.cls} cb-vd cb-vd--static">
          <div class="cb-wrap">
            ${(p.eyebrow || p.title || p.sub) ? `<header class="cb-vd__head">
              ${p.eyebrow ? '<p class="cb-vd__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-vd__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-vd__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <div class="cb-vd__card">
              <form class="cb-vd__form" data-target="${target}">
                <label class="cb-vd__f"><span class="cb-vd__l">System</span>
                  <select name="system">${opt([['1', 'Single-phase'], ['3', 'Three-phase']], p.system)}</select></label>
                <label class="cb-vd__f"><span class="cb-vd__l">Conductor</span>
                  <select name="material">${opt([['cu', 'Copper'], ['al', 'Aluminum']], p.material)}</select></label>
                <label class="cb-vd__f"><span class="cb-vd__l">Size</span>
                  <select name="size">${opt(VD_SIZES.map(function (x) { return [x[0], x[1]]; }), p.size)}</select></label>
                <label class="cb-vd__f"><span class="cb-vd__l">Voltage</span>
                  <input name="volts" type="number" inputmode="decimal" min="1" step="any" value="${c.attr(volts)}"></label>
                <label class="cb-vd__f"><span class="cb-vd__l">Current (A)</span>
                  <input name="amps" type="number" inputmode="decimal" min="0" step="any" value="${c.attr(amps)}"></label>
                <label class="cb-vd__f"><span class="cb-vd__l">One-way length (ft)</span>
                  <input name="feet" type="number" inputmode="decimal" min="0" step="any" value="${c.attr(feet)}"></label>
              </form>
              <div class="cb-vd__out" aria-live="polite">
                <div class="cb-vd__stat cb-vd__stat--main">
                  <span class="cb-vd__k">Voltage drop</span>
                  <output class="cb-vd__big" data-out="vd">${r ? r.vd.toFixed(2) + ' V' : '—'}</output>
                </div>
                <div class="cb-vd__stat">
                  <span class="cb-vd__k">Percent drop</span>
                  <output class="cb-vd__mid" data-out="pct">${r ? r.pct.toFixed(2) + '%' : '—'}</output>
                </div>
                <div class="cb-vd__stat">
                  <span class="cb-vd__k">At the load</span>
                  <output class="cb-vd__mid" data-out="load">${r ? r.load.toFixed(1) + ' V' : '—'}</output>
                </div>
                <p class="cb-vd__verdict" data-out="verdict" data-over="${r && r.pct > target ? 'true' : 'false'}">${c.esc(verdict(r))}</p>
              </div>
            </div>
            <p class="cb-vd__static">Changing the values needs JavaScript, which this page is not running. The figures shown are for the starting values.</p>
            ${p.showFormula ? `<p class="cb-vd__formula">Voltage drop = 2 × K × I × L ÷ CM, with 1.732 in place of 2 for three-phase. K is 12.9 for copper and 21.2 for aluminum; CM is the conductor’s area in circular mils, from NEC Chapter 9, Table 8.</p>` : ''}
            <p class="cb-vd__note">An estimate, not a design. It leaves out reactance and power factor, which matter more on large conductors, and it checks voltage drop only — not whether the conductor is rated for the current. Confirm against the NEC and the product data before you specify.</p>
          </div>
        </section>`);

      var css = `
        ${s}.cb-vd { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-vd__head { max-width: 660px; margin-bottom: 30px; }
        ${s} .cb-vd__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand-ink, var(--cb-brand)); margin-bottom: 12px;
        }
        ${s} .cb-vd__title {
          font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800);
          line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em));
        }
        ${s} .cb-vd__sub { margin-top: 10px; color: var(--cb-muted); }
        ${s} .cb-vd__card {
          display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 0;
          background: var(--cb-surface); border: 1px solid var(--cb-border);
          border-radius: var(--cb-radius); overflow: hidden;
        }
        ${s} .cb-vd__form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 18px; padding: 26px; }
        ${s} .cb-vd__f { display: flex; flex-direction: column; gap: 6px; }
        ${s} .cb-vd__l { font-size: .85em; font-weight: 600; color: var(--cb-muted); }
        /* Themes style bare inputs and selects heavily — fixed heights, thick
           borders, their own fonts — so every property that shapes these is
           stated rather than left to inherit. */
        ${s} .cb-vd__f select, ${s} .cb-vd__f input {
          width: 100%; height: auto; min-height: 44px; margin: 0; padding: 9px 12px;
          font: inherit; font-size: 1em; color: var(--cb-ink); background: var(--cb-page);
          border: 1px solid var(--cb-border); border-radius: calc(var(--cb-radius) * .5); box-shadow: none;
        }
        ${s} .cb-vd__f select:focus-visible, ${s} .cb-vd__f input:focus-visible { outline: 2px solid var(--cb-brand); outline-offset: 1px; }
        ${s} .cb-vd__out {
          display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: 26px;
          background: var(--cb-subtle); border-left: 1px solid var(--cb-border);
        }
        ${s} .cb-vd__stat { display: flex; flex-direction: column; gap: 2px; }
        ${s} .cb-vd__stat--main { padding-bottom: 14px; border-bottom: 1px solid var(--cb-border); }
        ${s} .cb-vd__k { font-size: .85em; color: var(--cb-muted); }
        ${s} .cb-vd__big {
          font-size: calc(clamp(30px, 5vw, 46px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800);
          line-height: 1; letter-spacing: -.03em; color: var(--cb-ink); font-variant-numeric: tabular-nums;
        }
        ${s} .cb-vd__mid {
          font-size: calc(clamp(20px, 2.6vw, 28px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 700);
          line-height: 1.2; color: var(--cb-ink); font-variant-numeric: tabular-nums;
        }
        /* The verdict is words first. The mark beside it adds emphasis but
           never carries the meaning on its own. */
        ${s} .cb-vd__verdict { font-size: .92em; font-weight: 600; color: var(--cb-ink); display: flex; align-items: center; gap: 8px; }
        ${s} .cb-vd__verdict::before {
          content: ""; flex: none; width: 10px; height: 10px; border-radius: 50%; background: #3f7d4f;
        }
        ${s} .cb-vd__verdict[data-over="true"]::before { background: #c2410c; }
        ${s} .cb-vd__static { display: none; }
        ${s}.cb-vd--static .cb-vd__static { display: block; margin-top: 14px; font-size: .85em; color: var(--cb-muted); }
        ${s} .cb-vd__formula { margin-top: 18px; font-size: .85em; color: var(--cb-muted); max-width: 72ch; }
        ${s} .cb-vd__note { margin-top: 10px; font-size: .85em; color: var(--cb-muted); max-width: 72ch; }

        @media (max-width: 820px) {
          ${s} .cb-vd__card { grid-template-columns: 1fr; }
          ${s} .cb-vd__out { border-left: 0; border-top: 1px solid var(--cb-border); }
        }
        @media (max-width: 480px) { ${s} .cb-vd__form { grid-template-columns: 1fr; } }`;

      var table = JSON.stringify(VD_SIZES.map(function (x) { return [x[0], x[2]]; }));
      var js = c.wrap(c.cls, `
        var form = root.querySelector(".cb-vd__form");
        if (!form) return;
        root.classList.remove("cb-vd--static");
        var SIZES = ${table};
        var K = { cu: ${VD_K.cu}, al: ${VD_K.al} };
        var TARGET = parseFloat(form.getAttribute("data-target")) || 3;
        function out(name) { return root.querySelector("[data-out=" + name + "]"); }
        function num(name) { return parseFloat(form.elements[name].value); }

        function run() {
          var size = form.elements.size.value, cm = 0;
          SIZES.forEach(function (r) { if (r[0] === size) cm = r[1]; });
          var k = K[form.elements.material.value] || K.cu;
          var mult = form.elements.system.value === "3" ? Math.sqrt(3) : 2;
          var v = num("volts"), a = num("amps"), l = num("feet");
          var ok = cm && v > 0 && a >= 0 && l >= 0;
          var vd = ok ? mult * k * a * l / cm : 0;
          var pct = ok ? vd / v * 100 : 0;
          out("vd").textContent = ok ? vd.toFixed(2) + " V" : "\\u2014";
          out("pct").textContent = ok ? pct.toFixed(2) + "%" : "\\u2014";
          out("load").textContent = ok ? (v - vd).toFixed(1) + " V" : "\\u2014";
          var verdict = out("verdict");
          verdict.textContent = !ok ? "Enter a voltage, current and length to see the drop."
            : (pct <= TARGET ? "Within the " + TARGET + "% you set." : "Above the " + TARGET + "% you set.");
          verdict.setAttribute("data-over", ok && pct > TARGET ? "true" : "false");
        }
        form.addEventListener("input", run);
        form.addEventListener("change", run);
        form.addEventListener("submit", function (ev) { ev.preventDefault(); run(); });
        run();`);

      return { html: html, css: css, js: js };
    }
  });
})();
