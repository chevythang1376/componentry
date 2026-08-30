/* ============================================================================
   Preflight — checks the project you actually built, not the defaults.

   The test suite under test/ has always judged components at their default
   settings. That misses the failures people actually hit: a brand colour that
   leaves button labels unreadable, a photo pasted in at 4 MB, a page that has
   quietly grown past the embed cap of the platform it is headed for.

   Everything here answers one question — if this were pasted right now, what
   would go wrong? Findings are ordered worst first and each one names the block
   it came from, because "something is low contrast" is not actionable.
   ========================================================================== */
CB.Preflight = (function () {
  'use strict';

  /* ------------------------------------------------------------- colour */

  function parse(c) {
    var m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  }
  function lum(c) {
    var v = [c.r, c.g, c.b].map(function (x) {
      x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function ratio(f, b) {
    var l1 = lum(f), l2 = lum(b);
    if (l2 > l1) { var t = l1; l1 = l2; l2 = t; }
    return (l1 + 0.05) / (l2 + 0.05);
  }

  /* The painted backdrop behind an element, or null when it cannot be known.
     Returning null matters: guessing white behind text that sits on a photo is
     how a checker invents failures nobody can act on.

     Two ways it becomes unknowable. A background-image anywhere up the chain is
     the obvious one. The subtler one is positioning: a caption laid over a
     photo is absolutely positioned, and the thing actually behind it is an
     <img> sibling, which walking ancestors never sees — the slider's overlay
     labels and the diagram's hotspots both read as white-on-white that way.
     Anything that has left normal flow before we reach an opaque colour is
     therefore treated as unresolvable rather than guessed at.

     This keeps the failure that matters. A black title in a black box is
     ordinary flowed text inside a block with its own background, and that is
     still judged. */
  function backdrop(el, root, win) {
    var n = el;
    while (n && n !== root.parentElement) {
      var cs = win.getComputedStyle(n);
      // An image paints over whatever colour is under it, so nothing below
      // this point can be known.
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      // An opaque colour settles it, wherever the element sits. Checked before
      // position on purpose: a sticky pane or a positioned card that paints its
      // own background is perfectly knowable, and bailing on it skipped half the
      // text in the library for no reason.
      var c = parse(cs.backgroundColor);
      if (c && c.a > 0.95) return c;
      // Displaced from the flow with nothing opaque behind it: whatever it
      // overlaps is a sibling we cannot see by walking ancestors.
      if (displaced(cs)) return null;
      n = n.parentElement;
    }
    return null;
  }

  /* --------------------------------------------------------------- audit */

  function mount(html, css, width) {
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:absolute;left:-99999px;top:0;border:0;width:' + width + 'px;height:900px;';
    document.body.appendChild(f);
    var d = f.contentDocument;
    d.open();
    d.write('<!doctype html><html><head><style>html,body{margin:0}' + css +
            '</style></head><body>' + html + '</body></html>');
    d.close();
    return f;
  }

  /* Nothing that isn't actually laid out. getComputedStyle reports an element's
     own display, so a closed <dialog>'s children look visible when only their
     ancestor is display:none — the gallery lightbox reported three phantom
     failures before this. Client rects settle the whole ancestor chain at once. */
  function visible(el, win) {
    var rects = el.getClientRects();
    if (!rects.length) return false;
    // Screen-reader-only text is a clipped 1x1 box. It is on the page and has a
    // colour, but there is nothing visual about it to judge.
    if (rects[0].width <= 1 || rects[0].height <= 1) return false;
    var cs = win.getComputedStyle(el);
    return cs.visibility !== 'hidden' && +cs.opacity >= 0.1;
  }

  /* Has this element actually left the place the flow put it? position:relative
     with no offsets occupies its normal box and overlaps nothing, so treating it
     as unknowable threw away every timeline milestone and marquee logo — both
     of which sit on a perfectly ordinary opaque section. */
  function displaced(cs) {
    if (cs.position === 'absolute' || cs.position === 'fixed') return true;
    if (cs.position === 'static') return false;
    if (cs.transform && cs.transform !== 'none') return true;
    return ['top', 'left', 'right', 'bottom'].some(function (side) {
      var v = cs[side];
      return v && v !== 'auto' && parseFloat(v) !== 0;
    });
  }

  /* One finding per block, not one per element. A bad palette fails every
     heading and paragraph in a block at once; thirteen identical rows say
     nothing the first one didn't. */
  function textContrast(frame, root, label, out) {
    var win = frame.contentWindow;
    var worst = null, count = 0;

    Array.prototype.forEach.call(root.querySelectorAll('*'), function (el) {
      var text = Array.prototype.filter.call(el.childNodes, function (n) {
        return n.nodeType === 3 && n.textContent.trim();
      }).map(function (n) { return n.textContent.trim(); }).join(' ');
      if (!text) return;
      if (!visible(el, win)) return;

      var cs = win.getComputedStyle(el);
      var fg = parse(cs.color);
      if (!fg || fg.a < 0.1) return;
      var bg = backdrop(el, root, win);
      if (!bg) return;                        // over imagery — not judgeable

      var r = ratio(fg, bg);
      // 3:1 is the WCAG large-text bar; below it nothing is readable at any size.
      if (r >= 3) return;
      count++;
      if (!worst || r < worst.r) worst = { r: r, text: text };
    });

    if (!worst) return;
    out.push({
      level: worst.r < 2 ? 'error' : 'warn',
      block: label,
      title: (worst.r < 2 ? 'Text is unreadable' : 'Text is hard to read') +
             (count > 1 ? ' (' + count + ' places)' : ''),
      detail: '“' + worst.text.slice(0, 42) + (worst.text.length > 42 ? '…' : '') + '” sits at ' +
              worst.r.toFixed(1) + ':1 against its background. Aim for 4.5:1.',
      fix: 'Adjust this block’s colours, or the palette in Design tokens.'
    });
  }

  /* ---------------------------------------------------------------- run */

  function run(instances, tokens, opts) {
    opts = opts || {};
    var out = [];
    if (!instances.length) return out;

    var parts = CB.Export.parts(instances, tokens, { shared: opts.shared !== false });
    var code = CB.Export.embed(parts, { minify: true });

    /* ---- size against the target's cap ---- */
    var plat = (CB.Export.PLATFORMS[opts.platform] || {});
    if (plat.cap && code.length > plat.cap) {
      out.push({
        level: 'error',
        block: null,
        title: 'Over ' + plat.name + '’s embed limit',
        detail: 'This export is ' + (code.length / 1024).toFixed(0) + ' kB and ' +
                plat.name + ' caps a single embed at ' + Math.round(plat.cap / 1024) + ' kB.',
        fix: 'Use Split files and put the CSS in your site’s head, or move some blocks to a second embed.'
      });
    }

    /* ---- per block ---- */
    instances.forEach(function (inst) {
      var def = CB.get(inst.type);
      if (!def) return;
      var name = def.name;
      var built = CB.build(inst, tokens);

      // Heavy embedded images. These live in the export and in localStorage,
      // so they cost twice and can quietly break autosave.
      (function () {
        var big = 0, worst = 0;
        JSON.stringify(inst.props).replace(/data:[^"\\]+/g, function (u) {
          if (u.length > 180 * 1024) { big++; worst = Math.max(worst, u.length); }
          return '';
        });
        if (big) out.push({
          level: 'warn',
          block: name,
          title: big === 1 ? 'A very large embedded image' : big + ' very large embedded images',
          detail: 'The biggest is about ' + Math.round(worst / 1024) + ' kB, carried inline in the export.',
          fix: 'Resize before uploading, or point the image field at a URL on your own site instead.'
        });
      })();

      // Alt text the schema expects and nobody filled in.
      (function () {
        var missing = 0;
        function check(fields, obj) {
          // Which field in this object holds the image the alt describes.
          var imgKey = null;
          (fields || []).forEach(function (f) { if (f.t === 'image') imgKey = f.k; });
          (fields || []).forEach(function (f) {
            if (f.t === 'list') {
              (obj[f.k] || []).forEach(function (item) { check(f.fields, item); });
            } else if (f.k === 'alt' && !String(obj[f.k] || '').trim()) {
              // A placeholder nobody has replaced is not a missing description;
              // there is no image yet to describe. Warning about all 22 of them
              // on a fresh project buried the two findings that were real.
              if (imgKey && CB.isPlaceholder(obj[imgKey])) return;
              missing++;
            }
          });
        }
        check(def.props, Object.assign({}, CB.defaults(def), inst.props));
        if (missing) out.push({
          level: 'warn',
          block: name,
          title: missing === 1 ? 'An image has no alt text' : missing + ' images have no alt text',
          detail: 'Screen readers and search engines get nothing from these images.',
          fix: 'Fill in Alt text, or leave it blank deliberately if the image is purely decorative.'
        });
      })();

      // A block with nothing in it renders as dead space.
      (function () {
        (def.props || []).forEach(function (f) {
          if (f.t !== 'list') return;
          var items = (inst.props && inst.props[f.k]) || CB.defaults(def)[f.k] || [];
          if (!items.length) out.push({
            level: 'error',
            block: name,
            title: 'Nothing in ' + String(f.label || f.k).toLowerCase(),
            detail: 'This block has no items, so it exports as an empty band.',
            fix: 'Add at least one, or remove the block.'
          });
        });
      })();

      // Contrast, judged on the real thing rather than the palette in theory.
      var frame = mount(built.html, built.css, opts.width || 1280);
      var root = frame.contentDocument.body.firstElementChild;
      if (root) textContrast(frame, root, name, out);
      frame.remove();
    });

    /* ---- behaviour that depends on scripts surviving ---- */
    var jsBlocks = instances.filter(function (i) {
      var b = CB.build(i, tokens);
      return b.js && b.js.trim();
    }).map(function (i) { return (CB.get(i.type) || {}).name; });

    if (jsBlocks.length) {
      var uniq = jsBlocks.filter(function (n, i) { return jsBlocks.indexOf(n) === i; });
      out.push({
        level: 'info',
        block: null,
        title: uniq.length + (uniq.length === 1 ? ' block needs' : ' blocks need') + ' JavaScript to move',
        detail: uniq.join(', ') + '. Rich-text fields strip <script> — that is their job — ' +
                'and these still render, they just stop responding.',
        fix: 'Paste into a code or embed block, never a rich-text area.'
      });
    }

    var order = { error: 0, warn: 1, info: 2 };
    return out.sort(function (a, b) { return order[a.level] - order[b.level]; });
  }

  /* backdrop/parse/ratio are shared with test/degrade.html. That harness used to
     carry its own copy which guessed white when it ran out of ancestors, and
     every piece of text over an image came back as a failure — 79 of them,
     none actionable. One implementation, so the two cannot drift again. */
  return { run: run, ratio: ratio, backdrop: backdrop, parse: parse, visible: visible };
})();
