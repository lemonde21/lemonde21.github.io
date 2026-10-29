// Landing page carousel. Without JS the track still scrolls and snaps natively.
(() => {
  const track = document.querySelector(".carousel__track");
  if (!track) return;
  const slides = [...track.querySelectorAll(".slide")];
  const dotsBox = document.querySelector(".carousel__dots");
  const arrows = [...document.querySelectorAll(".carousel__arrows .round-btn")];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = 0;

  if (slides.length < 2) {
    document.querySelector(".carousel__arrows").hidden = true;
    dotsBox.hidden = true;
    return;
  }

  const step = () => slides[1].offsetLeft - slides[0].offsetLeft;

  function go(i) {
    const n = (i + slides.length) % slides.length; // wrap around at either end
    track.scrollTo({ left: slides[n].offsetLeft - slides[0].offsetLeft, behavior: reducedMotion ? "auto" : "smooth" });
    return n;
  }

  const dots = slides.map((slide, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", `${slide.getAttribute("aria-label")} (${i + 1} of ${slides.length})`);
    dot.addEventListener("click", () => go(i));
    dotsBox.append(dot);
    return dot;
  });

  function update() {
    current = Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / step())));
    slides.forEach((s, i) => s.classList.toggle("is-dim", i !== current));
    dots.forEach((d, i) => d.setAttribute("aria-current", String(i === current)));
  }

  let frame = 0;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, { passive: true });
  addEventListener("resize", () => go(current));

  for (const btn of arrows) btn.addEventListener("click", () => go(current + Number(btn.dataset.dir)));

  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const n = go(current + (e.key === "ArrowRight" ? 1 : -1));
      slides[n].querySelector("a").focus({ preventScroll: true });
    }
  });

  update();
})();
