// The work map's behaviour, shared by the concept sheets. Progressive: without it the
// map is a list of links in layer order, and every part still opens its project.
//
// - Hover or focus a part: it and the parts it uses or is used by are inked, and
//   leaders are drawn to them (only for that part, so 27 parts never tangle).
// - The row in view on the sheet inks its part (`is-current`).
// - Arrow keys walk the parts in layer order; Home and End jump to the ends.
// - A `[data-detail]` button opens its popover through a view transition.
//
// The map declares its leader style in `data-leader`: "ortho" (drawing leaders),
// "flow" (flow bands) or "vein" (fractures).

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const SVG = "http://www.w3.org/2000/svg";

type Kind = "uses" | "usedby";

function centre(el: Element, origin: DOMRect) {
  const r = (el.querySelector("[data-anchor]") ?? el).getBoundingClientRect();
  return {
    x: r.left - origin.left + r.width / 2,
    top: r.top - origin.top,
    bottom: r.bottom - origin.top,
    y: r.top - origin.top + r.height / 2,
  };
}

function pathFor(style: string, a: ReturnType<typeof centre>, b: ReturnType<typeof centre>, i: number) {
  const below = b.y > a.y + 8;
  const above = b.y < a.y - 8;
  const y1 = below ? a.bottom : a.top;
  const y2 = below ? b.top : above ? b.bottom : b.top;
  // Same row: route over the top, stepped per leader so they stay apart.
  const mid = below || above ? (y1 + y2) / 2 : Math.min(a.top, b.top) - 14 - i * 6;
  if (style === "flow") return `M${a.x} ${y1} C${a.x} ${mid} ${b.x} ${mid} ${b.x} ${y2}`;
  if (style === "vein") {
    const steps = 6;
    let d = `M${a.x} ${y1}`;
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const jitter = (s % 2 ? 1 : -1) * (5 + ((i * 7 + s * 3) % 5));
      d += ` L${a.x + (b.x - a.x) * t + jitter} ${y1 + (y2 - y1) * t}`;
    }
    return `${d} L${b.x} ${y2}`;
  }
  return `M${a.x} ${y1} V${mid} H${b.x} V${y2}`;
}

for (const map of document.querySelectorAll<HTMLElement>("[data-workmap]")) {
  const style = map.dataset.leader ?? "ortho";
  const overlay = map.querySelector<SVGSVGElement>("[data-leaders]");
  const readout = map.querySelector<HTMLElement>("[data-readout]");
  // Item-number order, which is layer order even where a layout puts tags out of it.
  const parts = [...map.querySelectorAll<HTMLElement>("a[data-part]")].sort(
    (x, y) => Number(x.dataset.n) - Number(y.dataset.n),
  );
  const byId = new Map(parts.map((p) => [p.dataset.part, p]));
  const title = (id: string) => byId.get(id)?.dataset.title ?? id;
  let focused: HTMLElement | null = null;
  let frame = 0;

  const draw = () => {
    if (!overlay || !focused) return;
    const origin = overlay.getBoundingClientRect();
    const a = centre(focused, origin);
    const links: [string, Kind][] = [
      ...(focused.dataset.uses?.split(" ").filter(Boolean) ?? []).map((id) => [id, "uses"] as [string, Kind]),
      ...(focused.dataset.usedby?.split(" ").filter(Boolean) ?? []).map((id) => [id, "usedby"] as [string, Kind]),
    ];
    const paths = links.flatMap(([id, kind], i) => {
      const el = byId.get(id);
      if (!el) return [];
      const b = centre(el, origin);
      const path = document.createElementNS(SVG, "path");
      // A "uses" leader runs from this part to what it uses; "used by" runs in.
      path.setAttribute("d", kind === "uses" ? pathFor(style, a, b, i) : pathFor(style, b, a, i));
      path.setAttribute("class", `leader leader--${kind}`);
      // A halo under each band keeps it legible across every plane colour.
      if (style !== "flow") return [path];
      const halo = path.cloneNode() as SVGPathElement;
      halo.setAttribute("class", `leader-halo leader-halo--${kind}`);
      return [halo, path];
    });
    overlay.querySelector("[data-paths]")?.replaceChildren(...paths);
    // Parts move while the map explodes on scroll, so keep the leaders on them.
    frame = requestAnimationFrame(draw);
  };

  const clear = () => {
    cancelAnimationFrame(frame);
    focused = null;
    delete map.dataset.focus;
    for (const p of parts) p.classList.remove("is-focus", "is-uses", "is-usedby");
    overlay?.querySelector("[data-paths]")?.replaceChildren();
    if (readout) readout.textContent = readout.dataset.idle ?? "";
  };

  const focus = (part: HTMLElement) => {
    if (focused === part) return;
    clear();
    focused = part;
    map.dataset.focus = part.dataset.part;
    part.classList.add("is-focus");
    const uses = part.dataset.uses?.split(" ").filter(Boolean) ?? [];
    const usedBy = part.dataset.usedby?.split(" ").filter(Boolean) ?? [];
    for (const id of uses) byId.get(id)?.classList.add("is-uses");
    for (const id of usedBy) byId.get(id)?.classList.add("is-usedby");
    if (readout) {
      const bits = [
        uses.length ? `uses ${uses.map(title).join(", ")}` : "",
        usedBy.length ? `used by ${usedBy.map(title).join(", ")}` : "",
      ].filter(Boolean);
      readout.textContent = `${part.dataset.title}${bits.length ? `: ${bits.join("; ")}` : ""}`;
    }
    draw();
  };

  for (const part of parts) {
    part.addEventListener("pointerenter", () => focus(part));
    part.addEventListener("focus", () => focus(part));
    part.addEventListener("pointerleave", () => document.activeElement !== part && clear());
    part.addEventListener("blur", clear);
  }

  map.addEventListener("keydown", (e) => {
    const i = parts.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const next = {
      ArrowDown: i + 1,
      ArrowRight: i + 1,
      ArrowUp: i - 1,
      ArrowLeft: i - 1,
      Home: 0,
      End: parts.length - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    parts[(next + parts.length) % parts.length]?.focus();
  });

  // The row in the middle of the viewport inks its part on the map.
  const rows = [...document.querySelectorAll<HTMLElement>("[data-row]")];
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = (entry.target as HTMLElement).dataset.row;
        for (const p of parts) p.classList.toggle("is-current", p.dataset.part === id || p.dataset.layer === id);
        map.dataset.current = id;
      }
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  for (const row of rows) io.observe(row);
}

// Detail A: opened from the map, through a view transition where there is one.
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-detail]")) {
  const pop = document.getElementById(button.dataset.detail ?? "");
  if (!pop) continue;
  button.addEventListener("click", (e) => {
    if (!document.startViewTransition || reduced.matches) return;
    e.preventDefault();
    document.startViewTransition(() => pop.togglePopover());
  });
}
