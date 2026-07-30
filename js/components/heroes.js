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
      { k: 'speed', t: 'range', label: 'Parallax strength', min: 0, max: 60, step: 5, unit: '%', value: 30 },
      {
        k: 'mobileParallax', t: 'toggle', label: 'Parallax on mobile', value: false,
        help: 'Off by default — scroll-linked movement is janky on phones and eats battery.'
      },
      { k: 'focal', t: 'select', label: 'Image focus', value: 'center', options: [['center', 'Center'], ['top', 'Top'], ['bottom', 'Bottom']] },

      { t: 'section', label: 'Overlay' },
      { k: 'overlay', t: 'color', label: 'Overlay colour', value: '#12100e' },
      { k: 'overlayOpacity', t: 'range', label: 'Overlay opacity', min: 0, max: 90, step: 5, unit: '%', value: 45 },
      { k: 'gradient', t: 'toggle', label: 'Extra fade at bottom', value: true },

      { t: 'section', label: 'Layout' },
      { k: 'align', t: 'select', label: 'Alignment', value: 'center', options: [['left', 'Left'], ['center', 'Center'], ['right', 'Right']] },
      { k: 'textColor', t: 'color', label: 'Text colour', value: '#ffffff' },
      { k: 'titleSize', t: 'range', label: 'Headline size', min: 28, max: 88, step: 2, unit: 'px', value: 56 },
      { k: 'cue', t: 'toggle', label: 'Scroll cue', value: true }
    ],

    render: function (p, c) {
      var s = c.s;
      var sp = c.clamp(c.num(p.speed, 30), 0, 60);
      var ov = sp;                       // background over-scan, in %
      var flex = p.align === 'left' ? 'flex-start' : p.align === 'right' ? 'flex-end' : 'center';

      var html = c.dedent(`
        <section class="${c.cls} cb-px" aria-label="${c.attr((p.title || '').split('\n')[0])}">
          <div class="cb-px__bg" role="presentation">
            <img src="${c.url(p.image)}" alt="" loading="eager" decoding="async">
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
        ${s}.cb-px {
          position: relative; display: flex; align-items: center;
          min-height: ${c.num(p.height, 580)}px;
          overflow: hidden; isolation: isolate;
          color: ${p.textColor};
        }
        ${s} .cb-px__bg {
          position: absolute; left: 0; right: 0;
          top: -${ov / 2}%; height: ${100 + ov}%;
          will-change: transform; z-index: 0;
        }
        ${s} .cb-px__bg img { width: 100%; height: 100%; object-fit: cover; object-position: ${p.focal}; }
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
          font-size: .78em; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
          opacity: .85; margin: 0;
        }
        ${s} .cb-px__title {
          font-size: clamp(30px, 6vw, ${c.num(p.titleSize, 56)}px);
          line-height: 1.08; font-weight: 800; letter-spacing: -.02em; text-wrap: balance;
        }
        ${s} .cb-px__sub { font-size: clamp(16px, 2.2vw, 19px); opacity: .9; max-width: 56ch; }
        ${s} .cb-px__actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: ${flex}; margin-top: 8px; }
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

      var js = sp === 0 ? '' : c.wrap(c.cls, `
        var bg = root.querySelector(".cb-px__bg");
        if (!bg) return;
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        /* Scroll-linked movement is janky and battery-hungry on phones, so it
           is opt-in there. Re-checked on resize rather than read once. */
        var mobileOn = ${p.mobileParallax ? 'true' : 'false'};
        var small = window.matchMedia ? window.matchMedia("(max-width: 640px)") : null;
        function enabled() { return mobileOn || !small || !small.matches; }

        var strength = ${sp} / 200;   /* half the over-scan, as a fraction */
        var queued = false;

        function paint() {
          queued = false;
          if (!enabled()) { bg.style.transform = ""; return; }
          var r = root.getBoundingClientRect();
          var vh = window.innerHeight || document.documentElement.clientHeight;
          if (r.bottom < -80 || r.top > vh + 80) return;
          /* -1 when the section sits below the fold, +1 once it has passed above */
          var progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
          if (progress < -1) progress = -1;
          if (progress > 1) progress = 1;
          bg.style.transform = "translate3d(0," + (progress * strength * r.height).toFixed(2) + "px,0)";
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
        ${s} .cb-vh__title { font-size: clamp(32px, 6vw, 60px); font-weight: 800; line-height: 1.06; letter-spacing: -.02em; text-wrap: balance; }
        ${s} .cb-vh__sub { font-size: clamp(16px, 2.2vw, 19px); opacity: .9; max-width: 54ch; }
        ${s} .cb-vh__toggle {
          position: absolute; z-index: 3; right: 20px; bottom: 20px;
          width: 44px; height: 44px; border-radius: 50%;
          display: grid; place-items: center;
          background: rgba(0,0,0,.45); color: #fff;
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
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
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
        ${s}.cb-sh { background: ${p.bg}; padding-block: ${c.num(p.pad, 80)}px; }
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
          font-size: .78em; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
          color: var(--cb-brand);
        }
        ${s} .cb-sh__title { font-size: clamp(28px, 4.4vw, 46px); font-weight: 800; line-height: 1.12; letter-spacing: -.02em; text-wrap: balance; }
        ${s} .cb-sh__sub { color: var(--cb-muted); font-size: 1.05em; max-width: 52ch; }
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
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 32, max: 160, step: 8, unit: 'px', value: 72 }
    ],

    render: function (p, c) {
      var s = c.s;
      var dark = p.style !== 'soft';
      var bg;
      if (p.style === 'gradient') bg = 'linear-gradient(120deg, var(--cb-brand) 0%, var(--cb-brand-2) 100%)';
      else if (p.style === 'solid') bg = p.solid;
      else if (p.style === 'soft') bg = 'var(--cb-subtle)';
      else bg = 'transparent';

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
          background: ${bg};
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
        ${s} .cb-cta__title { font-size: clamp(24px, 3.6vw, 38px); font-weight: 800; line-height: 1.15; letter-spacing: -.02em; text-wrap: balance; }
        ${s} .cb-cta__sub { opacity: ${dark ? '.88' : '1'}; ${dark ? '' : 'color: var(--cb-muted);'} font-size: 1.05em; }
        ${s} .cb-cta__actions { display: flex; flex-wrap: wrap; gap: 12px; flex-shrink: 0; ${p.layout === 'stacked' ? 'justify-content: center;' : ''} }
        ${s} .cb-cta__primary {
          background: ${dark ? '#fff' : 'var(--cb-brand)'};
          color: ${dark ? 'var(--cb-ink)' : 'var(--cb-on-brand)'};
          box-shadow: 0 8px 22px -10px rgba(0,0,0,.5);
        }
        @media (max-width: 760px) {
          ${s} .cb-cta__inner { flex-direction: column; align-items: center; text-align: center; }
          ${s} .cb-cta__actions { justify-content: center; width: 100%; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });
})();


