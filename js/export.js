/* ============================================================================
   Export — assembles instances into paste-ready code, and builds the
   preview document that the sandboxed iframe renders.
   ========================================================================== */
CB.Export = (function () {
  'use strict';

  var BANNER = '<!-- Built with Componentry — self-contained, no dependencies -->';

  /* ------------------------------------------------------------ assemble */

  function parts(instances, tokens) {
    var html = [], css = [], js = [];
    instances.forEach(function (inst) {
      var out = CB.build(inst, tokens);
      if (out.html) html.push(out.html);
      if (out.css) css.push('/* ' + (CB.get(inst.type) || {}).name + ' */\n' + out.css);
      if (out.js) js.push(out.js);
    });

    var imports = '';
    if (tokens.fontImport && /^https?:\/\//i.test(tokens.fontImport.trim())) {
      imports = '@import url("' + tokens.fontImport.trim().replace(/"/g, '') + '");\n\n';
    }

    return {
      html: html.join('\n\n'),
      css: imports + css.join('\n\n'),
      js: js.join('\n\n')
    };
  }

  /* -------------------------------------------------------------- minify */
  /* Deliberately conservative: strips comments and collapses runs of
     whitespace, but never touches the inside of a quoted string. */

  function minifyCss(css) {
    var out = '', i = 0, n = css.length, quote = null;
    while (i < n) {
      var ch = css[i];
      if (quote) {
        out += ch;
        if (ch === '\\') { out += css[i + 1] || ''; i += 2; continue; }
        if (ch === quote) quote = null;
        i++; continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; out += ch; i++; continue; }
      if (ch === '/' && css[i + 1] === '*') {
        var end = css.indexOf('*/', i + 2);
        i = end === -1 ? n : end + 2;
        continue;
      }
      if (/\s/.test(ch)) {
        var j = i;
        while (j < n && /\s/.test(css[j])) j++;
        var prev = out[out.length - 1], next = css[j];
        if (prev && next && !/[{};:,>~+()]/.test(prev) && !/[{};:,>~+()]/.test(next)) out += ' ';
        i = j; continue;
      }
      out += ch; i++;
    }
    return out.replace(/;}/g, '}').trim();
  }

  /* @import is only honoured as the very first rule in a stylesheet. Anything
     that wraps the CSS — the preview chrome, the full-page reset — has to be
     emitted after it, so pull the imports out and re-emit them at the top. */
  function hoistImports(css) {
    var found = [];
    var body = String(css || '').replace(/@import\s+url\([^)]*\)\s*;/gi, function (m) {
      found.push(m);
      return '';
    });
    return { imports: found.join('\n'), body: body.replace(/^\s*\n+/, '') };
  }

  function minifyJs(js) {
    // Only safe, line-level tidying — never re-writes tokens or renames anything.
    return js.split('\n')
      .map(function (l) { return l.replace(/^\s+/, ''); })
      .filter(function (l) { return l && l.indexOf('/*') !== 0 && l.indexOf('*') !== 0 && l.indexOf('//') !== 0; })
      .join('\n');
  }

  /* ------------------------------------------------------------- formats */

  function embed(p, opts) {
    opts = opts || {};
    var css = opts.minify ? minifyCss(p.css) : p.css;
    var js = opts.minify ? minifyJs(p.js) : p.js;
    var out = [];
    if (!opts.minify) out.push(BANNER);
    out.push(p.html);
    if (css.trim()) out.push('<style>\n' + css + '\n</style>');
    if (js.trim()) out.push('<script>\n' + js + '\n<\/script>');
    return out.join('\n\n');
  }

  function fullDocument(p, opts) {
    opts = opts || {};
    var title = opts.title || 'Componentry export';
    var css = opts.minify ? minifyCss(p.css) : p.css;
    var js = opts.minify ? minifyJs(p.js) : p.js;
    var split = hoistImports(css);
    return [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      '  <title>' + CB.esc(title) + '</title>',
      '  <style>',
      split.imports ? CB.indent(split.imports, 4) : '',
      '    html, body { margin: 0; padding: 0; }',
      CB.indent(split.body, 4),
      '  </style>',
      '</head>',
      '<body>',
      CB.indent(p.html, 2),
      '  <script>',
      CB.indent(js, 4),
      '  <\/script>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  /* ------------------------------------------------------------- preview */

  function previewDoc(instances, tokens, opts) {
    opts = opts || {};
    var html = [], css = [], js = [];

    var names = opts.names || {};
    instances.forEach(function (inst) {
      var out = CB.build(inst, tokens);
      // A plain block wrapper: layout-neutral, but gives the preview something
      // to hit-test against so clicking a block selects it in the editor.
      html.push('<div class="cb-pv" data-uid="' + CB.attr(inst.uid) + '"' +
        ' data-name="' + CB.attr(names[inst.uid] || '') + '"' +
        (inst.uid === opts.selected ? ' data-selected' : '') + '>' + out.html + '</div>');
      if (out.css) css.push(out.css);
      if (out.js) js.push(out.js);
    });

    if (tokens.fontImport && /^https?:\/\//i.test(tokens.fontImport.trim())) {
      css.unshift('@import url("' + tokens.fontImport.trim().replace(/"/g, '') + '");');
    }

    var chrome = `
      html, body { margin: 0; padding: 0; }
      body {
        background: ${opts.canvas === 'dark' ? '#121110' : opts.canvas === 'grid' ? '#ffffff' : '#ffffff'};
        ${opts.canvas === 'grid' ? 'background-image: linear-gradient(#efeae4 1px, transparent 1px), linear-gradient(90deg, #efeae4 1px, transparent 1px); background-size: 24px 24px;' : ''}
        min-height: 100vh;
      }
      .cb-pv { position: relative; }
      ${opts.outline ? `
      .cb-pv::after {
        content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 99998;
        outline: 1px dashed rgba(150,105,76,.45); outline-offset: -1px;
        opacity: 0; transition: opacity .15s ease;
      }
      .cb-pv:hover::after { opacity: 1; }
      .cb-pv[data-selected]::after {
        opacity: 1; outline: 2px solid #96694c; outline-offset: -2px;
      }
      .cb-pv[data-selected]::before {
        content: attr(data-name); position: absolute; z-index: 99999;
        top: 0; left: 0; background: #96694c; color: #fff;
        font: 600 11px/1 ui-sans-serif, system-ui, sans-serif; letter-spacing: .04em;
        padding: 5px 8px; border-radius: 0 0 6px 0; pointer-events: none;
      }` : ''}
      .cb-empty {
        display: grid; place-items: center; min-height: 92vh; padding: 40px; text-align: center;
        font: 15px/1.7 ui-sans-serif, system-ui, sans-serif; color: #8b8078;
      }
      .cb-empty strong { display: block; font-size: 19px; color: #2b2520; margin-bottom: 8px; font-weight: 700; }`;

    var bridge = `
      document.addEventListener("click", function (e) {
        var t = e.target.closest ? e.target.closest(".cb-pv") : null;
        var link = e.target.closest && e.target.closest("a[href]");
        if (link) e.preventDefault();          /* never navigate away from the canvas */
        if (t) parent.postMessage({ cbSelect: t.getAttribute("data-uid") }, "*");
      }, true);

      window.addEventListener("message", function (e) {
        var d = e.data || {};
        if (d.cbScrollTo) {
          var n = document.querySelector('[data-uid="' + d.cbScrollTo + '"]');
          if (n) n.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if ("cbHighlight" in d) {
          Array.prototype.forEach.call(document.querySelectorAll(".cb-pv"), function (n) {
            if (n.getAttribute("data-uid") === d.cbHighlight) n.setAttribute("data-selected", "");
            else n.removeAttribute("data-selected");
          });
        }
        if (typeof d.cbRestore === "number") window.scrollTo(0, d.cbRestore);
      });

      /* Report scroll so the editor can hold position across preview rebuilds. */
      var lastY = -1;
      window.addEventListener("scroll", function () {
        var y = window.scrollY || document.documentElement.scrollTop;
        if (Math.abs(y - lastY) < 2) return;
        lastY = y;
        parent.postMessage({ cbScroll: y }, "*");
      }, { passive: true });`;

    var body = html.length ? html.join('\n') :
      '<div class="cb-empty"><div><strong>Nothing on the canvas yet</strong>' +
      'Pick a component from the library on the left to get started.</div></div>';

    return [
      '<!doctype html><html lang="en"><head><meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<style>' + (function () {
        var split = hoistImports(css.join('\n'));
        return (split.imports ? split.imports + '\n' : '') + chrome + '\n' + split.body;
      })() + '</style>',
      '</head><body>',
      body,
      '<script>' + js.join('\n') + '\n' + bridge + '<\/script>',
      '</body></html>'
    ].join('\n');
  }

  /* --------------------------------------------------------------- notes */

  var PLATFORMS = {
    generic: {
      name: 'Generic HTML embed',
      format: 'embed',
      note: 'Works anywhere you can paste raw HTML. Markup, styles and script travel together in one block.'
    },
    wordpress: {
      name: 'WordPress',
      format: 'embed',
      note: 'Add a <strong>Custom HTML</strong> block and paste. Avoid the Classic editor’s Visual tab — it strips &lt;script&gt; tags. If your security plugin blocks inline script, use the separate tabs and enqueue the JS instead.'
    },
    squarespace: {
      name: 'Squarespace',
      format: 'embed',
      note: 'Drop in a <strong>Code Block</strong> and paste. Code blocks do not execute script while you are still in edit mode — save and preview the live page to see behaviour.'
    },
    webflow: {
      name: 'Webflow',
      format: 'separate',
      note: 'Use an <strong>Embed</strong> element for the HTML. Webflow caps a single embed at 50 kB, so put the CSS in Page Settings → Custom Code (head) and the JS before &lt;/body&gt;.'
    },
    wix: {
      name: 'Wix',
      format: 'document',
      note: 'Wix runs HTML embeds inside a sandboxed iframe, so paste the <strong>full document</strong>. The block cannot resize itself — set the element height manually to match.'
    },
    shopify: {
      name: 'Shopify',
      format: 'embed',
      note: 'Paste into a <strong>Custom Liquid</strong> section, or save as a section file in your theme. Wrap any literal <code>{{</code> or <code>{%</code> in <code>{% raw %}</code> — none of these exports contain them.'
    },
    hubspot: {
      name: 'HubSpot',
      format: 'separate',
      note: 'Use a <strong>Rich text / HTML</strong> module for the markup, then add CSS and JS in the template’s linked stylesheet and JS file for caching.'
    }
  };

  return {
    parts: parts,
    embed: embed,
    fullDocument: fullDocument,
    previewDoc: previewDoc,
    minifyCss: minifyCss,
    minifyJs: minifyJs,
    PLATFORMS: PLATFORMS
  };
})();


