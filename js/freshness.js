/* ============================================================================
   Componentry — build freshness

   GitHub Pages serves every file with `Cache-Control: max-age=600` and offers
   no way to change that: there is no _headers file, no .htaccess, no config.
   So for up to ten minutes after a deploy a returning browser can still hold
   the previous index.html — and because the asset URLs are baked into that
   HTML with ?v=, it goes on loading the previous js/ too. The whole app is a
   build behind and looks like a failed deploy.

   bump.sh writes the build id onto the asset URLs and into version.txt.
   version.txt is fetched with `cache: 'no-store'`, so it always comes from the
   network; if it disagrees with the id baked into this document, this document
   is the stale one. Reloading through a URL the cache has no entry for is what
   actually fetches fresh HTML — a plain location.reload() can be answered from
   the very same cache entry.
   ========================================================================== */
window.CBFresh = (function () {
  'use strict';

  /* Kept pure and separate from the fetch so the decision can be tested
     without navigating anything. Returns the search string to move to, or
     null to stay put. */
  function decide(here, live, search) {
    if (!here || !live || live === here) return null;
    var q = new URLSearchParams(search || '');
    // One attempt per build. If the reload comes back still claiming the old
    // id — a half-propagated deploy, a proxy of its own — stop rather than
    // bounce the page forever.
    if (q.get('b') === live) return null;
    q.set('b', live);
    return '?' + q.toString();
  }

  /* The id this document was built with, read from an asset URL rather than a
     constant so there is nothing for bump.sh to keep in sync. */
  function built(doc) {
    var el = (doc || document).querySelector('link[href*="css/app.css"], script[src*="js/core.js"]');
    if (!el) return null;
    var url = el.getAttribute('href') || el.getAttribute('src') || '';
    return (url.match(/[?&]v=([^&"']+)/) || [])[1] || null;
  }

  function check(opts) {
    opts = opts || {};
    var win = opts.window || window;
    var url = opts.url || 'version.txt';
    var loc = opts.location || win.location;
    if (!/^https?:$/.test(loc.protocol) || typeof win.fetch !== 'function') return;

    var here = built(opts.document);
    if (!here) return;

    var t0 = Date.now();
    return win.fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (txt) {
        var move = decide(here, txt && txt.trim(), loc.search);
        if (!move) return;
        // Past a few seconds someone may already be working. The ten-minute
        // cache heals it on its own; pulling the page out from under them is
        // worse than being one build behind for a little longer.
        if (Date.now() - t0 > 5000) return;
        loc.replace(loc.pathname + move + loc.hash);
      })
      .catch(function () { /* offline, or no version.txt — leave the app alone */ });
  }

  return { decide: decide, built: built, check: check };
})();
