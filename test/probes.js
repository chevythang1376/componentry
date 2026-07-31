/* ============================================================================
   Functional probes — one per component.

   A probe receives the mounted root element and asserts the component actually
   *works*, not merely that it rendered. Shared by the smoke test and the
   WYSIWYG conformance run so both judge "working" by the same standard.
   ========================================================================== */
window.CBProbe = (function () {
  'use strict';

  var probes = {};
  function register(id, fn) { probes[id] = fn; }

  function click(el) {
    if (!el) return false;
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }
  function key(el, k) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  }
  function q(root, sel) { return root.querySelector(sel); }
  function qa(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  /* Resolve once an element's scrollLeft has held steady for two frames, or
     after a hard cap. Keeps assertions off the clock of a CSS animation. */
  function settle(el, cap) {
    cap = cap || 1500;
    return new Promise(function (res) {
      var last = el.scrollLeft, stable = 0, t0 = Date.now();
      (function tick() {
        var now = el.scrollLeft;
        stable = (Math.abs(now - last) < 0.5) ? stable + 1 : 0;
        last = now;
        if (stable >= 3 || Date.now() - t0 > cap) return res(now);
        setTimeout(tick, 50);
      })();
    });
  }

  /* ------------------------------------------------------------ heroes */

  register('parallax-banner', function (root, t) {
    t.ok('background layer present', !!q(root, '.cb-px__bg img'));
    t.ok('headline rendered', !!q(root, '.cb-px__title'));
    var bg = q(root, '.cb-px__bg');
    window.dispatchEvent(new Event('scroll'));
    t.ok('scroll handler bound', root.hasAttribute('data-cb-ready'));
  });

  register('video-hero', function (root, t) {
    t.ok('poster or video present', !!q(root, '.cb-vh__media img, .cb-vh__media video'));
    t.ok('headline rendered', !!q(root, '.cb-vh__title'));
  });

  register('split-hero', function (root, t) {
    t.ok('image present', !!q(root, '.cb-sh__media img'));
    t.ok('bullets rendered', qa(root, '.cb-sh__list li').length > 0);
    t.ok('two-column grid', getComputedStyle(q(root, '.cb-sh__grid')).display === 'grid');
  });

  register('cta-banner', function (root, t) {
    t.ok('headline rendered', !!q(root, '.cb-cta__title'));
    t.ok('buttons present', qa(root, '.cb-cta__actions a').length > 0);
  });

  /* ----------------------------------------------------------- content */

  register('card-grid', function (root, t) {
    var cards = qa(root, '.cb-cg__card');
    t.ok('cards rendered', cards.length >= 3, cards.length + ' cards');
    t.ok('grid layout applied', getComputedStyle(q(root, '.cb-cg__grid')).display === 'grid');
    t.ok('card links present', qa(root, '.cb-cg__link').length > 0);
  });

  register('feature-grid', function (root, t) {
    t.ok('items rendered', qa(root, '.cb-fg__item').length >= 3);
    t.ok('grid layout applied', getComputedStyle(q(root, '.cb-fg__grid')).display === 'grid');
  });

  register('stats-counter', function (root, t) {
    var vals = qa(root, '.cb-st__val');
    t.ok('stats rendered', vals.length >= 2);
    // The DOM always carries the real figure, so it reads correctly with JS off.
    t.ok('final value present in markup', vals[0].getAttribute('data-to') !== null);
  });

  register('timeline', function (root, t) {
    t.ok('milestones rendered', qa(root, '.cb-tl__item').length >= 3);
    t.ok('rail drawn', !!q(root, '.cb-tl__list'));
  });

  register('pricing', function (root, t) {
    var amounts = qa(root, '.cb-pr__amount');
    var switches = qa(root, '.cb-pr__sw');
    t.ok('plans rendered', qa(root, '.cb-pr__plan').length >= 2);
    if (!switches.length) { t.skip('billing switch disabled'); return; }
    var before = amounts.map(function (a) { return a.textContent; }).join('/');
    click(switches[1]);
    var after = amounts.map(function (a) { return a.textContent; }).join('/');
    t.ok('billing switch changes prices', before !== after, before + ' -> ' + after);
    t.ok('switch reflects pressed state', switches[1].getAttribute('aria-pressed') === 'true');
  });

  /* ------------------------------------------------------- interactive */

  register('accordion', function (root, t) {
    var btns = qa(root, '.cb-acc__btn');
    t.ok('questions rendered', btns.length >= 2, btns.length + ' items');
    if (btns.length < 2) return;

    t.ok('button carries aria-expanded', btns[1].hasAttribute('aria-expanded'));
    t.ok('panel is a labelled region', !!q(root, '.cb-acc__panel[role="region"][aria-labelledby]'));

    click(btns[1]);
    t.ok('opens on click', btns[1].getAttribute('aria-expanded') === 'true');
    var panel = document.getElementById(btns[1].getAttribute('aria-controls'));
    t.ok('aria-controls resolves', !!panel);
    t.ok('open panel is not inert', panel && !panel.hasAttribute('inert'));
    t.ok('single-open closes the first', btns[0].getAttribute('aria-expanded') === 'false');

    btns[1].focus();
    key(btns[1], 'ArrowDown');
    t.ok('ArrowDown moves focus', document.activeElement === btns[2] || btns.length < 3);
  });

  register('tabs', function (root, t) {
    var tabs = qa(root, '[role="tab"]');
    var panes = qa(root, '[role="tabpanel"]');
    t.ok('tablist rendered', tabs.length >= 2 && panes.length === tabs.length);
    if (tabs.length < 2) return;

    click(tabs[1]);
    t.ok('click selects tab', tabs[1].getAttribute('aria-selected') === 'true');
    t.ok('other panels hidden', panes[0].hidden === true);
    t.ok('selected panel visible', panes[1].hidden === false);
    t.ok('roving tabindex', tabs[1].getAttribute('tabindex') === '0' && tabs[0].getAttribute('tabindex') === '-1');

    tabs[1].focus();
    key(q(root, '[role="tablist"]'), 'ArrowRight');
    t.ok('ArrowRight advances', tabs[2] ? tabs[2].getAttribute('aria-selected') === 'true'
                                        : tabs[0].getAttribute('aria-selected') === 'true');
  });

  register('carousel', function (root, t) {
    var track = q(root, '.cb-car__track');
    var slides = qa(root, '.cb-car__slide');
    t.ok('slides rendered', slides.length >= 3, slides.length + ' slides');
    t.ok('slide has APG role', slides[0].getAttribute('role') === 'group' &&
                               slides[0].getAttribute('aria-roledescription') === 'slide');
    t.ok('section marked as carousel', root.getAttribute('aria-roledescription') === 'carousel');
    if (!track) return;

    var before = track.scrollLeft;
    var scrollable = track.scrollWidth > track.clientWidth + 1;
    click(q(root, '.cb-car__next'));

    // Smooth scrolling is animated, so poll until the position stops changing
    // rather than sampling at a fixed delay — that raced the animation.
    return settle(track).then(function (after) {
      t.ok('next advances the track', after > before,
           before + ' -> ' + Math.round(after) +
           (scrollable ? '' : ' [track not scrollable: ' + track.scrollWidth + '/' + track.clientWidth + ']'));
      var dot = qa(root, '.cb-car__dot').findIndex(function (d) { return d.getAttribute('aria-current'); });
      t.ok('dots track position', dot > 0, 'dot index ' + dot);
    });
  });

  register('testimonials', function (root, t) {
    var items = qa(root, '.cb-tm__item');
    t.ok('quotes rendered', items.length >= 2);
    if (items.length < 2) return;
    function active() { return items.findIndex(function (i) { return i.hasAttribute('data-active'); }); }
    var before = active();
    click(q(root, '.cb-tm__next'));
    t.ok('next advances', active() !== before, before + ' -> ' + active());
    t.ok('hidden quotes are inert', items.filter(function (i) { return i.hasAttribute('inert'); }).length === items.length - 1);
  });

  /* ------------------------------------------------------------- media */

  register('before-after', function (root, t) {
    var range = q(root, '.cb-ba__range');
    var frame = q(root, '.cb-ba__frame');
    t.ok('two images present', qa(root, '.cb-ba__img').length === 2);
    t.ok('control is a real range input', range && range.type === 'range');
    if (!range) return;
    range.value = 25;
    range.dispatchEvent(new Event('input', { bubbles: true }));
    t.ok('dragging updates the reveal', frame.style.getPropertyValue('--cb-ba-pos') === '25%',
         frame.style.getPropertyValue('--cb-ba-pos'));
    t.ok('announces its value', /25/.test(range.getAttribute('aria-valuetext') || ''));
  });

  register('gallery', function (root, t) {
    var tiles = qa(root, '.cb-gl__tile');
    var box = q(root, '.cb-gl__box');
    t.ok('tiles rendered', tiles.length >= 4, tiles.length + ' tiles');
    if (!box) { t.skip('lightbox disabled'); return; }
    t.ok('lightbox is a native dialog', box.tagName === 'DIALOG');
    click(tiles[0]);
    t.ok('opens on tile click', box.hasAttribute('open'));
    t.ok('image loaded into viewer', (q(root, '.cb-gl__boxImg') || {}).src ? true : false);
    click(q(root, '.cb-gl__navNext'));
    t.ok('next image advances counter', /2\s*\/\s*\d+/.test(q(root, '.cb-gl__count').textContent));
    click(q(root, '.cb-gl__close'));
    t.ok('closes', !box.hasAttribute('open'));
  });

  register('logo-marquee', function (root, t) {
    var track = q(root, '.cb-mq__track');
    t.ok('logos rendered', qa(root, '.cb-mq__item').length >= 6);
    t.ok('duplicate track for seamless loop', qa(root, '.cb-mq__row').length === 2);
    t.ok('clone hidden from screen readers', qa(root, '.cb-mq__row')[1].getAttribute('aria-hidden') === 'true');
    t.ok('animation applied', track && getComputedStyle(track).animationName !== 'none');
  });

  register('countdown', function (root, t) {
    var d = q(root, '[data-unit="d"]');
    t.ok('clock rendered', !!d);
    t.ok('has timer role', q(root, '.cb-cd__clock').getAttribute('role') === 'timer');
    t.ok('digits populated', d && d.textContent !== '--', d && d.textContent);
  });

  register('video-embed', function (root, t) {
    var frame = q(root, '.cb-ve__frame');
    t.ok('poster shown, no iframe yet', !!q(root, '.cb-ve__poster') && !q(root, '.cb-ve__frame iframe'));
    t.ok('play control present', !!q(root, '.cb-ve__play'));
    click(q(root, '.cb-ve__play'));
    var iframe = q(root, '.cb-ve__frame iframe');
    t.ok('click loads the player', !!iframe);
    t.ok('player iframe is titled', iframe && !!iframe.title);
  });

  /* ----------------------------------------------------- modern layout */
  /* Both blocks are CSS-only, so "working" means the layout resolved — there
     is no behaviour to click. That is the point: they keep working on the
     paths where <script> is stripped. */

  register('bento-grid', function (root, t) {
    var tiles = qa(root, '.cb-bn__tile');
    var grid = q(root, '.cb-bn__grid');
    t.ok('tiles rendered', tiles.length >= 4, tiles.length + ' tiles');
    t.ok('grid layout applied', grid && getComputedStyle(grid).display === 'grid');

    var wide = tiles.filter(function (x) { return x.dataset.size === '2x1' || x.dataset.size === '2x2'; })[0];
    if (wide) {
      t.ok('wide tiles span two columns',
           /span 2/.test(getComputedStyle(wide).gridColumnStart) ||
           getComputedStyle(wide).gridColumnEnd === 'span 2',
           getComputedStyle(wide).gridColumn);
    } else { t.skip('no multi-column tiles configured'); }

    var dark = q(root, '.cb-bn__tile[data-tone="dark"] .cb-bn__title');
    if (dark) {
      var c = getComputedStyle(dark).color;
      t.ok('dark tile keeps light text', c === 'rgb(255, 255, 255)', c);
    } else { t.skip('no dark tile configured'); }

    t.ok('ships no JavaScript', !root.hasAttribute('data-cb-ready'));
  });

  register('sticky-stack', function (root, t) {
    var items = qa(root, '.cb-stk__item');
    var cards = qa(root, '.cb-stk__card');
    t.ok('cards rendered', items.length >= 2, items.length + ' cards');
    t.ok('cards are sticky', items[0] && getComputedStyle(items[0]).position === 'sticky',
         items[0] && getComputedStyle(items[0]).position);

    // Each card pins a little lower than the one before it.
    if (items.length >= 2) {
      var a = parseFloat(getComputedStyle(items[0]).top);
      var b = parseFloat(getComputedStyle(items[1]).top);
      t.ok('each card pins below the last', b > a, a + 'px -> ' + b + 'px');
    }

    var dark = q(root, '.cb-stk__card[data-tone="dark"] .cb-stk__title');
    if (dark) {
      var c = getComputedStyle(dark).color;
      t.ok('dark card keeps light text', c === 'rgb(255, 255, 255)', c);
    } else { t.skip('no dark card configured'); }

    t.ok('ships no JavaScript', !root.hasAttribute('data-cb-ready'));
  });

  /* -------------------------------------------------------------- run */

  function run(id, root) {
    var results = [];
    var t = {
      ok: function (name, pass, detail) { results.push({ name: name, pass: !!pass, detail: detail }); },
      skip: function (name) { results.push({ name: name, pass: true, skipped: true }); }
    };
    var probe = probes[id];
    if (!probe) return Promise.resolve([{ name: 'no probe defined', pass: false }]);

    var out;
    try { out = probe(root, t); }
    catch (e) { results.push({ name: 'probe threw', pass: false, detail: e.message }); }

    return Promise.resolve(out).then(function () { return results; });
  }

  return { register: register, run: run, has: function (id) { return !!probes[id]; } };
})();
