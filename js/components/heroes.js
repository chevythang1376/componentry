/* ============================================================================
   Heroes & Banners
   ========================================================================== */
(function () {
  'use strict';

  var CAT = 'Heroes & Banners';

  /* --------------------------------------------------------------------- */
  /* Parallax Banner                                                        */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'parallax-banner',
    name: 'Parallax Banner',
    category: CAT,
    icon: '⛰',
    blurb: 'Full-bleed scroll parallax with overlay, headline and CTAs. Uses transform (not background-attachment) so it works on iOS.',
    props: [
      { t: 'section', label: 'Content' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'New for 2026' },
      { k: 'title', t: 'textarea', label: 'Headline', value: 'Build once.\nShip everywhere.', help: 'Line breaks are kept. **bold** and *italic* work too.' },
      { k: 'sub', t: 'textarea', label: 'Subheadline', value: 'A component system that keeps its shape no matter which page builder it lands in.' },
      { k: 'btnText', t: 'text', label: 'Primary button', value: 'Get started' },
      { k: 'btnUrl', t: 'url', label: 'Primary link', value: '#' },
      { k: 'btn2Text', t: 'text', label: 'Secondary button', value: 'See how it works' },
      { k: 'btn2Url', t: 'url', label: 'Secondary link', value: '#' },

      { t: 'section', label: 'Media' },
      { k: 'image', t: 'image', label: 'Background image', value: CB.ph(1600, 900, '', '#2b241f', '#2b241f') },
      { k: 'height', t: 'range', label: 'Height', min: 280, max: 900, step: 10, unit: 'px', value: 580 },
      { k: 'focal', t: 'select', label: 'Image focus', value: 'center', options: [['center', 'Center'], ['top', 'Top'], ['bottom', 'Bottom']] },

      { t: 'section', label: 'Scroll effect' },
      {
        k: 'motion', t: 'select', label: 'Photo movement', value: 'depth',
        options: [['depth', 'Slower than the page'], ['fixed', 'Fixed — the page slides over it'], ['none', 'None — scrolls with the page']],
        help: 'Slower than the page is the classic parallax: the photo seems to sit behind the page.'
      },
      {
        k: 'depth', t: 'range', label: 'Depth', min: 10, max: 90, step: 5, unit: '%', value: 40,
        when: { motion: ['depth'] },
        help: 'How much slower the photo moves than the page. More depth shows less of the photo at once, ' +
              'because a taller copy of it has to fill the banner while it slides.'
      },
      {
        k: 'zoom', t: 'select', label: 'Zoom', value: 'none',
        options: [['none', 'None'], ['in', 'Zoom in as you scroll'], ['out', 'Zoom out as you scroll']]
      },
      { k: 'zoomAmount', t: 'range', label: 'Zoom amount', min: 5, max: 40, step: 5, unit: '%', value: 15, when: { zoom: ['in', 'out'] } },
      {
        k: 'contentFx', t: 'select', label: 'Headline and buttons', value: 'still',
        options: [['still', 'Scroll with the page'], ['fade', 'Fade out as the banner leaves'], ['sink', 'Fade and fall behind as it leaves']],
        help: 'Only while the banner scrolls off the top. Nothing fades in, so the words are never waiting on the effect to be readable.'
      },
      {
        k: 'mobileParallax', t: 'toggle', label: 'Scroll effects on phones', value: false,
        help: 'Off by default: on a phone the photo simply fills the banner. Turn on to run the effects at every width.'
      },

      { t: 'section', label: 'Overlay' },
      { k: 'overlay', t: 'color', label: 'Overlay colour', value: '#12100e' },
      { k: 'overlayOpacity', t: 'range', label: 'Overlay opacity', min: 0, max: 90, step: 5, unit: '%', value: 45 },
      { k: 'gradient', t: 'toggle', label: 'Extra fade at bottom', value: true },

      { t: 'section', label: 'Layout' },
      { k: 'align', t: 'select', label: 'Alignment', value: 'center', options: [['left', 'Left'], ['center', 'Center'], ['right', 'Right']] },
      { k: 'textColor', t: 'color', label: 'Text colour', value: '#ffffff' },
      { k: 'titleSize', t: 'range', label: 'Headline size', min: 28, max: 88, step: 2, unit: 'px', value: 60 },
      { k: 'cue', t: 'toggle', label: 'Scroll cue', value: true }
    ],

    render: function (p, c) {
      var s = c.s;
      var flex = p.align === 'left' ? 'flex-start' : p.align === 'right' ? 'flex-end' : 'center';

      /* The photo's lag behind the page, as a fraction of the scroll: 0 moves
         with the page, 1 stands still on screen while the page slides over it. */
      var motion = p.motion === 'fixed' || p.motion === 'none' ? p.motion : 'depth';
      var k = motion === 'fixed' ? 1 : motion === 'none' ? 0 : c.clamp(c.num(p.depth, 40), 10, 90) / 100;
      var zoom = p.zoom === 'in' || p.zoom === 'out' ? p.zoom : 'none';
      var zf = zoom === 'none' ? 0 : c.clamp(c.num(p.zoomAmount, 15), 5, 40) / 100;
      var fx = p.contentFx === 'fade' || p.contentFx === 'sink' ? p.contentFx : 'still';
      var tl = '--cb-px-' + c.cls;
      function n(x) { return String(+x.toFixed(4)); }
      /* Phones are left out unless asked for: the whole effect, not only the drift. */
      var when = '(prefers-reduced-motion: no-preference)' + (p.mobileParallax ? '' : ' and (min-width: 641px)');

      var html = c.dedent(`
        <section class="${c.cls} cb-px" aria-label="${c.attr((p.title || '').split('\n')[0])}">
          <div class="cb-px__bg" role="presentation" data-cb-scroll-tied>
            <div class="cb-px__shift"><img src="${c.url(p.image)}" alt="" loading="eager" decoding="async"></div>
          </div>
          <div class="cb-px__veil" role="presentation"></div>
          <div class="cb-px__inner cb-wrap">
            <div class="cb-px__content">
              ${p.eyebrow ? '<p class="cb-px__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-px__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-px__sub">' + c.rich(p.sub) + '</p>' : ''}
              ${(p.btnText || p.btn2Text) ? `<div class="cb-px__actions">
                ${p.btnText ? '<a class="cb-btn cb-btn--primary" href="' + c.url(p.btnUrl) + '">' + c.esc(p.btnText) + '</a>' : ''}
                ${p.btn2Text ? '<a class="cb-btn cb-btn--ghost" href="' + c.url(p.btn2Url) + '">' + c.esc(p.btn2Text) + '</a>' : ''}
              </div>` : ''}
            </div>
          </div>
          ${p.cue ? '<div class="cb-px__cue" aria-hidden="true"><span></span></div>' : ''}
        </section>`);

      var css = `
        /* contain: paint is the part that protects the host page. The moving
           image layer is taller than the banner — that over-scan is what it
           slides through — and a GPU layer whose bounds reach past the block
           can make the browser promote everything painted after it onto
           layers of its own. Text on those loses subpixel smoothing and, on
           Windows especially, reads as heavier: the page below the banner
           looked bold. Paint containment tells the compositor nothing here
           escapes this box. It is visually identical to the overflow: hidden
           beside it, which already clipped the same pixels. */
        ${s}.cb-px {
          position: relative; display: flex; align-items: center;
          min-height: ${c.num(p.height, 580)}px;
          overflow: hidden; isolation: isolate; contain: paint;
          color: ${p.textColor};
        }
        /* At rest the photo exactly fills the banner. It only grows taller, and
           so crops more, where the scroll effect is actually running. */
        ${s} .cb-px__bg { position: absolute; inset: 0; z-index: 0; }
        ${s} .cb-px__shift { position: absolute; left: 0; right: 0; top: 0; height: 100%; }
        ${s} .cb-px__shift img { width: 100%; height: 100%; object-fit: cover; object-position: ${p.focal}; }
        ${s} .cb-px__veil {
          position: absolute; inset: 0; z-index: 1;
          background: ${c.rgba(p.overlay, c.num(p.overlayOpacity, 45) / 100)};
          ${p.gradient ? 'background-image: linear-gradient(to bottom, transparent 35%, ' + c.rgba(p.overlay, Math.min(0.92, c.num(p.overlayOpacity, 45) / 100 + 0.4)) + ' 100%);' : ''}
        }
        ${s} .cb-px__inner { position: relative; z-index: 2; width: 100%; padding-block: 64px; }
        ${s} .cb-px__content {
          display: flex; flex-direction: column; gap: 20px;
          align-items: ${flex}; text-align: ${p.align};
          max-width: ${p.align === 'center' ? '760px' : '620px'};
          margin-inline: ${p.align === 'center' ? 'auto' : p.align === 'right' ? 'auto 0' : '0 auto'};
        }
        ${s} .cb-px__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.14em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          opacity: .85; margin: 0;
        }
        ${s} .cb-px__title {
          font-size: calc(clamp(32px, 6vw, ${c.num(p.titleSize, 60)}px) * var(--cb-h-scale, 1));
          line-height: calc(1.08 + var(--cb-h-leading, 0)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.03em + var(--cb-h-track, 0em)); text-wrap: balance;
        }
        ${s} .cb-px__sub { font-size: calc(clamp(16px, 2.2vw, 19px) * var(--cb-body-scale, 1)); opacity: .9; max-width: 56ch; }
        ${s} .cb-px__actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: ${flex}; margin-top: 8px; }
        ${c.pin([
          s + ' .cb-px__eyebrow', s + ' .cb-px__title', s + ' .cb-px__sub',
          s + ' .cb-btn--ghost'
        ], p.textColor)}
        ${s} .cb-px__cue {
          position: absolute; z-index: 2; bottom: 22px; left: 50%; translate: -50% 0;
          width: 26px; height: 42px; border: 2px solid currentColor; border-radius: 14px; opacity: .55;
        }
        ${s} .cb-px__cue span {
          position: absolute; left: 50%; top: 8px; translate: -50% 0;
          width: 4px; height: 8px; border-radius: 2px; background: currentColor;
          animation: cb-px-cue-${c.cls} 1.8s ease-in-out infinite;
        }
        @keyframes cb-px-cue-${c.cls} {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(12px); opacity: .2; }
        }
        @media (max-width: 640px) {
          ${s} .cb-px__content { align-items: flex-start; text-align: left; margin-inline: 0; }
          ${s} .cb-px__actions { justify-content: flex-start; }
          ${s} .cb-btn { width: 100%; }
        }`;

      /* The drift. Offsetting the photo by k times the banner's distance from
         the top of the window moves it at (1 - k) of the page's speed, and it
         then has to be (1 - k) of the banner tall plus k of the window to never
         show an edge. That offset runs from -k windows, as the banner enters at
         the bottom, to +k banners as it leaves at the top — and one transform
         cannot say both lengths, since a percentage in it is the element's own
         size. So it is split: the outer layer is the banner's size and moves
         0 to k of itself, the inner one moves -k windows to 0, and the sum is
         the line above.

         lvh rather than vh because a phone's window is never taller than its
         large viewport, and erring tall only ever overfills.

         It used to be a script that moved the photo faster than the page,
         which read as the photo sliding in front of the words, and a frame
         behind the scroll. Where scroll timelines exist the whole effect is
         now the stylesheet, in step with the scroll.

         An attached animation keeps its compositor layer for the life of the
         page, scrolled away or not, and a lingering layer is how this banner
         once made the text below it look bold. So the script detaches the
         effect once the banner is well off screen (data-cb-idle) and puts it
         back before it returns. Where scripts are stripped it simply stays
         attached, contained like the marquee's. */
      if (k || zf || fx !== 'still') {
        css += `
        @supports (animation-timeline: view()) {
          @media ${when} {
            ${s}.cb-px { view-timeline: ${tl} block; }${k ? `
            ${s} .cb-px__bg {
              animation: cb-px-a-${c.cls} linear;
              animation-timeline: ${tl}; animation-range: cover 0% cover 100%;
            }
            ${s} .cb-px__shift {
              height: calc(${n(1 - k)} * 100% + ${n(k)} * 100lvh);
              animation: cb-px-b-${c.cls} linear;
              animation-timeline: ${tl}; animation-range: cover 0% cover 100%;
            }` : ''}${zf ? `
            ${s} .cb-px__shift img {
              animation: cb-px-z-${c.cls} linear;
              animation-timeline: ${tl}; animation-range: cover 0% cover 100%;
            }` : ''}${fx !== 'still' ? `
            ${s} .cb-px__content {
              animation: cb-px-c-${c.cls} linear;
              animation-timeline: ${tl}; animation-range: exit 0% exit 100%;
            }` : ''}
            ${s}.cb-px[data-cb-idle] .cb-px__bg, ${s}.cb-px[data-cb-idle] .cb-px__shift,
            ${s}.cb-px[data-cb-idle] .cb-px__shift img, ${s}.cb-px[data-cb-idle] .cb-px__content { animation: none; }
          }
        }
        @keyframes cb-px-a-${c.cls} { from { transform: translateY(0); } to { transform: translateY(${n(k * 100)}%); } }
        @keyframes cb-px-b-${c.cls} { from { transform: translateY(calc(${n(-k)} * 100lvh)); } to { transform: translateY(0); } }
        @keyframes cb-px-z-${c.cls} { from { transform: scale(${zoom === 'in' ? 1 : n(1 + zf)}); } to { transform: scale(${zoom === 'in' ? n(1 + zf) : 1}); } }
        @keyframes cb-px-c-${c.cls} {
          0% { opacity: 1;${fx === 'sink' ? ' transform: translateY(0);' : ''} }
          70% { opacity: 0; }
          100% { opacity: 0;${fx === 'sink' ? ' transform: translateY(50%);' : ''} }
        }`;
      }

      var js = !(k || zf || fx !== 'still') ? '' : c.wrap(c.cls, `
        /* Where scroll timelines exist the stylesheet runs the effect, and all
           this does is detach it while the banner is well off screen, so no
           layer is held beside the page somebody is reading. */
        if (window.CSS && CSS.supports && CSS.supports("animation-timeline: view()")) {
          if (!("IntersectionObserver" in window)) return;
          new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) root.removeAttribute("data-cb-idle");
              else root.setAttribute("data-cb-idle", "");
            });
          }, { rootMargin: "50% 0px" }).observe(root);
          return;
        }

        /* Everything below is for browsers without them. */
        var shift = root.querySelector(".cb-px__shift");
        var img = shift && shift.querySelector("img");
        var content = root.querySelector(".cb-px__content");
        if (!shift) return;
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        /* Scroll-linked movement is battery-hungry on phones, so it is opt-in
           there. Re-checked on resize rather than read once. */
        var mobileOn = ${p.mobileParallax ? 'true' : 'false'};
        var small = window.matchMedia ? window.matchMedia("(max-width: 640px)") : null;
        function enabled() { return mobileOn || !small || !small.matches; }

        var k = ${n(k)}, zoomIn = ${zoom === 'in' ? 'true' : 'false'}, zf = ${n(zf)}, fx = "${fx}";
        var queued = false;

        function clear() {
          shift.style.height = shift.style.transform = shift.style.willChange = "";
          if (img) img.style.transform = "";
          if (content) content.style.opacity = content.style.transform = "";
        }

        /* The same geometry as the stylesheet, worked out from where the
           banner is rather than from a timeline. */
        function paint() {
          queued = false;
          if (!enabled()) { clear(); return; }
          var r = root.getBoundingClientRect();
          var vh = window.innerHeight || document.documentElement.clientHeight;
          if (r.bottom < -80 || r.top > vh + 80) { shift.style.willChange = ""; return; }
          shift.style.willChange = "transform";
          var top = Math.max(-r.height, Math.min(vh, r.top));
          var t = (vh - top) / (vh + r.height);          /* 0 entering at the bottom, 1 gone off the top */
          shift.style.height = "calc(" + (1 - k) + " * 100% + " + k + " * 100vh)";
          /* 2D, not translate3d: the 3D form was the old trick for forcing a GPU
             layer, and a forced layer is the thing this block should not leave
             lying around. The compositor still moves a 2D transform smoothly. */
          shift.style.transform = "translateY(" + (-k * top).toFixed(2) + "px)";
          if (img && zf) img.style.transform = "scale(" + (1 + zf * (zoomIn ? t : 1 - t)).toFixed(4) + ")";
          if (content && fx !== "still") {
            var from = Math.min(0, vh - r.height);       /* where it starts to leave */
            var e = Math.max(0, Math.min(1, (from - r.top) / (from + r.height)));
            content.style.opacity = String(Math.max(0, 1 - e / 0.7));
            if (fx === "sink") content.style.transform = "translateY(" + (e * 50).toFixed(2) + "%)";
          }
        }
        function onScroll() {
          if (queued) return;
          queued = true;
          window.requestAnimationFrame(paint);
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        paint();`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Video Hero                                                             */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'video-hero',
    name: 'Video Hero',
    category: CAT,
    icon: '▶',
    blurb: 'Muted looping background video with a poster fallback and a WCAG-required pause control.',
    props: [
      { t: 'section', label: 'Content' },
      { k: 'title', t: 'textarea', label: 'Headline', value: 'Motion tells the story', help: 'Line breaks are kept. **bold** and *italic* work too.' },
      { k: 'sub', t: 'textarea', label: 'Subheadline', value: 'Background video that stays out of the way of your copy — and never blocks first paint.' },
      { k: 'btnText', t: 'text', label: 'Button label', value: 'Watch the film' },
      { k: 'btnUrl', t: 'url', label: 'Button link', value: '#' },

      { t: 'section', label: 'Video' },
      { k: 'src', t: 'url', label: 'MP4 URL', value: '', help: 'Self-hosted .mp4 or .webm. Leave blank to show the poster only.' },
      { k: 'poster', t: 'image', label: 'Poster image', value: CB.ph(1600, 900, '', '#141210', '#6f4c37') },
      { k: 'height', t: 'range', label: 'Height', min: 320, max: 900, step: 10, unit: 'px', value: 620 },
      { k: 'control', t: 'toggle', label: 'Show pause control', value: true, help: 'WCAG 2.2.2 — any motion over 5s needs a pause affordance.' },

      { t: 'section', label: 'Overlay' },
      { k: 'overlay', t: 'color', label: 'Overlay colour', value: '#141210' },
      { k: 'overlayOpacity', t: 'range', label: 'Overlay opacity', min: 0, max: 90, step: 5, unit: '%', value: 50 },

      { t: 'section', label: 'Layout' },
      { k: 'align', t: 'select', label: 'Alignment', value: 'center', options: [['left', 'Left'], ['center', 'Center']] },
      { k: 'textColor', t: 'color', label: 'Text colour', value: '#ffffff' }
    ],

    render: function (p, c) {
      var s = c.s;
      var flex = p.align === 'left' ? 'flex-start' : 'center';
      var hasVideo = !!(p.src || '').trim();

      var html = c.dedent(`
        <section class="${c.cls} cb-vh" aria-label="${c.attr(p.title)}">
          <div class="cb-vh__media" role="presentation">
            ${hasVideo ? `<video class="cb-vh__video" autoplay muted loop playsinline preload="metadata" poster="${c.url(p.poster)}">
              <source src="${c.url(p.src)}">
            </video>` : `<img src="${c.url(p.poster)}" alt="" decoding="async">`}
          </div>
          <div class="cb-vh__veil" role="presentation"></div>
          <div class="cb-vh__inner cb-wrap">
            <div class="cb-vh__content">
              ${p.title ? '<h2 class="cb-vh__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-vh__sub">' + c.rich(p.sub) + '</p>' : ''}
              ${p.btnText ? '<div><a class="cb-btn cb-btn--primary" href="' + c.url(p.btnUrl) + '">' + c.esc(p.btnText) + '</a></div>' : ''}
            </div>
          </div>
          ${(hasVideo && p.control) ? '<button type="button" class="cb-vh__toggle" aria-label="Pause background video"><span class="cb-vh__icon" aria-hidden="true"></span></button>' : ''}
        </section>`);

      var css = `
        ${s}.cb-vh {
          position: relative; display: flex; align-items: center;
          min-height: ${c.num(p.height, 620)}px; overflow: hidden; isolation: isolate;
          color: ${p.textColor}; background: #000;
        }
        ${s} .cb-vh__media { position: absolute; inset: 0; z-index: 0; }
        ${s} .cb-vh__media video, ${s} .cb-vh__media img { width: 100%; height: 100%; object-fit: cover; }
        ${s} .cb-vh__veil { position: absolute; inset: 0; z-index: 1; background: ${c.rgba(p.overlay, c.num(p.overlayOpacity, 50) / 100)}; }
        ${s} .cb-vh__inner { position: relative; z-index: 2; width: 100%; padding-block: 72px; }
        ${s} .cb-vh__content {
          display: flex; flex-direction: column; gap: 20px; align-items: ${flex};
          text-align: ${p.align}; max-width: 720px;
          margin-inline: ${p.align === 'center' ? 'auto' : '0'};
        }
        ${s} .cb-vh__title { font-size: calc(clamp(32px, 6vw, 60px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1.08 + var(--cb-h-leading, 0)); letter-spacing: calc(-.03em + var(--cb-h-track, 0em)); text-wrap: balance; }
        ${s} .cb-vh__sub { font-size: calc(clamp(16px, 2.2vw, 19px) * var(--cb-body-scale, 1)); opacity: .9; max-width: 54ch; }
        ${c.pin([s + ' .cb-vh__title', s + ' .cb-vh__sub'], p.textColor)}
        ${s} .cb-vh__toggle {
          position: absolute; z-index: 3; right: 20px; bottom: 20px;
          width: 44px; height: 44px; border-radius: 50%;
          display: grid; place-items: center;
          background: rgba(0,0,0,.45); color: var(--cb-on-dark, #fff);
          border: 1px solid rgba(255,255,255,.35);
          backdrop-filter: blur(6px); transition: background .2s ease;
        }
        ${s} .cb-vh__toggle:hover { background: rgba(0,0,0,.7); }
        ${s} .cb-vh__icon {
          width: 12px; height: 14px; background: currentColor;
          clip-path: polygon(0 0, 35% 0, 35% 100%, 0 100%, 0 0, 65% 0, 100% 0, 100% 100%, 65% 100%, 65% 0);
        }
        ${s} .cb-vh__toggle[data-paused="1"] .cb-vh__icon {
          clip-path: polygon(0 0, 100% 50%, 0 100%);
          width: 13px;
        }`;

      var js = !hasVideo ? '' : c.wrap(c.cls, `
        var video = root.querySelector(".cb-vh__video");
        var toggle = root.querySelector(".cb-vh__toggle");
        if (!video) return;

        var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) { video.removeAttribute("autoplay"); video.pause(); }

        function sync() {
          if (!toggle) return;
          var paused = video.paused;
          toggle.setAttribute("data-paused", paused ? "1" : "0");
          toggle.setAttribute("aria-label", (paused ? "Play" : "Pause") + " background video");
        }
        if (toggle) {
          toggle.addEventListener("click", function () {
            if (video.paused) { video.play(); } else { video.pause(); }
          });
          video.addEventListener("play", sync);
          video.addEventListener("pause", sync);
          sync();
        }

        /* Don't burn battery on a hero that has scrolled away. */
        if ("IntersectionObserver" in window) {
          var manual = false;
          if (toggle) toggle.addEventListener("click", function () { manual = true; });
          new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (manual || reduced) return;
              if (e.isIntersecting) { video.play().catch(function () {}); } else { video.pause(); }
            });
          }, { threshold: 0.15 }).observe(root);
        }`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Split Hero                                                             */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'split-hero',
    name: 'Split Hero',
    category: CAT,
    icon: '◧',
    blurb: 'Copy on one side, image on the other. Stacks cleanly on mobile.',
    props: [
      { t: 'section', label: 'Content' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'Component library' },
      { k: 'title', t: 'textarea', label: 'Headline', value: 'Everything you need, nothing you don’t', help: 'Line breaks are kept. **bold** and *italic* work too.' },
      { k: 'sub', t: 'textarea', label: 'Body copy', value: 'Each block is self-contained, accessible by default, and scoped so it can’t collide with your theme.' },
      { k: 'bullets', t: 'textarea', label: 'Bullet points', value: 'Keyboard and screen-reader ready\nScoped CSS, zero globals\nNo build step, no dependencies', help: 'One per line. Leave blank to hide.' },
      { k: 'btnText', t: 'text', label: 'Primary button', value: 'Start building' },
      { k: 'btnUrl', t: 'url', label: 'Primary link', value: '#' },
      { k: 'btn2Text', t: 'text', label: 'Secondary button', value: '' },
      { k: 'btn2Url', t: 'url', label: 'Secondary link', value: '#' },

      { t: 'section', label: 'Media' },
      { k: 'image', t: 'image', label: 'Image', value: CB.ph(900, 800, '', '#96694c', '#3a332d') },
      { k: 'alt', t: 'text', label: 'Image alt text', value: '' },
      { k: 'side', t: 'select', label: 'Image side', value: 'right', options: [['right', 'Right'], ['left', 'Left']] },
      { k: 'ratio', t: 'select', label: 'Image ratio', value: '4/3', options: [['4/3', '4 : 3'], ['1/1', 'Square'], ['3/4', 'Portrait'], ['16/9', '16 : 9'], ['auto', 'Natural']] },

      { t: 'section', label: 'Style' },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 24, max: 160, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var bullets = String(p.bullets || '').split('\n').map(function (b) { return b.trim(); }).filter(Boolean);

      var html = c.dedent(`
        <section class="${c.cls} cb-sh">
          <div class="cb-wrap cb-sh__grid">
            <div class="cb-sh__copy">
              ${p.eyebrow ? '<p class="cb-sh__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-sh__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-sh__sub">' + c.rich(p.sub) + '</p>' : ''}
              ${bullets.length ? '<ul class="cb-sh__list">' + bullets.map(function (b) {
                return '<li><span class="cb-sh__tick" aria-hidden="true"></span>' + c.esc(b) + '</li>';
              }).join('') + '</ul>' : ''}
              ${(p.btnText || p.btn2Text) ? `<div class="cb-sh__actions">
                ${p.btnText ? '<a class="cb-btn cb-btn--primary" href="' + c.url(p.btnUrl) + '">' + c.esc(p.btnText) + '</a>' : ''}
                ${p.btn2Text ? '<a class="cb-btn cb-btn--ghost" href="' + c.url(p.btn2Url) + '">' + c.esc(p.btn2Text) + '</a>' : ''}
              </div>` : ''}
            </div>
            <div class="cb-sh__media">
              <img src="${c.url(p.image)}" alt="${c.attr(p.alt)}" loading="lazy" decoding="async">
            </div>
          </div>
        </section>`);

      var css = `
        ${s}.cb-sh { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-sh__grid {
          display: grid; gap: clamp(28px, 5vw, 64px); align-items: center;
          grid-template-columns: 1fr 1fr;
        }
        ${s} .cb-sh__copy { display: flex; flex-direction: column; gap: 18px; order: ${p.side === 'left' ? 2 : 1}; }
        ${s} .cb-sh__media { order: ${p.side === 'left' ? 1 : 2}; }
        ${s} .cb-sh__media img {
          width: 100%; border-radius: var(--cb-radius);
          ${p.ratio !== 'auto' ? 'aspect-ratio: ' + p.ratio + '; object-fit: cover;' : ''}
          box-shadow: 0 24px 60px -28px rgba(20,18,16,.45);
        }
        ${s} .cb-sh__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.14em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand-ink, var(--cb-brand));
        }
        ${s} .cb-sh__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); text-wrap: balance; }
        ${s} .cb-sh__sub { color: var(--cb-muted); font-size: calc(clamp(16px, 2.2vw, 19px) * var(--cb-body-scale, 1)); max-width: 52ch; }
        ${s} .cb-sh__list { display: flex; flex-direction: column; gap: 12px; }
        ${s} .cb-sh__list li { display: flex; align-items: flex-start; gap: 12px; color: var(--cb-ink); }
        ${s} .cb-sh__tick {
          flex: 0 0 22px; width: 22px; height: 22px; margin-top: 2px; border-radius: 50%;
          background: color-mix(in srgb, var(--cb-brand) 16%, transparent);
          position: relative;
        }
        ${s} .cb-sh__tick::after {
          content: ""; position: absolute; left: 7px; top: 5px;
          width: 5px; height: 10px; border: solid var(--cb-brand);
          border-width: 0 2px 2px 0; rotate: 45deg;
        }
        ${s} .cb-sh__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; }
        @media (max-width: 860px) {
          ${s} .cb-sh__grid { grid-template-columns: 1fr; }
          ${s} .cb-sh__copy { order: 1; }
          ${s} .cb-sh__media { order: 2; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Hero Slider                                                            */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'hero-slider',
    name: 'Hero Slider',
    category: CAT,
    icon: '⧉',
    blurb: 'Multiple banners that rotate, with styleable arrows and dots and swipe on touch screens. Dots work with no JavaScript; autoplay and arrows are added by script, and autoplay never ships without a pause control.',
    props: [
      { t: 'section', label: 'Slides' },
      {
        k: 'items', t: 'list', label: 'Banners', itemLabel: 'title',
        fields: [
          { k: 'image', t: 'image', label: 'Background image', value: CB.ph(1600, 900, '', '#96694c', '#2b241f') },
          { k: 'alt', t: 'text', label: 'Image alt text', value: '', help: 'Leave blank if the image is decorative and the headline carries the meaning.' },
          { k: 'focal', t: 'select', label: 'Image focus', value: 'center', options: [['center', 'Center'], ['top', 'Top'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right']] },
          { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: '' },
          { k: 'title', t: 'textarea', label: 'Headline', value: 'Headline goes here' },
          { k: 'sub', t: 'textarea', label: 'Subheadline', value: '' },
          { k: 'btnText', t: 'text', label: 'Primary button', value: '' },
          { k: 'btnUrl', t: 'url', label: 'Primary link', value: '#' },
          { k: 'btn2Text', t: 'text', label: 'Secondary button', value: '' },
          { k: 'btn2Url', t: 'url', label: 'Secondary link', value: '#' },
          { k: 'overlay', t: 'range', label: 'Overlay opacity', min: 0, max: 90, step: 5, unit: '%', value: 45 }
        ],
        value: [
          { image: CB.ph(1600, 900, '', '#96694c', '#2b241f'), alt: '', focal: 'center', eyebrow: 'Data centers', title: 'Power that keeps pace with demand', sub: 'Medium voltage through to the rack, from one supplier.', btnText: 'Explore solutions', btnUrl: '#', btn2Text: '', btn2Url: '#', overlay: 45 },
          { image: CB.ph(1600, 900, '', '#6f4c37', '#141210'), alt: '', focal: 'center', eyebrow: 'Utility', title: 'Built for the grid,\nbuilt to last', sub: 'Overhead and underground conductor engineered for the long haul.', btnText: 'View products', btnUrl: '#', btn2Text: 'Talk to us', btn2Url: '#', overlay: 50 },
          { image: CB.ph(1600, 900, '', '#3a332d', '#12100e'), alt: '', focal: 'center', eyebrow: 'Industrial', title: 'On site when it matters', sub: 'Field services and support that shorten the critical path.', btnText: 'Find support', btnUrl: '#', btn2Text: '', btn2Url: '#', overlay: 42 }
        ]
      },

      { t: 'section', label: 'Rotation' },
      { k: 'autoplay', t: 'toggle', label: 'Rotate automatically', value: true, help: 'Only runs where scripts do — and it always ships with a pause control, which WCAG 2.2.2 requires.' },
      { k: 'interval', t: 'range', label: 'Seconds per slide', min: 3, max: 15, step: 1, unit: 's', value: 6, when: { autoplay: [true] } },
      { k: 'loop', t: 'toggle', label: 'Wrap around at the ends', value: true },
      { k: 'transition', t: 'select', label: 'Transition', value: 'fade', options: [['fade', 'Cross-fade'], ['slide', 'Slide across'], ['none', 'Cut']] },
      { k: 'kenBurns', t: 'toggle', label: 'Slow zoom on the active slide', value: false },

      { t: 'section', label: 'Controls' },
      { k: 'dots', t: 'toggle', label: 'Dots', value: true, help: 'The only control that works without JavaScript — leave this on.' },
      { k: 'arrows', t: 'toggle', label: 'Arrows', value: true },
      { k: 'counter', t: 'toggle', label: 'Slide counter', value: false },
      {
        k: 'swipe', t: 'toggle', label: 'Swipe on touch screens', value: true,
        help: 'Drag left or right to change banner. Vertical drags still scroll the page normally.'
      },

      { t: 'section', label: 'Control styling' },
      {
        k: 'ctrlColor', t: 'color', label: 'Control colour', value: '#ffffff',
        help: 'Used for the arrows and dots. On a solid fill the glyph flips to whichever of black or white reads against it.'
      },
      {
        k: 'arrowStyle', t: 'select', label: 'Arrow style', value: 'glass', when: { arrows: [true] },
        options: [['glass', 'Frosted glass'], ['solid', 'Solid fill'], ['outline', 'Outline'], ['bare', 'No background']]
      },
      {
        k: 'arrowShape', t: 'select', label: 'Arrow shape', value: 'circle', when: { arrows: [true] },
        options: [['circle', 'Circle'], ['rounded', 'Rounded square'], ['square', 'Square']]
      },
      {
        k: 'arrowSize', t: 'range', label: 'Arrow size', min: 28, max: 68, step: 2, unit: 'px', value: 40,
        when: { arrows: [true] },
        help: 'The tap target stays at least 44px even when the visible button is smaller.'
      },
      {
        k: 'arrowWeight', t: 'select', label: 'Arrow weight', value: 'thin', when: { arrows: [true] },
        options: [['hairline', 'Hairline'], ['thin', 'Thin'], ['regular', 'Regular'], ['bold', 'Bold']]
      },
      {
        k: 'arrowPlacement', t: 'select', label: 'Arrow position', value: 'row', when: { arrows: [true] },
        options: [['row', 'In the row with the dots'], ['sides', 'Left and right edges']]
      },
      {
        k: 'dotStyle', t: 'select', label: 'Dot style', value: 'bar', when: { dots: [true] },
        options: [['bar', 'Expanding bar'], ['dot', 'Dot'], ['ring', 'Ring']]
      },
      { k: 'dotSize', t: 'range', label: 'Dot size', min: 6, max: 18, step: 1, unit: 'px', value: 10, when: { dots: [true] } },

      { t: 'section', label: 'Layout' },
      { k: 'height', t: 'range', label: 'Height', min: 320, max: 900, step: 10, unit: 'px', value: 600 },
      { k: 'align', t: 'select', label: 'Alignment', value: 'left', options: [['left', 'Left'], ['center', 'Center']] },
      { k: 'titleSize', t: 'range', label: 'Headline size', min: 30, max: 88, step: 2, unit: 'px', value: 60 },

      { t: 'section', label: 'Style' },
      { k: 'overlayColor', t: 'color', label: 'Overlay colour', value: '#0b0a09' },
      { k: 'gradient', t: 'toggle', label: 'Extra fade at bottom', value: true },
      { k: 'textColor', t: 'color', label: 'Text colour', value: '#ffffff' }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var n = items.length;
      var group = 'cb-hsl-' + c.cls;
      var flex = p.align === 'center' ? 'center' : 'flex-start';

      /* A solid control is a filled shape, so its glyph has to be stated
         against the fill rather than inherited — the same reasoning as pin(). */
      function glyphOn(hex) {
        var h = String(hex || '#ffffff').replace('#', '');
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        var v = parseInt(h, 16);
        if (isNaN(v)) return '#141210';
        var lum = (0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255;
        return lum > 0.55 ? '#141210' : '#ffffff';
      }

      var cc = p.ctrlColor || p.textColor || '#ffffff';
      var aSize = c.num(p.arrowSize, 44);
      var aRadius = p.arrowShape === 'square' ? '0'
                  : p.arrowShape === 'rounded' ? 'calc(var(--cb-radius) * .6)' : '50%';
      var sideArrows = p.arrowPlacement === 'sides';

      var arrowSkin = {
        glass: 'background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.32); backdrop-filter: blur(6px);',
        solid: 'background: ' + cc + '; border: 1px solid ' + cc + ';',
        outline: 'background: transparent; border: 2px solid ' + cc + ';',
        bare: 'background: transparent; border: 0;'
      }[p.arrowStyle] || 'background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.32); backdrop-filter: blur(6px);';

      var arrowHover = {
        glass: 'background: rgba(255,255,255,.3);',
        solid: 'filter: brightness(.88);',
        outline: 'background: ' + c.rgba(cc, 0.18) + ';',
        bare: 'opacity: .65;'
      }[p.arrowStyle] || 'background: rgba(255,255,255,.3);';

      // Only a filled control changes what the glyph must be drawn in.
      var arrowInk = p.arrowStyle === 'solid' ? glyphOn(cc) : cc;

      /* The chevron is drawn rather than typed. A text character (&#8249;) is
         whatever weight the inherited font makes it — heavy, inconsistent
         between fonts, and a host theme can swap the font out from under it.
         A stroked path is the same clean shape everywhere and takes a real
         weight control. It inherits currentColor, so the pinned button colour
         reaches it without a span for a host rule to hijack. */
      var strokeW = { hairline: 1.25, thin: 1.6, regular: 2.1, bold: 2.9 }[p.arrowWeight] || 1.6;
      var chevSize = Math.round(aSize * 0.42);

      function chevron(dir) {
        var d = dir === 'prev' ? 'M15 5.5 L8.5 12 L15 18.5' : 'M9 5.5 L15.5 12 L9 18.5';
        return '<svg class="cb-hsl__chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + strokeW +
          '" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }

      var dotSize = c.num(p.dotSize, 10);
      var dotBase = {
        bar: 'width: ' + dotSize + 'px; height: ' + dotSize + 'px; border-radius: ' + dotSize + 'px; background: ' + c.rgba(cc, 0.45) + ';',
        dot: 'width: ' + dotSize + 'px; height: ' + dotSize + 'px; border-radius: 50%; background: ' + c.rgba(cc, 0.4) + ';',
        ring: 'width: ' + dotSize + 'px; height: ' + dotSize + 'px; border-radius: 50%; background: transparent; border: 2px solid ' + c.rgba(cc, 0.6) + ';'
      }[p.dotStyle] || 'width: ' + dotSize + 'px; height: ' + dotSize + 'px; border-radius: ' + dotSize + 'px; background: ' + c.rgba(cc, 0.45) + ';';

      var dotActive = {
        bar: 'background: ' + cc + '; width: ' + Math.round(dotSize * 3) + 'px;',
        dot: 'background: ' + cc + ';',
        ring: 'background: ' + cc + '; border-color: ' + cc + ';'
      }[p.dotStyle] || 'background: ' + cc + '; width: ' + Math.round(dotSize * 3) + 'px;';

      var slides = items.map(function (it, i) {
        var veil = c.rgba(p.overlayColor, c.num(it.overlay, 45) / 100);
        return c.dedent(`
          <div class="cb-hsl__slide" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}">
            <div class="cb-hsl__bg" role="presentation">
              <img src="${c.url(it.image)}" alt="${c.attr(it.alt)}" loading="${i ? 'lazy' : 'eager'}" decoding="async"
                   style="object-position: ${c.attr(it.focal || 'center')}">
            </div>
            <div class="cb-hsl__veil" role="presentation" style="--cb-veil: ${veil}"></div>
            <div class="cb-hsl__inner cb-wrap">
              <div class="cb-hsl__content">
                ${it.eyebrow ? '<p class="cb-hsl__eyebrow">' + c.esc(it.eyebrow) + '</p>' : ''}
                ${it.title ? '<h2 class="cb-hsl__title">' + c.rich(it.title) + '</h2>' : ''}
                ${it.sub ? '<p class="cb-hsl__sub">' + c.rich(it.sub) + '</p>' : ''}
                ${(it.btnText || it.btn2Text) ? `<div class="cb-hsl__actions">
                  ${it.btnText ? '<a class="cb-btn cb-btn--primary" href="' + c.url(it.btnUrl) + '">' + c.esc(it.btnText) + '</a>' : ''}
                  ${it.btn2Text ? '<a class="cb-btn cb-btn--ghost" href="' + c.url(it.btn2Url) + '">' + c.esc(it.btn2Text) + '</a>' : ''}
                </div>` : ''}
              </div>
            </div>
          </div>`);
      }).join('\n');

      /* Dots are radios, so choosing a slide needs no JavaScript at all. */
      var dots = p.dots ? c.dedent(`
        <fieldset class="cb-hsl__dots">
          <legend class="cb-sr">Choose a slide</legend>
${items.map(function (it, i) {
  return '          <label class="cb-hsl__dot"><input class="cb-hsl__radio" type="radio" name="' + c.attr(group) +
    '" data-i="' + i + '"' + (i === 0 ? ' checked' : '') + '><span class="cb-hsl__dotMark" aria-hidden="true"></span>' +
    '<span class="cb-sr">Slide ' + (i + 1) + (it.title ? ': ' + c.attr(String(it.title).split('\n')[0]) : '') + '</span></label>';
}).join('\n')}
        </fieldset>`) : '';

      /* Hidden in the markup until scripts run, so they never sit there as dead
         controls where <script> has been stripped. */
      var arrowsHtml = p.arrows ? c.dedent(`
        <div class="cb-hsl__arrows" hidden>
          <button type="button" class="cb-hsl__arrow cb-hsl__prev" aria-label="Previous banner">${chevron('prev')}</button>
          <button type="button" class="cb-hsl__arrow cb-hsl__next" aria-label="Next banner">${chevron('next')}</button>
        </div>`) : '';

      var html = c.dedent(`
        <section class="${c.cls} cb-hsl" aria-roledescription="carousel" aria-label="Featured banners">
          <div class="cb-hsl__stage" aria-live="polite">
${c.indent(slides, 12)}
          </div>
          ${sideArrows ? c.indent(arrowsHtml, 10).trim() : ''}
          <div class="cb-hsl__controls">
            ${sideArrows ? '' : c.indent(arrowsHtml, 12).trim()}
            ${dots}
            ${p.counter ? '<p class="cb-hsl__counter" aria-hidden="true"></p>' : ''}
            ${p.autoplay ? `<button type="button" class="cb-hsl__play" hidden aria-label="Pause banner rotation" data-playing="1">
              <span class="cb-hsl__playIcon" aria-hidden="true"></span>
            </button>` : ''}
          </div>
        </section>`);

      var enter = {
        fade: 'opacity: 1; visibility: visible; transform: none;',
        slide: 'opacity: 1; visibility: visible; transform: none;',
        none: 'opacity: 1; visibility: visible;'
      }[p.transition] || '';

      var leave = {
        fade: 'opacity: 0; visibility: hidden;',
        slide: 'opacity: 0; visibility: hidden; transform: translateX(6%);',
        none: 'opacity: 0; visibility: hidden;'
      }[p.transition] || '';

      var sel = items.map(function (it, i) {
        return `${s}:has(.cb-hsl__radio[data-i="${i}"]:checked) .cb-hsl__slide[data-i="${i}"] { ${enter} z-index: 1; }\n        ` +
          (p.dots ? `${s}:has(.cb-hsl__radio[data-i="${i}"]:checked) .cb-hsl__dot:nth-of-type(${i + 1}) .cb-hsl__dotMark { ${dotActive} }` : '');
      }).join('\n        ');

      var css = `
        ${s}.cb-hsl {
          position: relative; overflow: hidden; isolation: isolate;
          min-height: ${c.num(p.height, 600)}px;
          display: flex; flex-direction: column; justify-content: flex-end;
          color: ${p.textColor}; background: #000;
        }
        ${s} .cb-hsl__stage { display: grid; position: absolute; inset: 0; }
        ${s} .cb-hsl__slide {
          grid-area: 1 / 1; position: relative; display: flex; align-items: center;
          ${leave}
          transition: opacity .7s ease, transform .7s cubic-bezier(.3,.7,.3,1), visibility .7s;
        }
        ${s} .cb-hsl__bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
        ${s} .cb-hsl__bg img { width: 100%; height: 100%; object-fit: cover; }
        ${p.kenBurns ? `
        ${s}:has(.cb-hsl__radio:checked) .cb-hsl__slide .cb-hsl__bg img { transform: scale(1); transition: transform 9s linear; }
        ${items.map(function (it, i) {
          return `${s}:has(.cb-hsl__radio[data-i="${i}"]:checked) .cb-hsl__slide[data-i="${i}"] .cb-hsl__bg img { transform: scale(1.09); }`;
        }).join('\n        ')}
        @media (prefers-reduced-motion: reduce) {
          ${s} .cb-hsl__bg img { transition: none !important; transform: none !important; }
        }` : ''}
        ${s} .cb-hsl__veil {
          position: absolute; inset: 0; z-index: 1; background: var(--cb-veil);
          ${p.gradient ? 'background-image: linear-gradient(to bottom, transparent 40%, ' + c.rgba(p.overlayColor, 0.85) + ' 100%);' : ''}
        }
        ${s} .cb-hsl__inner { position: relative; z-index: 2; width: 100%; padding-block: 80px 120px; }
        ${s} .cb-hsl__content {
          display: flex; flex-direction: column; gap: 18px;
          align-items: ${flex}; text-align: ${p.align};
          max-width: ${p.align === 'center' ? '780px' : '640px'};
          ${p.align === 'center' ? 'margin-inline: auto;' : ''}
        }
        ${s} .cb-hsl__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.14em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase; opacity: .88;
        }
        ${s} .cb-hsl__title {
          font-size: calc(clamp(32px, 6vw, ${c.num(p.titleSize, 60)}px) * var(--cb-h-scale, 1));
          font-weight: var(--cb-h-weight, 800); line-height: calc(1.08 + var(--cb-h-leading, 0)); letter-spacing: calc(-.03em + var(--cb-h-track, 0em)); text-wrap: balance;
        }
        ${s} .cb-hsl__sub { font-size: calc(clamp(16px, 2.2vw, 19px) * var(--cb-body-scale, 1)); opacity: .9; max-width: 54ch; }
        ${s} .cb-hsl__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; justify-content: ${flex}; }

        ${sel}

        ${s} .cb-hsl__controls {
          position: relative; z-index: 3; width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 16px;
          padding: 0 20px 26px; flex-wrap: wrap;
        }
        ${s} .cb-hsl__arrows { display: flex; gap: 8px; }
        ${sideArrows ? `
        /* Pinned to the section's own edges rather than the control row. The
           wrapper stays click-through so it never covers the banner's links. */
        ${s} .cb-hsl__arrows {
          position: absolute; inset: 0; z-index: 3; display: block; pointer-events: none;
        }
        ${s} .cb-hsl__arrow { position: absolute; top: 50%; translate: 0 -50%; pointer-events: auto; }
        ${s} .cb-hsl__prev { left: 18px; }
        ${s} .cb-hsl__next { right: 18px; }
        @media (max-width: 640px) {
          ${s} .cb-hsl__prev { left: 8px; }
          ${s} .cb-hsl__next { right: 8px; }
        }` : ''}
        ${s} .cb-hsl__arrow, ${s} .cb-hsl__play {
          position: relative;
          width: ${aSize}px; height: ${aSize}px; border-radius: ${aRadius};
          display: grid; place-items: center;
          padding: 0; line-height: 1;
          transition: background .2s ease, filter .2s ease, opacity .2s ease;
          ${arrowSkin}
        }
        ${s} .cb-hsl__chev { display: block; width: ${chevSize}px; height: ${chevSize}px; }
        /* A small control still needs a full-size target. The visible circle can
           shrink; what the thumb has to hit does not. */
        ${s} .cb-hsl__arrow::after, ${s} .cb-hsl__play::after {
          content: ""; position: absolute; left: 50%; top: 50%; translate: -50% -50%;
          width: max(44px, 100%); height: max(44px, 100%);
        }
        ${s} .cb-hsl__arrow:hover, ${s} .cb-hsl__play:hover { ${arrowHover} }
        ${s} .cb-hsl__arrow[disabled] { opacity: .35; cursor: not-allowed; }
        ${s} .cb-hsl__playIcon {
          width: 11px; height: 13px; background: currentColor;
          clip-path: polygon(0 0, 35% 0, 35% 100%, 0 100%, 0 0, 65% 0, 100% 0, 100% 100%, 65% 100%, 65% 0);
        }
        ${s} .cb-hsl__play[data-playing="0"] .cb-hsl__playIcon { clip-path: polygon(0 0, 100% 50%, 0 100%); width: 12px; }

        ${s} .cb-hsl__dots {
          display: flex; gap: 9px; border: 0; padding: 0; margin: 0; min-inline-size: 0;
        }
        ${s} .cb-hsl__dot { display: grid; place-items: center; cursor: pointer; position: relative; }
        /* 44px target regardless of how small the dot is drawn. */
        ${s} .cb-hsl__dot::after {
          content: ""; position: absolute; left: 50%; top: 50%;
          width: 44px; height: 44px; translate: -50% -50%;
        }
        ${s} .cb-hsl__radio { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; }
        ${s} .cb-hsl__dotMark {
          display: block;
          transition: background .25s ease, width .25s ease, border-color .25s ease;
          ${dotBase}
        }
        ${s} .cb-hsl__radio:focus-visible ~ .cb-hsl__dotMark {
          outline: 3px solid ${cc}; outline-offset: 4px;
        }
        ${s} .cb-hsl__counter { font-size: .85em; font-variant-numeric: tabular-nums; opacity: .75; }

        ${c.pin([s + ' .cb-hsl__eyebrow', s + ' .cb-hsl__title', s + ' .cb-hsl__sub',
                 s + ' .cb-btn--ghost', s + ' .cb-hsl__counter'], p.textColor)}
        /* The chevron strokes read currentColor off the button, so the button's
           own colour has to be stated rather than inherited — a filled control
           whose glyph picks up a host text colour loses it against its fill. */
        ${c.pin([s + ' .cb-hsl__arrow', s + ' .cb-hsl__play', s + ' .cb-hsl__playIcon'], arrowInk)}

        /* Nothing checked — a duplicated radio group would do this — still shows
           the first banner rather than a black box. */
        ${s}:not(:has(.cb-hsl__radio:checked)) .cb-hsl__slide[data-i="0"] { ${enter} z-index: 1; }
        ${p.dots ? `${s}:not(:has(.cb-hsl__radio:checked)) .cb-hsl__dot:nth-of-type(1) .cb-hsl__dotMark { ${dotActive} }` : ''}
        @supports not selector(:has(*)) {
          ${s} .cb-hsl__slide[data-i="0"] { ${enter} z-index: 1; }
          ${p.dots ? `${s} .cb-hsl__dot:nth-of-type(1) .cb-hsl__dotMark { ${dotActive} }` : ''}
        }
        @media (max-width: 640px) {
          ${s} .cb-hsl__content { align-items: flex-start; text-align: left; margin-inline: 0; }
          ${s} .cb-hsl__actions { justify-content: flex-start; width: 100%; }
          ${s} .cb-hsl__actions .cb-btn { flex: 1 1 auto; }
          ${s} .cb-hsl__inner { padding-block: 60px 100px; }
        }
        @media (prefers-reduced-motion: reduce) {
          ${s} .cb-hsl__slide { transition: opacity .01ms, visibility .01ms; transform: none !important; }
        }`;

      var js = c.wrap(c.cls, `
        var radios = Array.prototype.slice.call(root.querySelectorAll(".cb-hsl__radio"));
        if (radios.length < 2) return;

        /* Radio groups are document-wide, so a duplicated paste would otherwise
           share one selection between both banners. */
        if (copy > 0) radios.forEach(function (r) { r.name = r.name + "-" + copy; });

        var arrows = root.querySelector(".cb-hsl__arrows");
        var play = root.querySelector(".cb-hsl__play");
        var counter = root.querySelector(".cb-hsl__counter");
        var stage = root.querySelector(".cb-hsl__stage");
        var loop = ${p.loop ? 'true' : 'false'};
        var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function index() {
          for (var i = 0; i < radios.length; i++) if (radios[i].checked) return i;
          return 0;
        }
        function go(i) {
          if (loop) i = (i + radios.length) % radios.length;
          else i = Math.max(0, Math.min(i, radios.length - 1));
          radios[i].checked = true;
          radios[i].dispatchEvent(new Event("change", { bubbles: true }));
          sync();
        }
        function sync() {
          var i = index();
          if (counter) counter.textContent = (i + 1) + " / " + radios.length;
          var prev = root.querySelector(".cb-hsl__prev");
          var next = root.querySelector(".cb-hsl__next");
          if (prev && !loop) prev.disabled = i === 0;
          if (next && !loop) next.disabled = i === radios.length - 1;
        }

        /* Arrows are markup-hidden until scripts run, so they never sit there
           as dead controls where JavaScript has been stripped. */
        if (arrows) {
          arrows.hidden = false;
          root.querySelector(".cb-hsl__prev").addEventListener("click", function () { stop(); go(index() - 1); });
          root.querySelector(".cb-hsl__next").addEventListener("click", function () { stop(); go(index() + 1); });
        }
        radios.forEach(function (r) { r.addEventListener("change", sync); });

        /* ---- rotation ---- */
        var timer = null;
        var wanted = ${p.autoplay ? 'true' : 'false'} && !reduced;

        function tick() { go(index() + 1); }
        function start() {
          if (!wanted || timer) return;
          timer = setInterval(tick, ${c.num(p.interval, 6) * 1000});
          if (play) { play.setAttribute("data-playing", "1"); play.setAttribute("aria-label", "Pause banner rotation"); }
          if (stage) stage.setAttribute("aria-live", "off");
        }
        function stop() {
          if (!timer) return;
          clearInterval(timer); timer = null;
          if (play) { play.setAttribute("data-playing", "0"); play.setAttribute("aria-label", "Start banner rotation"); }
          if (stage) stage.setAttribute("aria-live", "polite");
        }

        /* Autoplay only ever appears alongside its pause control — WCAG 2.2.2
           requires a way to stop motion that starts on its own. */
        if (play && wanted) {
          play.hidden = false;
          play.addEventListener("click", function () { if (timer) { stop(); } else { start(); } });
        }

        function suspend() { if (timer) { clearInterval(timer); timer = null; } }
        function resume() {
          if (!wanted || timer) return;
          if (play && play.getAttribute("data-playing") !== "1") return;
          if (root.contains(document.activeElement)) return;
          timer = setInterval(tick, ${c.num(p.interval, 6) * 1000});
        }
        root.addEventListener("mouseenter", suspend);
        root.addEventListener("mouseleave", resume);
        root.addEventListener("focusin", suspend);
        root.addEventListener("focusout", function () { setTimeout(resume, 0); });

        ${p.swipe ? `
        /* Swipe. Listeners are passive and nothing is preventDefault-ed, so a
           vertical drag still scrolls the page — only a clearly horizontal one
           changes banner. Treated as a deliberate choice, like the arrows, so
           it stops autoplay rather than fighting the user. */
        if (stage && "ontouchstart" in window) {
          var sx = 0, sy = 0, swiping = false;
          stage.addEventListener("touchstart", function (e) {
            swiping = e.touches.length === 1;
            if (!swiping) return;
            sx = e.touches[0].clientX;
            sy = e.touches[0].clientY;
          }, { passive: true });
          stage.addEventListener("touchend", function (e) {
            if (!swiping) return;
            swiping = false;
            var t = e.changedTouches[0];
            var dx = t.clientX - sx, dy = t.clientY - sy;
            if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
            stop();
            go(index() + (dx < 0 ? 1 : -1));
          }, { passive: true });
        }` : ''}

        /* Pause while off-screen so a hero at the top of a long page is not
           cycling images nobody can see. */
        if ("IntersectionObserver" in window) {
          new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) resume(); else suspend(); });
          }, { threshold: 0.2 }).observe(root);
        }

        sync();
        start();`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* CTA Banner                                                             */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'cta-banner',
    name: 'CTA Banner',
    category: CAT,
    icon: '◈',
    blurb: 'A closing call-to-action strip. Solid, gradient or image background.',
    props: [
      { t: 'section', label: 'Content' },
      { k: 'title', t: 'text', label: 'Headline', value: 'Ready to build your first component?' },
      { k: 'sub', t: 'textarea', label: 'Subheadline', value: 'No sign-up, no build step. Pick a block, edit it, paste the code.' },
      { k: 'btnText', t: 'text', label: 'Primary button', value: 'Open the builder' },
      { k: 'btnUrl', t: 'url', label: 'Primary link', value: '#' },
      { k: 'btn2Text', t: 'text', label: 'Secondary button', value: 'Browse components' },
      { k: 'btn2Url', t: 'url', label: 'Secondary link', value: '#' },

      { t: 'section', label: 'Background' },
      { k: 'style', t: 'select', label: 'Background style', value: 'gradient', options: [['gradient', 'Brand gradient'], ['solid', 'Solid colour'], ['image', 'Image'], ['soft', 'Soft tint']] },
      { k: 'solid', t: 'color', label: 'Solid colour', value: '#141210', when: { style: ['solid'] } },
      { k: 'image', t: 'image', label: 'Image', value: CB.ph(1600, 600, '', '#141210', '#96694c'), when: { style: ['image'] } },
      { k: 'overlayOpacity', t: 'range', label: 'Image overlay', min: 0, max: 90, step: 5, unit: '%', value: 60, when: { style: ['image'] } },

      { t: 'section', label: 'Layout' },
      { k: 'layout', t: 'select', label: 'Layout', value: 'stacked', options: [['stacked', 'Stacked / centred'], ['inline', 'Text left, buttons right']] },
      { k: 'radius', t: 'toggle', label: 'Rounded card (inset)', value: false },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 32, max: 160, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var dark = p.style !== 'soft';
      /* The gradient goes in background-image over a solid background-color,
         rather than in the background shorthand. Some sanitisers drop
         gradient values they don't recognise, and as a shorthand that left the
         strip with no background at all — white text on the page's own white,
         at 1:1. With the colour stated separately the gradient can vanish and
         the strip is merely flat. The gradient is fully opaque, so the solid
         underneath is never seen while it works. */
      var bg;
      if (p.style === 'gradient') {
        bg = 'background: var(--cb-brand); background-image: linear-gradient(120deg, var(--cb-brand) 0%, var(--cb-brand-2) 100%);';
      } else if (p.style === 'solid') bg = 'background: ' + p.solid + ';';
      else if (p.style === 'soft') bg = 'background: var(--cb-subtle);';
      else bg = 'background: transparent;';

      var html = c.dedent(`
        <section class="${c.cls} cb-cta">
          <div class="cb-cta__shell">
            ${p.style === 'image' ? `<div class="cb-cta__bg" role="presentation"><img src="${c.url(p.image)}" alt="" loading="lazy" decoding="async"></div><div class="cb-cta__veil" role="presentation"></div>` : ''}
            <div class="cb-wrap cb-cta__inner">
              <div class="cb-cta__copy">
                ${p.title ? '<h2 class="cb-cta__title">' + c.rich(p.title) + '</h2>' : ''}
                ${p.sub ? '<p class="cb-cta__sub">' + c.rich(p.sub) + '</p>' : ''}
              </div>
              ${(p.btnText || p.btn2Text) ? `<div class="cb-cta__actions">
                ${p.btnText ? '<a class="cb-btn cb-cta__primary" href="' + c.url(p.btnUrl) + '">' + c.esc(p.btnText) + '</a>' : ''}
                ${p.btn2Text ? '<a class="cb-btn cb-btn--ghost" href="' + c.url(p.btn2Url) + '">' + c.esc(p.btn2Text) + '</a>' : ''}
              </div>` : ''}
            </div>
          </div>
        </section>`);

      var css = `
        ${s}.cb-cta { ${p.radius ? 'padding: 24px;' : ''} }
        ${s} .cb-cta__shell {
          position: relative; overflow: hidden; isolation: isolate;
          ${bg}
          color: ${dark ? '#fff' : 'var(--cb-ink)'};
          padding-block: ${c.num(p.pad, 72)}px;
          ${p.radius ? 'border-radius: calc(var(--cb-radius) * 1.6);' : ''}
        }
        ${s} .cb-cta__bg { position: absolute; inset: 0; z-index: 0; }
        ${s} .cb-cta__bg img { width: 100%; height: 100%; object-fit: cover; }
        ${s} .cb-cta__veil { position: absolute; inset: 0; z-index: 1; background: ${c.rgba('#12100e', c.num(p.overlayOpacity, 60) / 100)}; }
        ${s} .cb-cta__inner {
          position: relative; z-index: 2;
          display: flex; gap: 28px;
          ${p.layout === 'inline'
            ? 'flex-direction: row; align-items: center; justify-content: space-between; text-align: left;'
            : 'flex-direction: column; align-items: center; text-align: center;'}
        }
        ${s} .cb-cta__copy { display: flex; flex-direction: column; gap: 12px; ${p.layout === 'stacked' ? 'max-width: 680px;' : ''} }
        ${s} .cb-cta__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); text-wrap: balance; }
        ${s} .cb-cta__sub { opacity: ${dark ? '.88' : '1'}; ${dark ? '' : 'color: var(--cb-muted);'} font-size: calc(clamp(16px, 2.2vw, 19px) * var(--cb-body-scale, 1)); }
        ${s} .cb-cta__actions { display: flex; flex-wrap: wrap; gap: 12px; flex-shrink: 0; ${p.layout === 'stacked' ? 'justify-content: center;' : ''} }
        ${dark ? c.pin([s + ' .cb-cta__title', s + ' .cb-cta__sub', s + ' .cb-btn--ghost'], 'var(--cb-on-dark, #fff)') : ''}
        ${s} .cb-cta__primary {
          background: ${dark ? '#fff' : 'var(--cb-brand)'};
          box-shadow: 0 8px 22px -10px rgba(0,0,0,.5);
        }
        ${/* On the dark variant the button is white in either scheme, so its
              label has to be the colour that does not flip — --cb-ink turns
              light under a dark scheme and the label disappears into the fill. */
          c.pin([s + ' .cb-cta__primary'], dark ? 'var(--cb-deep, #141210)' : 'var(--cb-on-brand)')}
        @media (max-width: 760px) {
          ${s} .cb-cta__inner { flex-direction: column; align-items: center; text-align: center; }
          ${s} .cb-cta__actions { justify-content: center; width: 100%; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Announcement Bar                                                       */
  /*                                                                        */
  /* A thin strip for a launch, a recall or a service notice. Closing it   */
  /* works with no script at all — a checkbox and :has() — so it still      */
  /* closes where an editor strips scripts. Where scripts do run, it also   */
  /* stays closed for the rest of the visit, keyed to the message, so a new */
  /* message is seen even by someone who closed the last one.               */
  /*                                                                        */
  /* Each tone is a fixed pair of ground and ink rather than something that */
  /* follows the scheme, except Quiet, which is meant to.                   */
  /* --------------------------------------------------------------------- */

  function anHash(s) {
    var h = 0;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return (h >>> 0).toString(36);
  }

  CB.register({
    id: 'announcement',
    name: 'Announcement Bar',
    category: CAT,
    icon: '▔',
    blurb: 'A thin strip for a launch, a recall or a notice. Visitors can close it, and that works even where scripts are stripped.',
    props: [
      { t: 'section', label: 'Message' },
      { k: 'message', t: 'text', label: 'Message', value: 'New for 2026: updated installation guides for every building wire product.' },
      { k: 'linkText', t: 'text', label: 'Link text', value: 'See what changed', help: 'Leave empty for no link.' },
      { k: 'linkUrl', t: 'text', label: 'Link', value: '#' },

      { t: 'section', label: 'Style' },
      {
        k: 'tone', t: 'select', label: 'Tone', value: 'brand',
        options: [['brand', 'Brand color'], ['dark', 'Dark'], ['subtle', 'Quiet, follows the color scheme'], ['warning', 'Warning']]
      },
      { k: 'align', t: 'select', label: 'Alignment', value: 'center', options: [['center', 'Center'], ['left', 'Left']] },
      {
        k: 'dismiss', t: 'toggle', label: 'Let visitors close it', value: true,
        help: 'Closing works without JavaScript. Where scripts run, it also stays closed for the rest of the visit.'
      }
    ],

    render: function (p, c) {
      var s = c.s;
      var tone = ['brand', 'dark', 'subtle', 'warning'].indexOf(p.tone) >= 0 ? p.tone : 'brand';
      var pair = {
        brand:   { bg: 'var(--cb-brand)', ink: 'var(--cb-on-brand, #fff)', pin: true },
        dark:    { bg: 'var(--cb-deep, #141210)', ink: 'var(--cb-on-dark, #fff)', pin: true },
        subtle:  { bg: 'var(--cb-band, #f7f4f1)', ink: 'var(--cb-ink)', pin: false },
        warning: { bg: '#fcebc6', ink: '#1f1a14', pin: true }
      }[tone];

      var html = c.dedent(`
        <div class="${c.cls} cb-an cb-an--${tone}" role="region" aria-label="Announcement">
          <div class="cb-wrap cb-an__inner">
            <p class="cb-an__msg">${c.rich(p.message || '')}${p.linkText
              ? ' <a class="cb-an__link" href="' + c.url(p.linkUrl) + '">' + c.esc(p.linkText) + '<span aria-hidden="true"> →</span></a>'
              : ''}</p>
            ${p.dismiss ? `<label class="cb-an__close">
              <input class="cb-an__toggle cb-sr" type="checkbox" aria-label="Dismiss announcement">
              <span class="cb-an__x" aria-hidden="true">×</span>
            </label>` : ''}
          </div>
        </div>`);

      var css = `
        ${s}.cb-an { background: ${pair.bg}; color: ${pair.ink}; border-bottom: 1px solid rgba(0,0,0,.08); }
        ${s} .cb-an__inner {
          display: flex; align-items: center; gap: 16px; min-height: 46px; padding-block: 10px;
          ${p.align === 'left' ? '' : 'justify-content: center; text-align: center;'}
        }
        ${s} .cb-an__msg { font-size: .92em; font-weight: 500; line-height: 1.45; color: inherit; ${p.dismiss ? 'flex: 1 1 auto;' : ''} }
        ${s} .cb-an__link { color: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: .18em; white-space: nowrap; }
        ${s} .cb-an__close { position: relative; flex: none; display: grid; place-items: center; width: 32px; height: 32px; cursor: pointer; border-radius: 50%; }
        ${s} .cb-an__close:hover { background: rgba(127,127,127,.18); }
        ${s} .cb-an__x { font-size: 1.12em; line-height: 1; font-weight: 700; color: inherit; }
        ${s} .cb-an__toggle:focus-visible + .cb-an__x { outline: 2px solid currentColor; outline-offset: 5px; border-radius: 50%; }
        /* Closing is a checkbox and :has(), so it needs no script. */
        ${s}:has(.cb-an__toggle:checked) { display: none; }
        ${pair.pin ? c.pin([s + ' .cb-an__msg', s + ' .cb-an__link', s + ' .cb-an__x'], pair.ink) : ''}`;

      var js = p.dismiss ? c.wrap(c.cls, `
        var key = "cb-an-${anHash(String(p.message || '') + '|' + String(p.linkText || ''))}";
        try { if (window.sessionStorage && sessionStorage.getItem(key)) { root.style.display = "none"; return; } } catch (e) {}
        var box = root.querySelector(".cb-an__toggle");
        if (!box) return;
        box.addEventListener("change", function () {
          if (!box.checked) return;
          try { sessionStorage.setItem(key, "1"); } catch (e) {}
        });`) : '';

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Footage in Type                                                        */
  /*                                                                        */
  /* A headline set huge, with video or a photograph showing through the    */
  /* letters. The footage sits in a layer behind an SVG that paints the     */
  /* block's own ground everywhere except the letters, which are cut out of */
  /* it by a mask — so the letters are windows onto the footage. Masking    */
  /* rather than a blend mode is what lets the ground be any colour,        */
  /* including one that follows the light or dark scheme: a blend mode only */
  /* knocks out cleanly against pure white or pure black.                  */
  /*                                                                        */
  /* The words a reader and a search engine get are a real heading; the     */
  /* drawn letters are hidden from assistive technology. If the footage     */
  /* fails, the letters show a solid brand tone. If the styles are stripped */
  /* altogether, the mask still draws the words, and the heading is there   */
  /* as text.                                                               */
  /* --------------------------------------------------------------------- */

  /* Advance widths of Inter ExtraBold, in thousandths of an em, measured
     from the font. They set the drawing's proportions so each line fills the
     width; the line is then held to that width with textLength, so another
     font or a missing glyph changes its shape slightly, never its fit. */
  var FT_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,'’&!?-–—:/+%$#()\"“”@";
  var FT_ADV = [692, 441, 638, 657, 688, 634, 662, 588, 664, 662, 770, 665, 744, 723, 610, 585, 752, 749, 286,
    590, 738, 565, 943, 766, 773, 652, 782, 662, 660, 677, 727, 770, 1059, 761, 752, 679, 588, 638, 595, 638,
    601, 410, 639, 635, 283, 283, 593, 283, 927, 635, 619, 638, 638, 420, 573, 382, 635, 615, 863, 594, 618,
    581, 219, 353, 353, 354, 331, 683, 358, 579, 471, 500, 1000, 353, 400, 686, 1029, 660, 655, 382, 382, 586,
    581, 569, 1036];
  function ftEm(text) {
    var em = 0;
    for (var i = 0; i < text.length; i++) {
      var k = FT_CHARS.indexOf(text.charAt(i));
      em += (k < 0 ? 640 : FT_ADV[k]) / 1000;
    }
    return em;
  }

  /* Lays the lines out in a frame 1000 wide. Capitals need only their cap
     height; a line with lowercase or descenders needs room for them. */
  function ftLayout(lines, fill, align) {
    var W = 1000, MAXFS = 520;
    var rows = lines.map(function (t) {
      var low = /[a-z]/.test(t), desc = /[gjpqy,;Q()]/.test(t);
      return { t: t, em: Math.max(0.5, ftEm(t)), up: low ? 0.78 : 0.76, down: desc ? 0.23 : 0.02 };
    });
    var widest = Math.max.apply(null, rows.map(function (r) { return r.em; }));
    var y = 0;
    rows.forEach(function (r, i) {
      r.fs = Math.min(MAXFS, W / (fill ? r.em : widest));
      r.len = Math.min(W, r.em * r.fs);
      r.y = y + r.up * r.fs;
      var next = rows[i + 1];
      y = r.y + r.down * r.fs + (next ? 0.07 * Math.min(r.fs, Math.min(MAXFS, W / (fill ? next.em : widest))) : 0);
    });
    var anchor = align === 'left' ? 'start' : 'middle';
    rows.forEach(function (r) { r.x = anchor === 'start' ? 0 : W / 2; r.anchor = anchor; });
    return { W: W, H: Math.ceil(y), rows: rows };
  }

  CB.register({
    id: 'footage-type',
    name: 'Footage in Type',
    category: CAT,
    icon: 'Ⓐ',
    blurb: 'A headline set huge, with video or a photograph playing inside the letters. The real heading stays text for screen readers and search.',
    props: [
      { t: 'section', label: 'Words' },
      {
        k: 'words', t: 'textarea', label: 'Headline', value: 'POWER\nIN MOTION',
        help: 'One line per row. Short words read best — each row is drawn as large as the width allows.'
      },
      { k: 'caps', t: 'toggle', label: 'Set in capitals', value: true },
      {
        k: 'fit', t: 'select', label: 'Row size', value: 'fill',
        options: [['fill', 'Each row fills the width'], ['even', 'All rows the same size']]
      },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'New for 2026' },
      { k: 'sub', t: 'textarea', label: 'Line underneath', value: 'Conductors engineered for the loads that are coming, not the ones we had.' },
      { k: 'btnText', t: 'text', label: 'Button label', value: 'Explore the range' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },

      { t: 'section', label: 'Inside the letters' },
      {
        k: 'media', t: 'select', label: 'Fill', value: 'sheen',
        options: [['sheen', 'Copper sheen that moves as you scroll'], ['image', 'A photograph'], ['video', 'Video']]
      },
      { k: 'image', t: 'image', label: 'Photograph', value: CB.ph(1600, 900, '', '#96694c', '#2b241f'), when: { media: ['image'] } },
      { k: 'src', t: 'url', label: 'Video (MP4 or WebM)', value: '', when: { media: ['video'] }, help: 'Self-hosted, muted and looping. The poster shows until it plays, and instead of it for visitors who ask for less motion.' },
      { k: 'poster', t: 'image', label: 'Poster image', value: CB.ph(1600, 900, '', '#6f4c37', '#141210'), when: { media: ['video'] } },
      { k: 'control', t: 'toggle', label: 'Show pause control', value: true, when: { media: ['video'] }, help: 'WCAG 2.2.2 — video that keeps moving needs a way to pause it.' },
      {
        k: 'tone', t: 'range', label: 'Footage brightness', min: 50, max: 150, step: 5, unit: '%', value: 100,
        when: { media: ['image', 'video'] },
        help: 'Letters need to stand apart from the background: darken bright footage on a light page, brighten dark footage on a dark one.'
      },

      { t: 'section', label: 'Style' },
      { k: 'align', t: 'select', label: 'Alignment', value: 'center', options: [['center', 'Center'], ['left', 'Left']] },
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
      var raw = String(p.words || '').split(/\r?\n/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); })
        .filter(Boolean).slice(0, 4);
      var lines = raw.map(function (l) { return p.caps ? l.toUpperCase() : l; });
      var spoken = raw.join(' ');
      var left = p.align === 'left';
      var media = ['sheen', 'image', 'video'].indexOf(p.media) >= 0 ? p.media : 'sheen';
      var hasVideo = media === 'video' && !!String(p.src || '').trim();
      if (media === 'video' && !hasVideo) media = 'image';
      var still = media === 'image' ? (p.media === 'video' ? p.poster : p.image) : '';
      var tone = c.clamp(c.num(p.tone, 100), 50, 150);
      var mid = c.cls + '-cut';

      var art = '';
      if (lines.length) {
        var L = ftLayout(lines, p.fit !== 'even', left ? 'left' : 'center');
        var box = 'x="-4" y="-4" width="' + (L.W + 8) + '" height="' + (L.H + 8) + '"';
        var words = L.rows.map(function (r) {
          return '<text class="cb-ft__word" x="' + r.x + '" y="' + r.y.toFixed(1) + '" font-size="' + r.fs.toFixed(1) +
            '" textLength="' + r.len.toFixed(1) + '" lengthAdjust="spacingAndGlyphs" text-anchor="' + r.anchor + '">' +
            c.esc(r.t) + '</text>';
        }).join('');
        var fillLayer = media === 'sheen' ? '<span class="cb-ft__sheen"></span>'
          : hasVideo ? '<img class="cb-ft__poster" src="' + c.url(p.poster) + '" alt="" decoding="async">' +
            '<video class="cb-ft__video" autoplay muted loop playsinline preload="metadata" poster="' + c.url(p.poster) + '">' +
            '<source src="' + c.url(p.src) + '"></video>'
          : '<img class="cb-ft__poster" src="' + c.url(still) + '" alt="" decoding="async">';
        art = c.dedent(`
          <div class="cb-ft__art" aria-hidden="true">
            <div class="cb-ft__fill">${fillLayer}</div>
            <svg class="cb-ft__cut" viewBox="0 0 ${L.W} ${L.H}" focusable="false">
              <defs><mask id="${mid}" maskUnits="userSpaceOnUse" ${box}><rect ${box} fill="#fff"/>${words}</mask></defs>
              <rect class="cb-ft__ground" ${box} mask="url(#${mid})"/>
            </svg>
          </div>`);
      }

      var html = c.dedent(`
        <section class="${c.cls} cb-ft">
          <div class="cb-wrap cb-ft__inner">
            ${p.eyebrow ? '<p class="cb-ft__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
            ${spoken ? '<h2 class="cb-ft__title"><span class="cb-sr">' + c.esc(spoken) + '</span></h2>' : ''}
        ${c.indent(art, 4)}
            ${p.sub ? '<p class="cb-ft__sub">' + c.rich(p.sub) + '</p>' : ''}
            ${c.actions([{ text: p.btnText, url: p.btnUrl }], { align: left ? '' : 'center', cls: 'cb-ft__cta' })}
            ${(hasVideo && p.control) ? '<button type="button" class="cb-ft__toggle" aria-label="Pause the video in the headline"><span class="cb-ft__icon" aria-hidden="true"></span></button>' : ''}
          </div>
        </section>`);

      /* The letters' own colour, for when the footage is missing: the brand,
         pulled toward the ink so it reads on whatever ground this is. The
         ink follows the scheme and the block's own ground, so this does too. */
      var solid = 'color-mix(in srgb, var(--cb-brand) 72%, var(--cb-ink))';
      var css = `
        ${s}.cb-ft { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; position: relative; isolation: isolate; contain: paint; }
        ${s} .cb-ft__inner {
          display: flex; flex-direction: column; gap: clamp(14px, 2vw, 22px);
          align-items: ${left ? 'flex-start' : 'center'}; text-align: ${left ? 'left' : 'center'};
        }
        ${s} .cb-ft__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand-ink, var(--cb-brand));
        }
        ${s} .cb-ft__title { margin: 0; }
        /* Heading size here scales the whole drawing down, centred or left as
           the block is; at its default, and above it, the words fill the
           column. */
        ${s} .cb-ft__art {
          position: relative; display: block; line-height: 0;
          width: min(100%, calc(100% * var(--cb-h-scale, 1)));
        }
        ${s} .cb-ft__fill {
          position: absolute; inset: 1px; overflow: hidden;
          background-color: ${solid};
        }
        ${s} .cb-ft__fill img, ${s} .cb-ft__fill video {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          ${tone !== 100 ? 'filter: brightness(' + (tone / 100).toFixed(2) + ');' : ''}
        }
        ${s} .cb-ft__cut { position: relative; display: block; width: 100%; height: auto; overflow: visible; }
        ${s} .cb-ft__ground { fill: ${c.bg(p)}; }
        ${s} .cb-ft__word {
          font-family: inherit; font-weight: var(--cb-h-weight, 800);
          letter-spacing: normal; text-transform: none; font-style: normal;
        }
        /* The sheen: bands of the brand pulled toward the ink and back. The
           ink is the colour that contrasts with this ground — dark on a light
           page, light on a dark one — so every band of the sheen stands
           further from the ground than the brand alone does, in either
           scheme. Pulling toward the page instead would sink the letters into
           a dark ground. Its position follows the scroll, which makes it
           motion the reader drives rather than motion needing a pause. */
        ${s} .cb-ft__sheen {
          position: absolute; inset: 0;
          background-color: ${solid};
          background-image: linear-gradient(105deg,
            color-mix(in srgb, var(--cb-brand) 55%, var(--cb-ink)) 0%,
            var(--cb-brand) 30%,
            color-mix(in srgb, var(--cb-brand) 35%, var(--cb-ink)) 50%,
            var(--cb-brand) 70%,
            color-mix(in srgb, var(--cb-brand) 55%, var(--cb-ink)) 100%);
          background-size: 280% 100%; background-position: 50% 0;
        }
        @supports (animation-timeline: view()) {
          @media (prefers-reduced-motion: no-preference) {
            ${s} .cb-ft__sheen {
              animation: cb-ft-sheen-${c.cls} linear both;
              animation-timeline: view();
              animation-range: cover 0% cover 100%;
            }
          }
        }
        @keyframes cb-ft-sheen-${c.cls} { from { background-position: 100% 0; } to { background-position: 0% 0; } }
        @media (prefers-reduced-motion: reduce) { ${s} .cb-ft__video { display: none; } }

        ${s} .cb-ft__sub {
          font-size: calc(clamp(16px, 2.2vw, 19px) * var(--cb-body-scale, 1)); color: var(--cb-muted);
          max-width: 56ch; text-wrap: balance;
        }
        ${s} .cb-ft__cta { margin-top: 4px; }
        ${s} .cb-ft__toggle {
          position: absolute; z-index: 2; right: 20px; bottom: 20px;
          width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
          background: var(--cb-surface); color: var(--cb-ink); border: 1px solid var(--cb-border); cursor: pointer;
        }
        ${s} .cb-ft__toggle:focus-visible { outline: 2px solid var(--cb-brand); outline-offset: 2px; }
        ${s} .cb-ft__icon {
          width: 12px; height: 14px; background: currentColor;
          clip-path: polygon(0 0, 35% 0, 35% 100%, 0 100%, 0 0, 65% 0, 100% 0, 100% 100%, 65% 100%, 65% 0);
        }
        ${s} .cb-ft__toggle[data-paused="1"] .cb-ft__icon { clip-path: polygon(0 0, 100% 50%, 0 100%); width: 13px; }`;

      var js = !hasVideo ? '' : c.wrap(c.cls, `
        var video = root.querySelector(".cb-ft__video");
        var toggle = root.querySelector(".cb-ft__toggle");
        if (!video) return;
        var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) { video.removeAttribute("autoplay"); video.pause(); }
        var manual = false;
        function sync() {
          if (!toggle) return;
          toggle.setAttribute("data-paused", video.paused ? "1" : "0");
          toggle.setAttribute("aria-label", (video.paused ? "Play" : "Pause") + " the video in the headline");
        }
        if (toggle) {
          toggle.addEventListener("click", function () {
            manual = true;
            if (video.paused) { video.play(); } else { video.pause(); }
          });
          video.addEventListener("play", sync);
          video.addEventListener("pause", sync);
          sync();
        }
        /* Nothing plays while the headline is off screen. */
        if ("IntersectionObserver" in window) {
          new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (manual || reduced) return;
              if (e.isIntersecting) { video.play().catch(function () {}); } else { video.pause(); }
            });
          }, { threshold: 0.1 }).observe(root);
        }`);

      return { html: html, css: css, js: js };
    }
  });
})();
