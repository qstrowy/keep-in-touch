const hero = document.querySelector<HTMLElement>("[data-hero]");
const sequence = document.querySelector<HTMLElement>("[data-memory-sequence]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let frameRequested = false;

function updateComposition() {
  frameRequested = false;
  if (reducedMotion.matches) {
    hero?.style.setProperty("--hero-shift", "0");
    sequence?.style.setProperty("--gather", "1");
    return;
  }

  if (hero) {
    const distance = Math.max(0, -hero.getBoundingClientRect().top);
    hero.style.setProperty("--hero-shift", String(Math.min(distance, 900)));
  }

  if (sequence) {
    const bounds = sequence.getBoundingClientRect();
    const range = Math.max(1, bounds.height - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -bounds.top / range));
    const gather = Math.max(0, Math.min(1, (progress - 0.08) / 0.67));
    sequence.style.setProperty("--gather", String(gather));
  }
}

function requestUpdate() {
  if (!frameRequested) {
    frameRequested = true;
    window.requestAnimationFrame(updateComposition);
  }
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);
reducedMotion.addEventListener("change", requestUpdate);
updateComposition();
