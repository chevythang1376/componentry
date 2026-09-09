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
#
# The suffix is worked out rather than remembered. Passing one still works —
# ./bump.sh c — but the third bump of a day no longer needs you to know it is
# the third: a bare run that lands on the id already in version.txt advances
# the letter instead of writing the same date back and quietly moving the
# build *backwards*, which is what it used to do.
set -e
cd "$(dirname "$0")"

DATE="$(date +%Y%m%d)"
PREV="$(tr -d '\r\n' < version.txt 2>/dev/null || true)"

if [ -n "${1:-}" ]; then
  V="$DATE$1"
else
  V="$DATE"
  case "$PREV" in
    "$DATE")  V="${DATE}b" ;;
    "$DATE"?) V="$DATE$(printf '%s' "${PREV#$DATE}" | tr 'a-y' 'b-z')" ;;
  esac
fi

# Going backwards is the failure worth refusing outright. freshness.js compares
# for difference rather than order, so a regressed id still reloads everyone —
# it just leaves version.txt describing an older build than the one deployed,
# and the next person to debug a stale page has a lie to work from.
if [ -n "$PREV" ]; then
  if [ "$V" = "$PREV" ]; then
    echo "bump.sh: '$V' is already the current build — pass a suffix, e.g. ./bump.sh c" >&2
    exit 1
  fi
  if [ "$(printf '%s\n%s\n' "$V" "$PREV" | sort | head -1)" = "$V" ]; then
    echo "bump.sh: '$V' would be older than the current '$PREV'" >&2
    exit 1
  fi
fi

sed -i -E "s#(href=\"css/[^\"?]+\.css)(\?v=[^\"]*)?\"#\1?v=$V\"#; s#(src=\"js/[^\"?]+\.js)(\?v=[^\"]*)?\"#\1?v=$V\"#g" index.html
printf '%s\n' "$V" > version.txt

# A mismatch here would make every visitor bounce through one extra reload.
baked="$(grep -o 'js/core\.js?v=[^"]*' index.html | head -1 | sed 's/.*?v=//')"
if [ "$baked" != "$V" ]; then
  echo "bump.sh: index.html says '$baked' but version.txt says '$V'" >&2
  exit 1
fi
echo "assets and version.txt now at $V"
