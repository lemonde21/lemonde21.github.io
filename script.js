// lemonde21 portfolio: small enhancements only. Every section is readable without JS.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Syntax colouring + line numbers for the source excerpts ---------- */

  const KEYWORDS = "if|else|return|for|static|const|void|int|float|char|BOOL|self|nil|YES|NO|NULL|uint64_t";
  const TOKEN = new RegExp(
    [
      String.raw`(\/\/.*$)`,                                        // 1 comment
      String.raw`(@?"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')`,      // 2 string
      String.raw`([#%@][A-Za-z_]\w*)`,                             // 3 directive (#define, %hook, %orig)
      String.raw`(\b\d+(?:\.\d+)?(?:e-?\d+)?f?\b)`,                // 4 number
      String.raw`\b(${KEYWORDS})\b`,                               // 5 keyword
      String.raw`(\b[A-Za-z_][\w-]*(?=\s*\()|\b[A-Za-z_][\w-]*(?=:(?!:)))`, // 6 call / selector / key
      String.raw`(\b[A-Z][A-Za-z0-9_]*\b)`,                        // 7 type
    ].join("|"),
    "gm"
  );
  const CLASSES = [null, "t-com", "t-str", "t-dir", "t-num", "t-kw", "t-fn", "t-type"];

  const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function highlight(text) {
    let html = "";
    let last = 0;
    for (const m of text.matchAll(TOKEN)) {
      html += escapeHtml(text.slice(last, m.index));
      const group = m.findIndex((g, i) => i > 0 && g !== undefined);
      html += `<span class="${CLASSES[group]}">${escapeHtml(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return html + escapeHtml(text.slice(last));
  }

  for (const pre of $$(".code")) {
    const code = $("code", pre);
    const start = Number(pre.dataset.start) || 1;
    const lines = highlight(code.textContent).split("\n");
    pre.dataset.end = String(start + lines.length - 1);
    code.innerHTML = lines
      .map((line, i) => `<span class="ln" data-n="${start + i}">${line || " "}</span>`)
      .join("");
  }

  /* ---------- Roving-tabindex groups: tabs and radio groups ---------- */

  function rovingGroup(buttons, onSelect, ariaAttr) {
    const select = (btn, focus) => {
      for (const b of buttons) {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute(ariaAttr, String(on));
        b.tabIndex = on ? 0 : -1;
      }
      if (focus) btn.focus();
      onSelect(btn);
    };
    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => select(btn, false));
      btn.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          select(buttons[e.key === "Home" ? 0 : buttons.length - 1], true);
        } else if (step) {
          e.preventDefault();
          select(buttons[(i + step + buttons.length) % buttons.length], true);
        }
      });
    });
  }

  const showPanel = (btn) => {
    for (const b of btn.parentElement.children) {
      const panel = document.getElementById(b.getAttribute("aria-controls"));
      if (panel) panel.hidden = b !== btn;
    }
  };
  rovingGroup($$(".ptab"), showPanel, "aria-selected");
  rovingGroup($$("#toolkit [role=tab]"), showPanel, "aria-selected");

  /* ---------- Project tree → editor ---------- */

  const REPO = "https://github.com/lemonde21/MicSelect/blob/main/";
  const PATHS = {
    tweak: "Tweak.x",
    shared: "Shared.h",
    prefs: "micselectprefs/MSPRootListController.m",
    cli: "micselctl/main.m",
    build: ".github/workflows/build.yml",
    control: "control",
  };

  function openFile(key) {
    const pre = $(`.code[data-file="${key}"]`);
    if (!pre) return;
    for (const p of $$(".code")) p.classList.toggle("is-active", p === pre);
    for (const f of $$(".tree__file")) {
      const on = f.dataset.file === key;
      f.classList.toggle("is-active", on);
      if (on) f.setAttribute("aria-current", "true");
      else f.removeAttribute("aria-current");
    }
    $("#etab-name").textContent = pre.dataset.name;
    $("#status-lang").textContent = pre.dataset.lang;
    $("#status-desc").textContent = pre.dataset.desc;
    $("#status-link").href = `${REPO}${PATHS[key]}#L${pre.dataset.start}-L${pre.dataset.end}`;
    $(".code-wrap").scrollTop = 0;
  }
  for (const f of $$(".tree__file")) f.addEventListener("click", () => openFile(f.dataset.file));
  openFile("tweak");

  /* ---------- Settings preview: mode segment drives the terminal ---------- */

  const HINTS = {
    default: "iOS decides: plugging in earphones switches apps to the earphone microphone.",
    builtin: "Apps record from the iPad's internal microphone, even with earphones plugged in.",
    headset: "Apps always record from the earphone microphone while it's connected.",
  };
  rovingGroup($$(".settings .seg__btn"), (btn) => {
    const mode = btn.dataset.mode;
    $("#mode-hint").textContent = HINTS[mode];
    $("#term-cmd").textContent = `micsel ${mode}`;
    $("#term-out").textContent = `microphone mode set to: ${mode}`;
  }, "aria-checked");

  /* ---------- Settings preview: simulated level meter ---------- */

  const listen = $("#listen");
  const meter = $("#meter");
  let timer = null;
  let level = 0.3;

  listen.addEventListener("click", () => {
    const on = listen.getAttribute("aria-checked") !== "true";
    listen.setAttribute("aria-checked", String(on));
    clearInterval(timer);
    if (!on) {
      meter.style.width = "0%";
      return;
    }
    if (reducedMotion) {
      meter.style.width = "62%";
      return;
    }
    timer = setInterval(() => {
      // Random walk with occasional peaks, roughly like speech.
      const target = Math.random() < 0.12 ? 0.75 + Math.random() * 0.25 : 0.2 + Math.random() * 0.45;
      level += (target - level) * 0.45;
      meter.style.width = `${(level * 100).toFixed(1)}%`;
    }, 90);
  });

  /* ---------- Menu bar: highlight the section in view ---------- */

  const navLinks = $$("[data-nav]");
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

  /* ---------- Taskbar clock ---------- */

  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
  const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "numeric", year: "numeric" });
  const tick = () => {
    const now = new Date();
    $("#clock-time").textContent = timeFmt.format(now);
    $("#clock-date").textContent = dateFmt.format(now);
  };
  tick();
  setInterval(tick, 15000);
})();
