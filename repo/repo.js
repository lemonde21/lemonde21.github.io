// Repo page: copy button + package list read from this repo's own Packages index,
// so the page stays in sync whenever update.sh regenerates it.
(() => {
  const $ = (sel) => document.querySelector(sel);

  /* ---------- Copy source URL ---------- */

  const copyBtn = $("#copy-source");
  const urlField = $("#source-url");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(urlField.value);
    } catch {
      urlField.select();
      document.execCommand("copy");
    }
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
  });

  /* ---------- Packages ---------- */

  // Parse a Debian Packages file into objects, keeping multi-line field continuations.
  function parsePackages(text) {
    return text.split(/\n\s*\n/).map((stanza) => {
      const pkg = {};
      let key = null;
      for (const line of stanza.split("\n")) {
        if (/^\s/.test(line) && key) {
          pkg[key] += "\n" + line.trim();
        } else {
          const i = line.indexOf(":");
          if (i > 0) {
            key = line.slice(0, i).trim();
            pkg[key] = line.slice(i + 1).trim();
          }
        }
      }
      return pkg;
    }).filter((p) => p.Package);
  }

  const newer = (a, b) => a.localeCompare(b, undefined, { numeric: true }) > 0;

  function latestOnly(pkgs) {
    const byId = new Map();
    for (const p of pkgs) {
      const seen = byId.get(p.Package);
      if (!seen || newer(p.Version, seen.Version)) byId.set(p.Package, p);
    }
    return [...byId.values()].sort((a, b) => (a.Name || a.Package).localeCompare(b.Name || b.Package));
  }

  const formatSize = (bytes) => {
    const n = Number(bytes);
    if (!n) return "";
    return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
  };

  function el(tag, attrs = {}, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderPackage(p) {
    const li = el("li", { class: "pkg" });

    const icon = el("img", { class: "pkg__icon", alt: "", width: "64", height: "64", loading: "lazy" });
    icon.src = p.Icon || "CydiaIcon.png";
    li.append(icon);

    const main = el("div", { class: "pkg__main" });
    const top = el("div", { class: "pkg__top" });
    top.append(el("h2", { class: "pkg__name" }, p.Name || p.Package));
    top.append(el("span", { class: "pkg__ver" }, p.Version));
    main.append(top);
    main.append(el("p", { class: "pkg__desc" }, (p.Description || "").split("\n")[0]));
    const meta = [p.Section, p.Architecture, formatSize(p.Size)].filter(Boolean).join(" · ");
    main.append(el("p", { class: "pkg__meta" }, meta));
    if (p.Depends) main.append(el("p", { class: "pkg__meta" }, `Requires: ${p.Depends}`));
    li.append(main);

    const actions = el("div", { class: "pkg__actions" });
    actions.append(el("a", { class: "btn btn--red btn--sm", href: `sileo://package/${p.Package}` }, "Get"));
    if (p.Depiction) actions.append(el("a", { class: "btn btn--sm", href: p.Depiction }, "Details"));
    if (p.Filename) {
      actions.append(el("a", {
        class: "btn btn--sm",
        href: p.Filename,
        download: "",
        "aria-label": `Download ${p.Name || p.Package} ${p.Version} .deb`,
      }, ".deb"));
    }
    li.append(actions);
    return li;
  }

  const list = $("#pkgs");
  fetch("Packages", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    })
    .then((text) => {
      const pkgs = latestOnly(parsePackages(text));
      list.replaceChildren(...pkgs.map(renderPackage));
      $("#pkg-count").textContent = `/ ${pkgs.length} ${pkgs.length === 1 ? "package" : "packages"}`;
      if (!pkgs.length) list.append(el("li", { class: "pkgs__empty" }, "No packages yet."));
    })
    .catch(() => {
      list.replaceChildren(el("li", { class: "pkgs__empty" }, "Couldn't load the package list. Add the repo in Sileo to browse it."));
    });

  /* ---------- Menu bar: highlight the section in view ---------- */

  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const a of navLinks) {
        const on = a.getAttribute("href") === `#${entry.target.id}`;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      }
    }
  }, { rootMargin: "-40% 0px -55% 0px" });
  for (const a of navLinks) {
    const section = document.querySelector(a.getAttribute("href"));
    if (section) spy.observe(section);
  }
})();
