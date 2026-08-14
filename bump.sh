#!/bin/sh
# Bump the cache-busting version on index.html's assets.
#
# There is no build step here on purpose, so nothing rewrites these URLs
# automatically. Without a version on them a browser will happily keep serving
# yesterday's js/*.js after a deploy, and the page looks unchanged — which is
# exactly what "hard-reload with Ctrl+Shift+R" in the README was papering over.
#
# Run this whenever anything under js/ or css/ changes, before committing.
# Same day twice? Pass a suffix:  ./bump.sh b   ->  ?v=20260814b
set -e
cd "$(dirname "$0")"
V="$(date +%Y%m%d)${1:-}"
sed -i -E "s#(href=\"css/[^\"?]+\.css)(\?v=[^\"]*)?\"#\1?v=$V\"#; s#(src=\"js/[^\"?]+\.js)(\?v=[^\"]*)?\"#\1?v=$V\"#g" index.html
echo "assets now at ?v=$V"
