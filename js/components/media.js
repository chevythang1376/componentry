/* ============================================================================
   Media & utility — before/after, gallery, marquee, countdown, video facade
   ========================================================================== */
(function () {
  'use strict';

  var CAT = 'Media & Utility';

  /* --------------------------------------------------------------------- */
  /* Before / After Slider                                                  */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'before-after',
    name: 'Before / After Slider',
    category: CAT,
    icon: '◑',
    blurb: 'Image comparison built on a real range input, so it drags with a pointer and steps with arrow keys.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Before and after' },
      { k: 'sub', t: 'textarea', label: 'Intro copy', value: '' },

      { t: 'section', label: 'Images' },
      { k: 'before', t: 'image', label: 'Before image', value: CB.ph(1200, 800, 'BEFORE', '#475569', '#94a3b8') },
      { k: 'beforeAlt', t: 'text', label: 'Before alt text', value: 'Before' },
      { k: 'after', t: 'image', label: 'After image', value: CB.ph(1200, 800, 'AFTER', '#4f46e5', '#06b6d4') },
      { k: 'afterAlt', t: 'text', label: 'After alt text', value: 'After' },
      { k: 'ratio', t: 'select', label: 'Aspect ratio', value: '3/2', options: [['16/9', '16 : 9'], ['3/2', '3 : 2'], ['4/3', '4 : 3'], ['1/1', 'Square']] },

      { t: 'section', label: 'Labels' },
      { k: 'beforeLabel', t: 'text', label: 'Before label', value: 'Before' },
      { k: 'afterLabel', t: 'text', label: 'After label', value: 'After' },
      { k: 'showLabels', t: 'toggle', label: 'Show labels', value: true },

      { t: 'section', label: 'Style' },
      { k: 'start', t: 'range', label: 'Start position', min: 0, max: 100, step: 1, unit: '%', value: 50 },
      { k: 'handleColor', t: 'color', label: 'Handle colour', value: '#ffffff' },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 72 }
    ],

    render: function (p, c) {
      var s = c.s;
      var start = c.clamp(c.num(p.start, 50), 0, 100);

      var html = c.dedent(`
        <section class="${c.cls} cb-ba">
          <div class="cb-wrap">
            ${(p.title || p.sub) ? `<header class="cb-ba__head">
              ${p.title ? '<h2 class="cb-ba__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-ba__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <div class="cb-ba__frame" style="--cb-ba-pos: ${start}%">
              <img class="cb-ba__img cb-ba__after" src="${c.url(p.after)}" alt="${c.attr(p.afterAlt)}" loading="lazy" decoding="async">
              <img class="cb-ba__img cb-ba__before" src="${c.url(p.before)}" alt="${c.attr(p.beforeAlt)}" loading="lazy" decoding="async">
              ${p.showLabels ? `<span class="cb-ba__tag cb-ba__tag--b" aria-hidden="true">${c.esc(p.beforeLabel)}</span>
              <span class="cb-ba__tag cb-ba__tag--a" aria-hidden="true">${c.esc(p.afterLabel)}</span>` : ''}
              <input class="cb-ba__range" type="range" min="0" max="100" step="1" value="${start}"
                     aria-label="Reveal ${c.attr(p.beforeLabel)} or ${c.attr(p.afterLabel)}"
                     aria-valuetext="${start}% ${c.attr(p.beforeLabel)}">
              <span class="cb-ba__divider" aria-hidden="true"><span class="cb-ba__grip"></span></span>
            </div>
          </div>
        </section>`);

      var css = `
        ${s}.cb-ba { background: ${p.bg}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-ba__head { margin-bottom: 28px; max-width: 620px; }
        ${s} .cb-ba__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; }
        ${s} .cb-ba__sub { color: var(--cb-muted); margin-top: 10px; }
        ${s} .cb-ba__frame {
          position: relative; overflow: hidden; border-radius: var(--cb-radius);
          aspect-ratio: ${p.ratio}; background: var(--cb-subtle); touch-action: pan-y;
          user-select: none; -webkit-user-select: none;
        }
        ${s} .cb-ba__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        ${s} .cb-ba__before { clip-path: inset(0 calc(100% - var(--cb-ba-pos)) 0 0); }
        ${s} .cb-ba__divider {
          position: absolute; top: 0; bottom: 0; left: var(--cb-ba-pos);
          width: 3px; translate: -50% 0; background: ${p.handleColor};
          box-shadow: 0 0 12px rgba(0,0,0,.35); pointer-events: none;
        }
        ${s} .cb-ba__grip {
          position: absolute; top: 50%; left: 50%; translate: -50% -50%;
          width: 42px; height: 42px; border-radius: 50%;
          background: ${p.handleColor}; box-shadow: 0 4px 16px rgba(0,0,0,.35);
          display: grid; place-items: center;
        }
        ${s} .cb-ba__grip::before, ${s} .cb-ba__grip::after {
          content: ""; position: absolute; top: 50%; translate: 0 -50%;
          border: solid var(--cb-ink); border-width: 0 2px 2px 0; width: 7px; height: 7px;
        }
        ${s} .cb-ba__grip::before { left: 12px; rotate: 135deg; }
        ${s} .cb-ba__grip::after { right: 12px; rotate: -45deg; }
        /* The range input is the real control — invisible, but focusable and draggable. */
        ${s} .cb-ba__range {
          position: absolute; inset: 0; width: 100%; height: 100%; margin: 0;
          opacity: 0; cursor: ew-resize; appearance: none; -webkit-appearance: none; background: none;
        }
        ${s} .cb-ba__range::-webkit-slider-thumb { -webkit-appearance: none; width: 48px; height: 100%; cursor: ew-resize; }
        ${s} .cb-ba__range::-moz-range-thumb { width: 48px; height: 999px; border: 0; opacity: 0; cursor: ew-resize; }
        ${s} .cb-ba__range:focus-visible ~ .cb-ba__divider .cb-ba__grip {
          outline: 3px solid var(--cb-brand); outline-offset: 3px;
        }
        ${s} .cb-ba__tag {
          position: absolute; top: 14px; z-index: 1;
          background: rgba(9,12,20,.68); color: #fff; backdrop-filter: blur(4px);
          font-size: .74em; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
          padding: 6px 12px; border-radius: 999px; pointer-events: none;
        }
        ${s} .cb-ba__tag--b { left: 14px; }
        ${s} .cb-ba__tag--a { right: 14px; }`;

      var js = c.wrap(c.cls, `
        var frame = root.querySelector(".cb-ba__frame");
        var range = root.querySelector(".cb-ba__range");
        if (!frame || !range) return;

        var beforeLabel = ${JSON.stringify(String(p.beforeLabel || 'before'))};

        function apply(v) {
          frame.style.setProperty("--cb-ba-pos", v + "%");
          range.setAttribute("aria-valuetext", Math.round(v) + "% " + beforeLabel);
        }
        range.addEventListener("input", function () { apply(range.value); });

        /* Pointer drag anywhere on the frame, not just on the thumb. */
        var dragging = false;
        function fromEvent(e) {
          var r = frame.getBoundingClientRect();
          var pct = ((e.clientX - r.left) / r.width) * 100;
          pct = Math.max(0, Math.min(100, pct));
          range.value = pct;
          apply(pct);
        }
        frame.addEventListener("pointerdown", function (e) {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          dragging = true;
          frame.setPointerCapture(e.pointerId);
          fromEvent(e);
        });
        frame.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
        frame.addEventListener("pointerup", function (e) {
          dragging = false;
          if (frame.hasPointerCapture(e.pointerId)) frame.releasePointerCapture(e.pointerId);
        });
        frame.addEventListener("pointercancel", function () { dragging = false; });

        apply(range.value);`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Gallery + Lightbox                                                     */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'gallery',
    name: 'Gallery + Lightbox',
    category: CAT,
    icon: '▣',
    blurb: 'Masonry or uniform grid. The lightbox uses a native <dialog>, so focus trapping and Escape come from the browser.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Gallery' },

      { t: 'section', label: 'Images' },
      {
        k: 'items', t: 'list', label: 'Images', itemLabel: 'caption',
        fields: [
          { k: 'image', t: 'image', label: 'Image', value: CB.ph(900, 700, '', '#4f46e5', '#0891b2') },
          { k: 'alt', t: 'text', label: 'Alt text', value: '' },
          { k: 'caption', t: 'text', label: 'Caption', value: '' }
        ],
        value: [
          { image: CB.ph(900, 700, '', '#4f46e5', '#0891b2'), alt: '', caption: 'Studio, morning light' },
          { image: CB.ph(900, 1100, '', '#7c3aed', '#db2777'), alt: '', caption: 'Print run' },
          { image: CB.ph(900, 620, '', '#0891b2', '#22c55e'), alt: '', caption: 'Signage test' },
          { image: CB.ph(900, 900, '', '#ea580c', '#f59e0b'), alt: '', caption: 'Colour proofs' },
          { image: CB.ph(900, 760, '', '#0f766e', '#84cc16'), alt: '', caption: 'Workshop' },
          { image: CB.ph(900, 1000, '', '#be123c', '#f43f5e'), alt: '', caption: 'Final install' }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'layout', t: 'select', label: 'Layout', value: 'masonry', options: [['masonry', 'Masonry columns'], ['uniform', 'Uniform grid']] },
      { k: 'cols', t: 'range', label: 'Columns', min: 2, max: 5, step: 1, value: 3 },
      { k: 'gap', t: 'range', label: 'Gap', min: 2, max: 32, step: 2, unit: 'px', value: 14 },
      { k: 'ratio', t: 'select', label: 'Tile ratio', value: '1/1', options: [['1/1', 'Square'], ['4/3', '4 : 3'], ['3/4', 'Portrait'], ['16/9', '16 : 9']], when: { layout: ['uniform'] } },

      { t: 'section', label: 'Behaviour' },
      { k: 'lightbox', t: 'toggle', label: 'Enable lightbox', value: true },
      { k: 'captions', t: 'toggle', label: 'Captions on hover', value: true },

      { t: 'section', label: 'Style' },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 72 }
    ],

    render: function (p, c) {
      var s = c.s, base = c.cls;
      var items = (p.items || []).filter(Boolean);
      var masonry = p.layout === 'masonry';

      var tiles = items.map(function (it, i) {
        var img = '<img src="' + c.url(it.image) + '" alt="' + c.attr(it.alt) + '" loading="' + (i < 4 ? 'eager' : 'lazy') + '" decoding="async">';
        var cap = (p.captions && it.caption) ? '<span class="cb-gl__cap">' + c.esc(it.caption) + '</span>' : '';
        return p.lightbox
          ? '<button type="button" class="cb-gl__tile" data-i="' + i + '" aria-label="Open image ' + (i + 1) + ' of ' + items.length + (it.caption ? ': ' + c.attr(it.caption) : '') + '">' + img + cap + '</button>'
          : '<figure class="cb-gl__tile">' + img + cap + '</figure>';
      }).join('\n');

      var data = items.map(function (it) {
        return { src: String(it.image || ''), alt: String(it.alt || ''), caption: String(it.caption || '') };
      });

      var html = c.dedent(`
        <section class="${c.cls} cb-gl">
          <div class="cb-wrap">
            ${p.title ? '<h2 class="cb-gl__title">' + c.rich(p.title) + '</h2>' : ''}
            <div class="cb-gl__grid">
        ${c.indent(tiles, 6)}
            </div>
          </div>
          ${p.lightbox ? c.dedent(`
          <dialog class="cb-gl__box" id="${base}-box" aria-label="Image viewer">
            <div class="cb-gl__boxIn">
              <img class="cb-gl__boxImg" src="" alt="">
              <p class="cb-gl__boxCap"></p>
            </div>
            <button type="button" class="cb-gl__close" aria-label="Close viewer">&times;</button>
            <button type="button" class="cb-gl__nav cb-gl__navPrev" aria-label="Previous image">&#8249;</button>
            <button type="button" class="cb-gl__nav cb-gl__navNext" aria-label="Next image">&#8250;</button>
            <p class="cb-gl__count" aria-live="polite"></p>
          </dialog>`) : ''}
        </section>`);

      var css = `
        ${s}.cb-gl { background: ${p.bg}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-gl__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; margin-bottom: 28px; }
        ${masonry ? `
        ${s} .cb-gl__grid { columns: ${c.clamp(c.num(p.cols, 3), 2, 5)}; column-gap: ${c.num(p.gap, 14)}px; }
        ${s} .cb-gl__tile { break-inside: avoid; margin-bottom: ${c.num(p.gap, 14)}px; width: 100%; display: block; }`
        : `
        ${s} .cb-gl__grid {
          display: grid; gap: ${c.num(p.gap, 14)}px;
          grid-template-columns: repeat(${c.clamp(c.num(p.cols, 3), 2, 5)}, minmax(0, 1fr));
        }
        ${s} .cb-gl__tile img { aspect-ratio: ${p.ratio || '1/1'}; object-fit: cover; }`}
        ${s} .cb-gl__tile {
          position: relative; overflow: hidden; border-radius: calc(var(--cb-radius) * .8);
          padding: 0; background: var(--cb-subtle); cursor: ${p.lightbox ? 'zoom-in' : 'default'};
        }
        ${s} .cb-gl__tile img { width: 100%; transition: transform .5s cubic-bezier(.2,.7,.3,1); }
        ${s} .cb-gl__tile:hover img { transform: scale(1.06); }
        ${s} .cb-gl__cap {
          position: absolute; inset: auto 0 0 0; padding: 34px 14px 12px;
          color: #fff; font-size: .85em; text-align: left;
          background: linear-gradient(to top, rgba(6,10,20,.82), transparent);
          opacity: 0; transition: opacity .25s ease;
        }
        ${s} .cb-gl__tile:hover .cb-gl__cap, ${s} .cb-gl__tile:focus-visible .cb-gl__cap { opacity: 1; }

        ${s} .cb-gl__box {
          border: 0; padding: 0; background: transparent; max-width: 100vw; max-height: 100vh;
          width: 100%; height: 100%; overflow: hidden; color: #fff;
        }
        ${s} .cb-gl__box::backdrop { background: rgba(6,10,20,.92); backdrop-filter: blur(4px); }
        ${s} .cb-gl__boxIn {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 14px; padding: 60px 72px;
        }
        ${s} .cb-gl__boxImg {
          max-width: 100%; max-height: calc(100vh - 150px); width: auto; object-fit: contain;
          border-radius: calc(var(--cb-radius) * .7); animation: cb-gl-in-${base} .25s ease both;
        }
        @keyframes cb-gl-in-${base} { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }
        ${s} .cb-gl__boxCap { font-size: .95em; opacity: .85; text-align: center; }
        ${s} .cb-gl__close, ${s} .cb-gl__nav {
          position: absolute; z-index: 2; display: grid; place-items: center;
          width: 48px; height: 48px; border-radius: 50%; color: #fff;
          background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
          font-size: 26px; line-height: 1; transition: background .2s ease;
        }
        ${s} .cb-gl__close:hover, ${s} .cb-gl__nav:hover { background: rgba(255,255,255,.28); }
        ${s} .cb-gl__close { top: 16px; right: 16px; font-size: 30px; }
        ${s} .cb-gl__nav { top: 50%; translate: 0 -50%; }
        ${s} .cb-gl__navPrev { left: 14px; }
        ${s} .cb-gl__navNext { right: 14px; }
        ${s} .cb-gl__count { position: absolute; bottom: 18px; left: 50%; translate: -50% 0; font-size: .85em; opacity: .7; }
        @media (max-width: 720px) {
          ${s} .cb-gl__grid { ${masonry ? 'columns: 2;' : 'grid-template-columns: repeat(2, minmax(0, 1fr));'} }
          ${s} .cb-gl__boxIn { padding: 60px 12px 70px; }
          ${s} .cb-gl__nav { width: 42px; height: 42px; }
        }
        @media (max-width: 440px) {
          ${s} .cb-gl__grid { ${masonry ? 'columns: 1;' : 'grid-template-columns: 1fr;'} }
        }`;

      var js = !p.lightbox ? '' : c.wrap(c.cls, `
        var data = ${JSON.stringify(data)};
        var box = root.querySelector(".cb-gl__box");
        var img = root.querySelector(".cb-gl__boxImg");
        var cap = root.querySelector(".cb-gl__boxCap");
        var count = root.querySelector(".cb-gl__count");
        var tiles = Array.prototype.slice.call(root.querySelectorAll(".cb-gl__tile"));
        if (!box || !tiles.length) return;

        var i = 0;
        var opener = null;
        var supported = typeof box.showModal === "function";

        function show(n) {
          i = (n + data.length) % data.length;
          var d = data[i];
          img.src = d.src;
          img.alt = d.alt || d.caption || "";
          cap.textContent = d.caption || "";
          cap.style.display = d.caption ? "" : "none";
          count.textContent = (i + 1) + " / " + data.length;
        }

        tiles.forEach(function (t, n) {
          t.addEventListener("click", function () {
            opener = t;
            show(n);
            if (supported) box.showModal();
            else box.setAttribute("open", "");
          });
        });

        function close() {
          if (supported) box.close(); else box.removeAttribute("open");
        }
        root.querySelector(".cb-gl__close").addEventListener("click", close);
        root.querySelector(".cb-gl__navPrev").addEventListener("click", function () { show(i - 1); });
        root.querySelector(".cb-gl__navNext").addEventListener("click", function () { show(i + 1); });

        box.addEventListener("keydown", function (e) {
          if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); }
          else if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
        });
        /* Click the backdrop (i.e. the dialog itself, outside the image) to close. */
        box.addEventListener("click", function (e) { if (e.target === box) close(); });
        /* Return focus to the tile that opened the viewer. */
        box.addEventListener("close", function () { if (opener) opener.focus(); });`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Logo Marquee                                                           */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'logo-marquee',
    name: 'Logo Marquee',
    category: CAT,
    icon: '⇄',
    blurb: 'Seamless infinite logo strip. The duplicate track is hidden from screen readers and the animation stops under reduced-motion.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Kicker', value: 'Trusted by teams at' },

      { t: 'section', label: 'Logos' },
      {
        k: 'items', t: 'list', label: 'Logos', itemLabel: 'name',
        fields: [
          { k: 'name', t: 'text', label: 'Name (used as alt text)', value: 'Company' },
          { k: 'image', t: 'image', label: 'Logo image', value: '', help: 'Leave blank to render the name as a wordmark.' },
          { k: 'linkUrl', t: 'url', label: 'Link', value: '' }
        ],
        value: [
          { name: 'Northwind', image: '', linkUrl: '' },
          { name: 'Meridian', image: '', linkUrl: '' },
          { name: 'Harbour & Co', image: '', linkUrl: '' },
          { name: 'Atlas', image: '', linkUrl: '' },
          { name: 'Fieldnote', image: '', linkUrl: '' },
          { name: 'Kestrel', image: '', linkUrl: '' }
        ]
      },

      { t: 'section', label: 'Motion' },
      { k: 'speed', t: 'range', label: 'Duration (one loop)', min: 10, max: 90, step: 5, unit: 's', value: 34 },
      { k: 'direction', t: 'select', label: 'Direction', value: 'left', options: [['left', 'Right to left'], ['right', 'Left to right']] },
      { k: 'pause', t: 'toggle', label: 'Pause on hover', value: true },

      { t: 'section', label: 'Style' },
      { k: 'height', t: 'range', label: 'Logo height', min: 20, max: 80, step: 2, unit: 'px', value: 34 },
      { k: 'gap', t: 'range', label: 'Gap', min: 20, max: 120, step: 4, unit: 'px', value: 64 },
      { k: 'grayscale', t: 'toggle', label: 'Desaturate until hover', value: true },
      { k: 'fade', t: 'toggle', label: 'Fade edges', value: true },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 120, step: 8, unit: 'px', value: 48 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(function (i) { return i && (i.name || i.image); });

      function one(it) {
        var inner = it.image
          ? '<img src="' + c.url(it.image) + '" alt="' + c.attr(it.name) + '" loading="lazy" decoding="async">'
          : '<span class="cb-mq__word">' + c.esc(it.name) + '</span>';
        return '<li class="cb-mq__item">' +
          (it.linkUrl ? '<a href="' + c.url(it.linkUrl) + '">' + inner + '</a>' : inner) +
          '</li>';
      }

      var list = items.map(one).join('');
      // The clone is what makes the loop seamless; hide it from assistive tech.
      var html = c.dedent(`
        <section class="${c.cls} cb-mq">
          ${p.title ? '<div class="cb-wrap"><p class="cb-mq__kicker">' + c.esc(p.title) + '</p></div>' : ''}
          <div class="cb-mq__viewport">
            <div class="cb-mq__track">
              <ul class="cb-mq__row">${list}</ul>
              <ul class="cb-mq__row" aria-hidden="true">${list}</ul>
            </div>
          </div>
        </section>`);

      var css = `
        ${s}.cb-mq { background: ${p.bg}; padding-block: ${c.num(p.pad, 48)}px; overflow: hidden; }
        ${s} .cb-mq__kicker {
          text-align: center; font-size: .78em; font-weight: 700; letter-spacing: .14em;
          text-transform: uppercase; color: var(--cb-muted); margin-bottom: 28px;
        }
        ${s} .cb-mq__viewport {
          position: relative; overflow: hidden;
          ${p.fade ? '-webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);' : ''}
        }
        ${s} .cb-mq__track {
          display: flex; width: max-content;
          animation: cb-mq-${c.cls} ${c.num(p.speed, 34)}s linear infinite;
          ${p.direction === 'right' ? 'animation-direction: reverse;' : ''}
        }
        ${p.pause ? `${s} .cb-mq__viewport:hover .cb-mq__track { animation-play-state: paused; }` : ''}
        ${s} .cb-mq__row {
          display: flex; align-items: center; gap: ${c.num(p.gap, 64)}px;
          padding-right: ${c.num(p.gap, 64)}px; flex-shrink: 0;
        }
        ${s} .cb-mq__item { display: grid; place-items: center; }
        ${s} .cb-mq__item img {
          height: ${c.num(p.height, 34)}px; width: auto; object-fit: contain;
          ${p.grayscale ? 'filter: grayscale(1); opacity: .62; transition: filter .3s ease, opacity .3s ease;' : ''}
        }
        ${p.grayscale ? `${s} .cb-mq__item:hover img { filter: none; opacity: 1; }` : ''}
        ${s} .cb-mq__word {
          font-size: ${Math.round(c.num(p.height, 34) * 0.62)}px; font-weight: 750;
          letter-spacing: -.02em; white-space: nowrap;
          color: ${p.grayscale ? 'var(--cb-muted)' : 'var(--cb-ink)'};
          transition: color .3s ease;
        }
        ${s} .cb-mq__item:hover .cb-mq__word { color: var(--cb-ink); }
        /* Translating by exactly one row width is what hides the seam. */
        @keyframes cb-mq-${c.cls} { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @media (prefers-reduced-motion: reduce) {
          ${s} .cb-mq__track { animation: none; }
          ${s} .cb-mq__row:last-child { display: none; }
          ${s} .cb-mq__row { flex-wrap: wrap; justify-content: center; row-gap: 24px; width: 100%; padding-right: 0; }
          ${s} .cb-mq__track { width: 100%; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Countdown Timer                                                        */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'countdown',
    name: 'Countdown Timer',
    category: CAT,
    icon: '⏱',
    blurb: 'Counts down to a fixed moment, then swaps in an expired message. Announces politely rather than on every tick.',
    props: [
      { t: 'section', label: 'Content' },
      { k: 'title', t: 'text', label: 'Headline', value: 'Early access closes soon' },
      { k: 'sub', t: 'textarea', label: 'Subheadline', value: '' },
      { k: 'target', t: 'datetime', label: 'Target date & time', value: '' },
      { k: 'expired', t: 'text', label: 'Expired message', value: 'Early access has closed.' },

      { t: 'section', label: 'Call to action' },
      { k: 'btnText', t: 'text', label: 'Button label', value: 'Claim your place' },
      { k: 'btnUrl', t: 'url', label: 'Button link', value: '#' },

      { t: 'section', label: 'Labels' },
      { k: 'lDays', t: 'text', label: 'Days label', value: 'Days' },
      { k: 'lHours', t: 'text', label: 'Hours label', value: 'Hours' },
      { k: 'lMins', t: 'text', label: 'Minutes label', value: 'Minutes' },
      { k: 'lSecs', t: 'text', label: 'Seconds label', value: 'Seconds' },
      { k: 'showSecs', t: 'toggle', label: 'Show seconds', value: true },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Unit style', value: 'boxed', options: [['boxed', 'Boxed'], ['plain', 'Plain'], ['split', 'Split-flap']] },
      { k: 'onDark', t: 'toggle', label: 'Dark background', value: true },
      { k: 'bg', t: 'color', label: 'Background', value: '#0f172a' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 24, max: 160, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      // Default to 7 days out so the block never renders in an expired state.
      var target = String(p.target || '').trim();
      if (!target) {
        var d = new Date(Date.now() + 7 * 864e5);
        target = d.toISOString().slice(0, 16);
      }
      var ink = p.onDark ? '#ffffff' : 'var(--cb-ink)';
      var muted = p.onDark ? 'rgba(255,255,255,.62)' : 'var(--cb-muted)';

      var units = [['d', p.lDays], ['h', p.lHours], ['m', p.lMins]];
      if (p.showSecs) units.push(['s', p.lSecs]);

      var cells = units.map(function (u) {
        return c.dedent(`
          <div class="cb-cd__unit">
            <span class="cb-cd__num" data-unit="${u[0]}">--</span>
            <span class="cb-cd__lab">${c.esc(u[1])}</span>
          </div>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-cd">
          <div class="cb-wrap cb-cd__inner">
            ${p.title ? '<h2 class="cb-cd__title">' + c.rich(p.title) + '</h2>' : ''}
            ${p.sub ? '<p class="cb-cd__sub">' + c.rich(p.sub) + '</p>' : ''}
            <div class="cb-cd__clock" data-target="${c.attr(target)}" role="timer">
        ${c.indent(cells, 6)}
            </div>
            <p class="cb-cd__sr cb-sr" aria-live="polite"></p>
            <p class="cb-cd__expired" hidden>${c.esc(p.expired)}</p>
            ${p.btnText ? '<a class="cb-btn cb-cd__btn" href="' + c.url(p.btnUrl) + '">' + c.esc(p.btnText) + '</a>' : ''}
          </div>
        </section>`);

      var unitCss = {
        boxed: `
          ${s} .cb-cd__unit {
            background: ${p.onDark ? 'rgba(255,255,255,.08)' : 'var(--cb-subtle)'};
            border: 1px solid ${p.onDark ? 'rgba(255,255,255,.14)' : 'var(--cb-border)'};
            border-radius: var(--cb-radius); padding: 18px 10px; min-width: 92px;
          }`,
        plain: `${s} .cb-cd__unit { min-width: 78px; }`,
        split: `
          ${s} .cb-cd__unit { position: relative; background: ${p.onDark ? '#111827' : '#1f2937'}; color: #fff;
            border-radius: calc(var(--cb-radius) * .7); padding: 18px 10px; min-width: 92px;
            box-shadow: inset 0 -1px 0 rgba(255,255,255,.08), 0 8px 20px -12px rgba(0,0,0,.8); }
          ${s} .cb-cd__unit::after {
            content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px;
            background: rgba(0,0,0,.45);
          }
          ${s} .cb-cd__lab { color: rgba(255,255,255,.6); }`
      }[p.variant] || '';

      var css = `
        ${s}.cb-cd { background: ${p.bg}; padding-block: ${c.num(p.pad, 80)}px; color: ${ink}; }
        ${s} .cb-cd__inner { display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; }
        ${s} .cb-cd__title { font-size: clamp(26px, 3.8vw, 40px); font-weight: 800; letter-spacing: -.02em; text-wrap: balance; }
        ${s} .cb-cd__sub { color: ${muted}; max-width: 54ch; }
        ${s} .cb-cd__clock { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
        ${s} .cb-cd__unit { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        ${unitCss}
        ${s} .cb-cd__num {
          font-size: clamp(30px, 5vw, 46px); font-weight: 800; line-height: 1;
          letter-spacing: -.03em; font-variant-numeric: tabular-nums;
        }
        ${s} .cb-cd__lab { font-size: .74em; font-weight: 650; letter-spacing: .1em; text-transform: uppercase; color: ${muted}; }
        ${s} .cb-cd__expired { font-size: 1.15em; font-weight: 650; }
        ${s} .cb-cd__btn {
          margin-top: 10px; background: ${p.onDark ? '#fff' : 'var(--cb-brand)'};
          color: ${p.onDark ? '#0f172a' : 'var(--cb-on-brand)'}; text-decoration: none;
        }`;

      var js = c.wrap(c.cls, `
        var clock = root.querySelector(".cb-cd__clock");
        var expired = root.querySelector(".cb-cd__expired");
        var live = root.querySelector(".cb-cd__sr");
        if (!clock) return;

        var target = new Date(clock.getAttribute("data-target")).getTime();
        if (isNaN(target)) return;

        var cells = {};
        Array.prototype.forEach.call(clock.querySelectorAll("[data-unit]"), function (el) {
          cells[el.getAttribute("data-unit")] = el;
        });

        function pad(n) { return (n < 10 ? "0" : "") + n; }
        var lastAnnounce = 0;

        function tick() {
          var left = target - Date.now();
          if (left <= 0) {
            clearInterval(id);
            clock.hidden = true;
            if (expired) expired.hidden = false;
            if (live) live.textContent = expired ? expired.textContent : "Countdown finished";
            return;
          }
          var total = Math.floor(left / 1000);
          var d = Math.floor(total / 86400);
          var h = Math.floor(total % 86400 / 3600);
          var m = Math.floor(total % 3600 / 60);
          var sec = total % 60;

          if (cells.d) cells.d.textContent = pad(d);
          if (cells.h) cells.h.textContent = pad(h);
          if (cells.m) cells.m.textContent = pad(m);
          if (cells.s) cells.s.textContent = pad(sec);

          /* Announce once a minute — a per-second live region is unusable. */
          if (live && Date.now() - lastAnnounce > 60000) {
            lastAnnounce = Date.now();
            live.textContent = d + " days, " + h + " hours and " + m + " minutes remaining";
          }
        }

        tick();
        var id = setInterval(tick, 1000);`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Video Embed (facade)                                                   */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'video-embed',
    name: 'Video Embed (lite)',
    category: CAT,
    icon: '⏵',
    blurb: 'Click-to-load YouTube/Vimeo facade. Nothing from the video host is requested until someone actually presses play.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Watch the walkthrough' },
      { k: 'sub', t: 'textarea', label: 'Intro copy', value: '' },

      { t: 'section', label: 'Video' },
      { k: 'provider', t: 'select', label: 'Provider', value: 'youtube', options: [['youtube', 'YouTube'], ['vimeo', 'Vimeo']] },
      { k: 'videoId', t: 'text', label: 'Video ID or URL', value: 'aqz-KE-bpKQ', help: 'Paste the full watch/share URL and the ID is extracted automatically.' },
      { k: 'poster', t: 'image', label: 'Custom poster', value: '', help: 'Leave blank on YouTube to use the auto thumbnail.' },
      { k: 'label', t: 'text', label: 'Accessible video title', value: 'Product walkthrough' },
      { k: 'ratio', t: 'select', label: 'Aspect ratio', value: '16/9', options: [['16/9', '16 : 9'], ['4/3', '4 : 3'], ['21/9', 'Ultrawide'], ['1/1', 'Square'], ['9/16', 'Vertical']] },

      { t: 'section', label: 'Style' },
      { k: 'maxWidth', t: 'range', label: 'Max width', min: 480, max: 1400, step: 20, unit: 'px', value: 900 },
      { k: 'playStyle', t: 'select', label: 'Play button', value: 'brand', options: [['brand', 'Brand pill'], ['youtube', 'YouTube red'], ['glass', 'Glass circle']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 72 }
    ],

    render: function (p, c) {
      var s = c.s;

      // Accept a bare ID or any of the usual share URLs.
      var raw = String(p.videoId || '').trim();
      var id = raw;
      var m;
      if (p.provider === 'youtube') {
        m = raw.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
        if (m) id = m[1];
      } else {
        m = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (m) id = m[1];
      }
      id = id.replace(/[^A-Za-z0-9_-]/g, '');

      var poster = p.poster || (p.provider === 'youtube' && id
        ? 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg'
        : CB.ph(1280, 720, '', '#1e293b', '#4f46e5'));

      var src = p.provider === 'youtube'
        ? 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0'
        : 'https://player.vimeo.com/video/' + id + '?autoplay=1';

      var html = c.dedent(`
        <section class="${c.cls} cb-ve">
          <div class="cb-wrap">
            ${(p.title || p.sub) ? `<header class="cb-ve__head">
              ${p.title ? '<h2 class="cb-ve__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-ve__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <div class="cb-ve__frame" data-src="${c.attr(src)}" data-label="${c.attr(p.label)}">
              <img class="cb-ve__poster" src="${c.url(poster)}" alt="" loading="lazy" decoding="async">
              <button type="button" class="cb-ve__play">
                <span class="cb-ve__tri" aria-hidden="true"></span>
                <span class="cb-ve__playText">Play</span>
                <span class="cb-sr">${c.esc(p.label)}</span>
              </button>
            </div>
          </div>
        </section>`);

      var playCss = {
        brand: `background: var(--cb-brand); color: var(--cb-on-brand); padding: 14px 26px 14px 22px; border-radius: 999px;`,
        youtube: `background: #ff0000; color: #fff; width: 82px; height: 58px; border-radius: 14px;`,
        glass: `background: rgba(255,255,255,.2); color: #fff; border: 1px solid rgba(255,255,255,.4); backdrop-filter: blur(8px); width: 84px; height: 84px; border-radius: 50%;`
      }[p.playStyle] || '';

      var css = `
        ${s}.cb-ve { background: ${p.bg}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-ve__head { text-align: center; max-width: 620px; margin: 0 auto 28px; }
        ${s} .cb-ve__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; }
        ${s} .cb-ve__sub { color: var(--cb-muted); margin-top: 10px; }
        ${s} .cb-ve__frame {
          position: relative; overflow: hidden; background: #000;
          aspect-ratio: ${p.ratio}; border-radius: var(--cb-radius);
          max-width: ${c.num(p.maxWidth, 900)}px; margin-inline: auto;
          box-shadow: 0 30px 70px -40px rgba(15,23,42,.7);
        }
        ${s} .cb-ve__poster { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease, opacity .3s ease; }
        ${s} .cb-ve__frame:hover .cb-ve__poster { transform: scale(1.03); opacity: .82; }
        ${s} .cb-ve__frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        ${s} .cb-ve__play {
          position: absolute; top: 50%; left: 50%; translate: -50% -50%;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          font-weight: 700; ${playCss}
          transition: transform .22s ease, box-shadow .22s ease;
          box-shadow: 0 12px 30px -12px rgba(0,0,0,.7);
        }
        ${s} .cb-ve__frame:hover .cb-ve__play { transform: translate(-50%, -50%) scale(1.07); }
        ${s} .cb-ve__tri {
          width: 0; height: 0; border-style: solid;
          border-width: 9px 0 9px 15px; border-color: transparent transparent transparent currentColor;
        }
        ${s} .cb-ve__playText { ${p.playStyle === 'brand' ? '' : 'display: none;'} }`;

      var js = c.wrap(c.cls, `
        var frame = root.querySelector(".cb-ve__frame");
        var btn = root.querySelector(".cb-ve__play");
        if (!frame || !btn) return;

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
        btn.addEventListener("click", load);

        /* Warm the connection on intent so playback starts sooner. */
        var warmed = false;
        frame.addEventListener("pointerenter", function () {
          if (warmed) return;
          warmed = true;
          var host = frame.getAttribute("data-src").indexOf("vimeo") > -1
            ? "https://player.vimeo.com" : "https://www.youtube-nocookie.com";
          [host, "https://i.ytimg.com"].forEach(function (h) {
            var l = document.createElement("link");
            l.rel = "preconnect"; l.href = h; l.crossOrigin = "";
            document.head.appendChild(l);
          });
        });`);

      return { html: html, css: css, js: js };
    }
  });
})();
