#!/usr/bin/env bash
# Rebuilds the Sileo/APT index for this repo.
#   1. Put .deb files in debs/
#   2. Run ./update.sh (needs dpkg-scanpackages: brew install dpkg)
#   3. Commit and push; GitHub Pages serves the result.
set -euo pipefail
cd "$(dirname "$0")"

# dpkg-scanpackages reads "#" lines as data, so pass it the overrides without comments.
grep -v '^#' overrides > .overrides.tmp
dpkg-scanpackages --multiversion --extra-override .overrides.tmp debs /dev/null > Packages 2>/dev/null
rm -f .overrides.tmp
# dpkg-scanpackages normalises field names; restore the spelling Sileo documents.
sed -i.bak -e "s/^Sileodepiction:/SileoDepiction:/" Packages && rm -f Packages.bak

gzip  -9 -n -c Packages > Packages.gz
bzip2 -9    -c Packages > Packages.bz2
if command -v xz >/dev/null; then xz -9 -c Packages > Packages.xz; else rm -f Packages.xz; fi

size() { wc -c < "$1" | tr -d ' '; }
md5() { if command -v md5sum >/dev/null; then md5sum "$1" | cut -d' ' -f1; else md5 -q "$1"; fi; }
sha256() { shasum -a 256 "$1" | cut -d' ' -f1; }
indexes=(Packages Packages.gz Packages.bz2)
[[ -f Packages.xz ]] && indexes+=(Packages.xz)

{
  cat <<RELEASE
Origin: lemonde21
Label: lemonde21
Suite: stable
Version: 1.0
Codename: ios
Architectures: iphoneos-arm iphoneos-arm64
Components: main
Description: Rootless tweaks for iOS 15 by lemonde21
Date: $(LC_ALL=C date -u '+%a, %d %b %Y %H:%M:%S UTC')
RELEASE
  echo "MD5Sum:"
  for f in "${indexes[@]}"; do echo " $(md5 "$f") $(size "$f") $f"; done
  echo "SHA256:"
  for f in "${indexes[@]}"; do echo " $(sha256 "$f") $(size "$f") $f"; done
} > Release

echo "Indexed $(grep -c '^Package:' Packages) package(s)."
