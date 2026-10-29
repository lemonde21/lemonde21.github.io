# lemonde21.github.io

My portfolio site, served by GitHub Pages at **https://lemonde21.github.io**.

Plain HTML, CSS and a little JavaScript: no build step. Edit a page, push to `main`, and GitHub Pages updates the site within a minute or two.

- `index.html`: landing page (bio + projects carousel)
- `micselect/index.html`: the MicSelect project page
- `style.css`: the dark Aero theme shared by both pages (glass windows, glossy controls, dusk backdrop)
- `home.js`: the projects carousel
- `script.js`: project page extras (syntax colouring, tabs, the Settings/terminal preview, taskbar clock)
- `repo/`: my Sileo / APT repo (see below)

To add a project to the carousel, copy one `<article class="slide">` in `index.html` and change its text and link.

## Sileo repo

Source URL: **https://lemonde21.github.io/repo/**

- `repo/debs/`: the packages (`.deb` files)
- `repo/overrides`: extra fields Sileo shows (icon, banner, depiction links), one line per field
- `repo/depictions/<package id>/`: the package page, as `sileodepiction.json` (native Sileo) and `index.html` (Zebra and browsers)
- `repo/update.sh`: rebuilds `Packages*` and `Release`

To publish a new package or version:

```sh
cp path/to/new.deb repo/debs/
./repo/update.sh          # needs dpkg: brew install dpkg
git add -A && git commit -m "Repo: add ..." && git push
```

UI inspired by the work of [@aidaknx](https://x.com/aidaknx) on X.
