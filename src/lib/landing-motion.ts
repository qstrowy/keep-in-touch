const hero = document.querySelector<HTMLElement>("[data-prologue]");
const stage = document.querySelector<HTMLElement>("[data-prologue-stage]");
const sequence = document.querySelector<HTMLElement>("[data-memory-sequence]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
let frameRequested = false;

function updateComposition() {
  frameRequested = false;
  if (hero && stage) {
    const animate = !reducedMotion.matches;
    hero.classList.toggle("is-animated", animate);
    const bounds = hero.getBoundingClientRect();
    const progress = animate ? clamp(-bounds.top / Math.max(1, bounds.height - window.innerHeight)) : 1;
    const compositionScale = Math.max(1, Math.min(window.innerWidth / 1500, window.innerHeight / 1000, 2));
    stage.style.transform = `translateX(-50%) scale(${compositionScale})`;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const narrow = width < 700;
    const noteScale = narrow ? 1 : 1.2;
    const loss = smooth(0.06, 0.7, progress);
    const pullback = clamp((progress - 0.04) / 0.78);
    const artWidth = Math.min(narrow ? 430 : 520, width * (narrow ? 1.02 : 0.73), height * 0.7);
    const artHeight = (artWidth * 2) / 3;
    const x = (width - artWidth) / 2;
    const y = height - artHeight - 20;
    const closeScale = narrow ? 1 + 2.1 * 0.55 : 3.1;
    const scale = 1 + (closeScale - 1) * (1 - pullback);
    const blend = smooth(0.88, 0.98, progress);
    const layers = [
      { name: "man", x: -1, y: 0, z: 0 },
      { name: "woman", x: 1, y: 0, z: 1 },
      { name: "original", x: 0, y: 0, z: 0 },
      { name: "table", x: 0, y: 1, z: 3 },
    ];
    for (const layer of layers) {
      const element = stage.querySelector<HTMLElement>(`[data-layer="${layer.name}"]`);
      if (!element) continue;
      const dx = layer.x * ((window.innerWidth / compositionScale + artWidth * closeScale) / 2 + 60) * (1 - pullback);
      const dy =
        layer.y *
        (Math.max(height, window.innerHeight / compositionScale) - y + (artHeight * (closeScale - 1)) / 2 + 60) *
        (1 - pullback);
      Object.assign(element.style, {
        width: `${artWidth}px`,
        height: `${artHeight}px`,
        left: `${x}px`,
        top: `${y}px`,
        bottom: "auto",
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity: String(layer.name === "original" ? blend : blend < 1 ? 1 : 0),
        zIndex: String(layer.z),
      });
    }
    const opening = stage.querySelector<HTMLElement>(".kit-prologue-opening");
    const title = stage.querySelector<HTMLElement>("h1");
    const well = stage.querySelector<HTMLElement>(".kit-prologue-well");
    if (opening) opening.style.opacity = String(1 - smooth(0.28, 0.44, progress));
    if (title) title.style.opacity = String(smooth(0.66, 0.86, progress));
    if (well) well.style.opacity = String(1 - smooth(0.32, 0.64, progress));
    const featured = [
      [14, 39],
      [79, 24],
      [3, 63],
      [79, 54],
      [37, 69],
      [69, 82],
    ];
    const extra = [
      [38, 56],
      [51, 48],
      [48, 82],
      [32, 43],
    ];
    const final = [
      [0.17, 0.39],
      [0.69, 0.38],
      [0.14, 0.66],
      [0.7, 0.65],
    ];
    stage.querySelectorAll<HTMLElement>("[data-note]").forEach((element, index) => {
      const keep = index < 4;
      const px =
        index < 6
          ? featured[index][0]
          : index >= 30
            ? extra[index - 30][0]
            : (index % 6) * 17 + ((index * 19) % 13) - 5;
      const py =
        index < 6
          ? featured[index][1]
          : index >= 30
            ? extra[index - 30][1]
            : Math.floor(index / 6) * 19 + ((index * 7) % 15) - 9;
      const cardWidth = (index < 6 ? (narrow ? 100 : 125) : (narrow ? 74 : 96) + (index % 4) * 7) * noteScale;
      const baseX = Math.max(20, Math.min(width - cardWidth - 20, (width * px) / 100));
      const baseY = (height * py) / 100;
      const finalWidth = index === 1 ? cardWidth : (narrow ? 104 : 138) * noteScale;
      const finalX = keep ? Math.min(width - finalWidth - 20, Math.max(20, width * final[index][0])) : baseX;
      const finalY = keep ? height * final[index][1] : baseY;
      const depth = 0.65 + (index % 5) * 0.16;
      const dx = keep ? (finalX - baseX) * loss : loss * 12 * (baseX < width / 2 ? -1 : 1) * depth;
      const dy = keep ? (finalY - baseY) * loss : loss * (baseY < height / 2 ? -1 : 1) * 12 * 0.7;
      const angle = ((index * 23) % 25) - 12;
      Object.assign(element.style, {
        left: `${baseX}px`,
        top: `${baseY}px`,
        right: "auto",
        width: `${keep ? cardWidth + (finalWidth - cardWidth) * loss : cardWidth}px`,
        minHeight: `${(keep ? 90 * (1 - loss) + 92 * loss : index < 6 ? 90 : 70) * noteScale}px`,
        transform: `translate(${dx}px, ${dy}px) rotate(${angle * (1 - loss * 0.35)}deg) scale(${1 - loss * (keep ? 0 : 0.12)})`,
        opacity: String(keep ? 1 - loss * (narrow ? 0.38 : 0.16) : (1 - loss) * (index < 6 ? 1 : 0.82)),
        filter: `blur(${index < 6 ? 0 : index % 3 === 0 ? 1 : 0.2}px)`,
        zIndex: String(index < 6 ? 8 - index : 1),
      });
    });
  }
  if (sequence) {
    const bounds = sequence.getBoundingClientRect();
    const progress = clamp(-bounds.top / Math.max(1, bounds.height - window.innerHeight));
    sequence.style.setProperty("--gather", reducedMotion.matches ? "1" : String(clamp((progress - 0.08) / 0.67)));
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
