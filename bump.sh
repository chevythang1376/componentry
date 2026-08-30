#!/bin/sh
# Bump the cache-busting version on index.html's assets.
#
# There is no build step here on purpose, so nothing rewrites these URLs
# automatically. Without a version on them a browser will happily keep serving
# yesterday's js/*.js after a deploy, and the page looks unchanged — which is
# exactly what "hard-reload with Ctrl+Shift+R" in the README was papering over.
#
# The same id goes into version.txt, which js/freshness.js fetches with
# no-store on load. That is what catches the other half of the problem: a
# browser still holding the previous index.html, which points at the previous
# asset URLs and so stays a whole build behind. The two must be written
# together or the check compares against the wrong thing, so they are written
# here rather than left to be remembered.
#
# Run this whenever anything under js/ or css/ changes, before committing.
# Same day twice? Pass a suffix:  ./bump.sh b   ->  ?v=20260814b
set -e
cd "$(dirname "$0")"
V="$(date +%Y%m%d)${1:-}"
sed -i -E "s#(href=\"css/[^\"?]+\.css)(\?v=[^\"]*)?\"#\1?v=$V\"#; s#(src=\"js/[^\"?]+\.js)(\?v=[^\"]*)?\"#\1?v=$V\"#g" index.html
printf '%s\n' "$V" > version.txt

# A mismatch here would make every visitor bounce through one extra reload.
baked="$(grep -o 'js/core\.js?v=[^"]*' index.html | head -1 | sed 's/.*?v=//')"
if [ "$baked" != "$V" ]; then
  echo "bump.sh: index.html says '$baked' but version.txt says '$V'" >&2
  exit 1
fi
echo "assets and version.txt now at $V"
